import { ImageResponse } from "next/og";

export const alt = "ReNest HK moves existing furniture from an old home into a dimensionally verified new home";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const furniture = [
  { left: 34, top: 34, width: 118, height: 50 },
  { left: 174, top: 34, width: 70, height: 40 },
  { left: 34, top: 106, width: 86, height: 58 },
  { left: 142, top: 104, width: 102, height: 60 },
];

function HomePlan({ label, result, accent }: { label: string; result: string; accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 310 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: "#65706b" }}>{label}</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: accent }}>{result}</span>
      </div>
      <div style={{ width: 310, height: 218, display: "flex", position: "relative", background: "#ffffff", border: "5px solid #26312d" }}>
        <div style={{ position: "absolute", left: 160, top: 0, bottom: 0, width: 4, background: "#26312d" }} />
        {furniture.map((item, index) => (
          <div key={index} style={{ position: "absolute", ...item, border: `3px solid ${accent}`, background: index === 3 && label === "NEW HOME" ? "#dceaf2" : "#dceee5", borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#edf2ee", color: "#16201d", padding: "64px 72px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, fontWeight: 800 }}><span style={{ width: 38, height: 38, display: "flex", border: "4px solid #315d4c" }} />ReNest <span style={{ color: "#e27057", marginLeft: -8 }}>HK</span></div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#65706b" }}>AI furniture migration for compact homes</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <HomePlan label="OLD HOME" result="7 items" accent="#315d4c" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "#65706b" }}><span style={{ fontSize: 18, fontWeight: 800 }}>AI PLANNING</span><span style={{ fontSize: 48, color: "#e27057" }}>→</span><span style={{ fontSize: 16, fontWeight: 700 }}>Geometry checked</span></div>
          <HomePlan label="NEW HOME" result="6 reused · 1 replaced" accent="#315d4c" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ width: 700, fontSize: 48, lineHeight: 1.05, fontWeight: 700 }}>Your furniture already has a home. Let&apos;s find its next one.</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#315d4c" }}>Buy only what fits.</span>
        </div>
      </div>
    ),
    size,
  );
}
