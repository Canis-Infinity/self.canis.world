import { ImageResponse } from "next/og";
export const alt = "Self — A little space for yourself";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#171717",
        color: "#fafafa",
        padding: 80,
      }}
    >
      <div style={{ fontSize: 34, display: "flex" }}>PERSONAL JOURNAL</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -8 }}>
          self.
        </div>
        <div style={{ fontSize: 36, color: "#a3a3a3", marginTop: 16 }}>
          A little space for yourself.
        </div>
      </div>
      <div style={{ fontSize: 24, color: "#a3a3a3", display: "flex" }}>
        self.canis.world
      </div>
    </div>,
    size,
  );
}
