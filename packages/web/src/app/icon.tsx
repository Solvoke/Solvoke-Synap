import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="0 0 128 128"
        width="32"
        height="32"
      >
        <rect x="4" y="4" width="120" height="120" rx="26" ry="26" fill="#1A1A1A" />
        <path
          d="M 74 30 C 50 30, 38 42, 38 54 C 38 66, 52 70, 64 70 C 76 70, 90 74, 90 86 C 90 98, 78 106, 54 106"
          fill="none"
          stroke="#E5E5E5"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="74" cy="30" r="8" fill="#F5F5F5" />
        <circle cx="54" cy="106" r="8" fill="#F5F5F5" />
        <circle cx="64" cy="70" r="5" fill="white" />
      </svg>
    </div>,
    { ...size },
  );
}
