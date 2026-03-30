#!/usr/bin/env bash
# ==============================================================================
# Solvoke Synap — One-Click Deploy Script
# ==============================================================================
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Solvoke/Solvoke-Synap/main/deploy.sh | bash
#   # or after cloning:
#   ./deploy.sh
#
# Environment variables (optional):
#   SYNAP_PORT          Web dashboard port (default: 3000)
#   SYNAP_DB_PASSWORD   PostgreSQL password (default: auto-generated)
#   SYNAP_DATA_DIR      Data directory for PostgreSQL (default: Docker volume)
# ==============================================================================

set -euo pipefail

# -- Constants -----------------------------------------------------------------
REPO_URL="https://github.com/Solvoke/Solvoke-Synap.git"
MIN_DOCKER_VERSION="20.10"
MIN_COMPOSE_VERSION="2.0"
HEALTH_CHECK_TIMEOUT=120
HEALTH_CHECK_INTERVAL=3
DEFAULT_PORT=3000

# -- Colors (disabled if not a terminal) ---------------------------------------
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' CYAN='' BOLD='' NC=''
fi

# -- Helpers -------------------------------------------------------------------
info()  { printf "${CYAN}[Synap]${NC} %s\n" "$*"; }
ok()    { printf "${GREEN}[Synap]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}[Synap]${NC} %s\n" "$*"; }
fail()  { printf "${RED}[Synap]${NC} %s\n" "$*" >&2; exit 1; }

version_gte() {
  # Returns 0 if $1 >= $2 (semantic version comparison)
  printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

generate_password() {
  # Generate a random 16-char alphanumeric password
  LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 16 || true
}

# -- Pre-flight checks ---------------------------------------------------------
preflight() {
  info "Running pre-flight checks..."

  # Check Docker
  if ! command -v docker &>/dev/null; then
    fail "Docker is not installed. Install it from https://docs.docker.com/get-docker/"
  fi
  local docker_ver
  docker_ver=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "0.0.0")
  if ! version_gte "$docker_ver" "$MIN_DOCKER_VERSION"; then
    fail "Docker $MIN_DOCKER_VERSION+ required (found $docker_ver). Please upgrade."
  fi

  # Check Docker Compose (v2 plugin)
  if ! docker compose version &>/dev/null; then
    fail "Docker Compose v2 is not available. Install it: https://docs.docker.com/compose/install/"
  fi
  local compose_ver
  compose_ver=$(docker compose version --short 2>/dev/null | sed 's/^v//')
  if ! version_gte "$compose_ver" "$MIN_COMPOSE_VERSION"; then
    fail "Docker Compose $MIN_COMPOSE_VERSION+ required (found $compose_ver). Please upgrade."
  fi

  # Check Docker daemon is running
  if ! docker info &>/dev/null; then
    fail "Docker daemon is not running. Start Docker and try again."
  fi

  # Check disk space (need at least 2GB free)
  local available_gb
  if command -v df &>/dev/null; then
    available_gb=$(df -BG . 2>/dev/null | awk 'NR==2 {gsub(/G/,"",$4); print $4}' || echo "999")
    if [ "${available_gb:-999}" -lt 2 ] 2>/dev/null; then
      warn "Low disk space (${available_gb}GB free). At least 2GB recommended."
    fi
  fi

  ok "Pre-flight checks passed (Docker $docker_ver, Compose $compose_ver)"
}

# -- Port check ----------------------------------------------------------------
check_port() {
  local port=$1
  if command -v lsof &>/dev/null; then
    if lsof -i :"$port" -sTCP:LISTEN &>/dev/null; then
      return 1
    fi
  elif command -v ss &>/dev/null; then
    if ss -tlnp | grep -q ":$port "; then
      return 1
    fi
  elif command -v netstat &>/dev/null; then
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
      return 1
    fi
  fi
  return 0
}

# -- Clone or update repo ------------------------------------------------------
setup_repo() {
  # If we're already in a Solvoke-Synap repo, skip clone
  if [ -f "docker-compose.yml" ] && [ -f "Dockerfile" ]; then
    info "Using existing directory: $(pwd)"
    return
  fi

  # If Solvoke-Synap directory exists, enter it
  if [ -d "Solvoke-Synap" ]; then
    cd Solvoke-Synap
    info "Found existing Solvoke-Synap directory, pulling latest..."
    git pull --ff-only origin main 2>/dev/null || warn "Could not pull latest (offline or no git). Using existing files."
    return
  fi

  # Fresh clone
  info "Cloning Solvoke Synap..."
  if ! command -v git &>/dev/null; then
    fail "Git is not installed. Install git and try again."
  fi
  git clone --depth 1 "$REPO_URL" Solvoke-Synap
  cd Solvoke-Synap
  ok "Repository cloned."
}

