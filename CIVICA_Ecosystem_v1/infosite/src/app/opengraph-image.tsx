import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e3f4f3 0%, #f4f6f9 60%, #f4f6f9 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: 32,
            background: "#ffffff",
            boxShadow: "0 10px 30px rgba(26, 37, 53, 0.12)",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#2d8c92",
            }}
          >
            C
          </div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, color: "#1a2535" }}>Civica Health</div>
        <div style={{ marginTop: 16, fontSize: 30, color: "#5a6a7e" }}>
          Software infrastructure for clinics
        </div>
      </div>
    ),
    { ...size },
  );
}
