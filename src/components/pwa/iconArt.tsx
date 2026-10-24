import { ImageResponse } from "next/og";

const AMBER = "#ffd60a";
const INK = "#14171a";

/** The Saath mark: two riders sharing one ride, drawn as two overlapping rings. `scale` shrinks the art for maskable safe zones. */
export function iconResponse(px: number, scale = 1, rounded = false) {
  const art = px * 0.72 * scale;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: AMBER,
          borderRadius: rounded ? px * 0.22 : 0,
        }}
      >
        <svg width={art} height={art} viewBox="0 0 100 100">
          <circle cx="36" cy="50" r="24" fill="none" stroke={INK} strokeWidth="11" />
          <circle cx="64" cy="50" r="24" fill="none" stroke={INK} strokeWidth="11" />
          <circle cx="50" cy="50" r="6" fill={INK} />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
