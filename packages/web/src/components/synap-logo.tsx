/**
 * Solvoke Synap brand logo — S-shaped synapse icon.
 * Used in sidebar header, favicon fallback, and brand display.
 */
export function SynapLogo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Solvoke Synap"
    >
      <title>Solvoke Synap</title>
      <defs>
        <linearGradient id="synap-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A1A1A" />
          <stop offset="100%" stopColor="#2D2D2D" />
        </linearGradient>
        <filter id="synap-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect x="4" y="4" width="120" height="120" rx="26" ry="26" fill="url(#synap-bg)" />
      <rect x="4" y="4" width="120" height="120" rx="26" ry="26" fill="white" opacity="0.04" />
      <rect x="4" y="4" width="120" height="60" rx="26" ry="26" fill="white" opacity="0.03" />

      {/* S-shaped synapse path — shadow */}
      <path
        d="M 74 30 C 50 30, 38 42, 38 54 C 38 66, 52 70, 64 70 C 76 70, 90 74, 90 86 C 90 98, 78 106, 54 106"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* S-shaped synapse path — main */}
      <path
        d="M 74 30 C 50 30, 38 42, 38 54 C 38 66, 52 70, 64 70 C 76 70, 90 74, 90 86 C 90 98, 78 106, 54 106"
        fill="none"
        stroke="#E5E5E5"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Top node */}
      <circle cx="74" cy="30" r="10" fill="rgba(255,255,255,0.08)" />
      <circle cx="74" cy="30" r="6" fill="#F5F5F5" />

      {/* Bottom node */}
      <circle cx="54" cy="106" r="10" fill="rgba(255,255,255,0.08)" />
      <circle cx="54" cy="106" r="6" fill="#F5F5F5" />

      {/* Synapse spark */}
      <circle cx="64" cy="70" r="8" fill="#999999" opacity="0.2" filter="url(#synap-glow)" />
      <circle cx="64" cy="70" r="4" fill="#CCCCCC" />
      <circle cx="64" cy="70" r="2" fill="white" />
    </svg>
  );
}