# -- Configure -----------------------------------------------------------------
configure() {
  local port="${SYNAP_PORT:-$DEFAULT_PORT}"
  local db_password="${SYNAP_DB_PASSWORD:-}"

  # Check port availability
  if ! check_port "$port"; then
    warn "Port $port is already in use."
    # Try next available port
    local alt_port=$((port + 1))
    while ! check_port "$alt_port" && [ "$alt_port" -lt $((port + 100)) ]; do
      alt_port=$((alt_port + 1))
    done
    if check_port "$alt_port"; then
      warn "Using port $alt_port instead."
      port=$alt_port
    else
      fail "No available port found in range $port-$((port + 100)). Set SYNAP_PORT manually."
    fi
  fi

  # Generate DB password if not provided
  if [ -z "$db_password" ]; then
    db_password=$(generate_password)
    info "Generated random database password."
  fi

  # Write .env for docker-compose override
  cat > .env <<EOF
# Auto-generated by deploy.sh — $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Re-run deploy.sh or edit this file to change settings.
SYNAP_PORT=$port
POSTGRES_PASSWORD=$db_password
DATABASE_URL=postgresql://synap:${db_password}@db:5432/synap
EOF

  ok "Configuration saved to .env (port: $port)"
}

# -- Generate docker-compose override -----------------------------------------
generate_override() {
  # Only create override if port or password differs from defaults
  if [ ! -f .env ]; then
    return
  fi

  # shellcheck disable=SC1091
  source .env

  cat > docker-compose.override.yml <<EOF
# Auto-generated by deploy.sh — do not commit this file
services:
  web:
    ports:
      - "${SYNAP_PORT:-3000}:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
  db:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
EOF

  info "Generated docker-compose.override.yml"
}

# -- Build and start -----------------------------------------------------------
deploy() {
  info "Starting Solvoke Synap..."

  # Pull base images first (better error messages if network fails)
  docker compose pull db 2>/dev/null || true

  # Build and start
  if ! docker compose up -d --build 2>&1; then
    fail "Failed to start services. Check 'docker compose logs' for details."
  fi

  ok "Containers started."
}

# -- Health check --------------------------------------------------------------
wait_for_healthy() {
  # shellcheck disable=SC1091
  [ -f .env ] && source .env
  local port="${SYNAP_PORT:-$DEFAULT_PORT}"
  local url="http://localhost:${port}/api/health"
  local elapsed=0

  info "Waiting for Synap to be ready (timeout: ${HEALTH_CHECK_TIMEOUT}s)..."

  while [ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]; do
    local status
    status=$(curl -sf "$url" 2>/dev/null | grep -o '"status":"ok"' || true)
    if [ -n "$status" ]; then
      ok "Synap is healthy."
      return 0
    fi

    # Check if container is still running (not in restart loop)
    if ! docker compose ps --format json 2>/dev/null | grep -q '"web"' && \
       ! docker compose ps 2>/dev/null | grep -q "web.*Up"; then
      # Container might have crashed
      local exit_log
      exit_log=$(docker compose logs --tail=5 web 2>/dev/null || true)
      if echo "$exit_log" | grep -qi "error\|fatal\|panic"; then
        fail "Web container crashed during startup. Logs:\n$exit_log"
      fi
    fi

    sleep $HEALTH_CHECK_INTERVAL
    elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
    printf "."
  done

  echo ""
  warn "Health check timed out after ${HEALTH_CHECK_TIMEOUT}s."
  warn "The service may still be starting. Check: docker compose logs web"
  return 1
}

# -- Summary -------------------------------------------------------------------
print_summary() {
  # shellcheck disable=SC1091
  [ -f .env ] && source .env
  local port="${SYNAP_PORT:-$DEFAULT_PORT}"

  echo ""
  printf "${BOLD}============================================${NC}\n"
  printf "${BOLD}  Solvoke Synap is running.${NC}\n"
  printf "${BOLD}============================================${NC}\n"
  echo ""
  printf "  Dashboard:  ${CYAN}http://localhost:${port}${NC}\n"
  printf "  Health:     ${CYAN}http://localhost:${port}/api/health${NC}\n"
  echo ""
  printf "  Manage:\n"
  printf "    Stop:     docker compose down\n"
  printf "    Logs:     docker compose logs -f web\n"
  printf "    Restart:  docker compose restart web\n"
  printf "    Update:   git pull && docker compose up -d --build\n"
  echo ""
  printf "  Config:     .env (port, database password)\n"
  echo ""
}

# -- Main ----------------------------------------------------------------------
main() {
  echo ""
  printf "${BOLD}Solvoke Synap — One-Click Deploy${NC}\n"
  echo ""

  preflight
  setup_repo
  configure
  generate_override
  deploy
  wait_for_healthy && print_summary
}

main "$@"
