import React from "react";

export const PRIMARY_COLOR = window.MarnoChatConfig?.primaryColor || "#0D72FF";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
}
const [pr, pg, pb] = hexToRgb(PRIMARY_COLOR);
export const PRIMARY_LIGHT = rgbToHex(
  pr + (255 - pr) * 0.90,
  pg + (255 - pg) * 0.90,
  pb + (255 - pb) * 0.90,
);

export const ss: Record<string, React.CSSProperties | ((...args: any[]) => React.CSSProperties)> = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 2147483646,
  },
  panel: {
    position: "fixed", bottom: 74, right: 24, zIndex: 2147483647,
    width: 400, height: 720, maxHeight: "calc(100vh - 8rem)",
    background: "#fff", borderRadius: 24,
    boxShadow: "0 12px 48px rgba(0,0,0,0.12)",
    display: "flex", flexDirection: "column", overflow: "hidden",
    border: "1px solid #f3f4f6",
    fontFamily: "'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    background: PRIMARY_COLOR, color: "#fff", padding: "14px 16px",
    display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  logoCircle: {
    width: 26, height: 26, borderRadius: "50%", background: "#2A2E35",
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
  },
  headerTitle: { fontWeight: 600, fontSize: 15, letterSpacing: "0.02em" },
  headerActions: { display: "flex", alignItems: "center", gap: 14 },
  headerBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", opacity: 0.8 },
  msgArea: {
    flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column",
    padding: "24px 16px 112px", scrollbarWidth: "none",
  } as React.CSSProperties,
  msgList: { display: "flex", flexDirection: "column" as const, gap: 6, width: "100%", position: "relative" as const },
  msgRowUser: { display: "flex", flexDirection: "column" as const, gap: 6, width: "100%", alignItems: "flex-end" },
  msgRowBot: { display: "flex", flexDirection: "column" as const, gap: 6, width: "100%", alignItems: "flex-start" },
  bubbleUser: {
    padding: "8px 16px", borderRadius: 12, borderBottomRightRadius: 4,
    fontSize: 15, width: "fit-content" as const, maxWidth: "88%", lineHeight: 1.375,
    background: PRIMARY_COLOR, color: "#fff", overflow: "hidden",
  },
  bubbleBot: {
    padding: "8px 16px", borderRadius: 12, borderBottomLeftRadius: 4,
    fontSize: 15, width: "fit-content" as const, maxWidth: "88%", lineHeight: 1.375,
    background: "#F0F2F5", color: "#1E1E1E", overflow: "hidden",
  },
  thinking: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 16px", borderRadius: 12, borderBottomLeftRadius: 4,
    fontSize: 15, width: "fit-content" as const, maxWidth: "88%",
    background: "#F0F2F5", color: "#9ca3af",
  },
  toolCard: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", borderRadius: 12, borderBottomLeftRadius: 4,
    fontSize: 14, width: "fit-content" as const, maxWidth: "88%",
    background: PRIMARY_LIGHT, color: PRIMARY_COLOR,
    border: `1px solid ${PRIMARY_COLOR}20`,
  },
  toolCardDone: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", borderRadius: 12, borderBottomLeftRadius: 4,
    fontSize: 14, width: "fit-content" as const, maxWidth: "88%",
    background: "#ECFDF5", color: "#065F46",
    border: "1px solid #A7F3D0",
  },
  bookingCard: {
    background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb",
    padding: 14, maxWidth: 320, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  bookingHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  bookingTitle: { fontWeight: 600, fontSize: 15, color: "#1e1e1e" },
  bookingRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f3f4f6" },
  bookingLabel: { fontSize: 13, color: "#6b7280" },
  bookingValue: { fontSize: 13, fontWeight: 500, color: "#1e1e1e" },
  bookingDetail: {
    marginTop: 10, padding: "8px 10px", background: "#f0fdf4",
    borderRadius: 8, fontSize: 13, color: "#065f46", lineHeight: 1.5,
  },
  productCard: {
    display: "flex", gap: 10, background: "#fff", borderRadius: 12,
    border: "1px solid #e5e7eb", padding: 8, maxWidth: 360,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)", alignItems: "center",
  },
  productImg: { width: 80, height: 80, borderRadius: 8, objectFit: "contain" as const, flexShrink: 0 },
  productInfo: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 },
  productName: { fontSize: 14, fontWeight: 600, color: "#1e1e1e", lineHeight: 1.3 },
  productPrice: { fontSize: 13, fontWeight: 700, color: PRIMARY_COLOR },
  productDesc: {
    fontSize: 12, color: "#6b7280", lineHeight: 1.4, overflow: "hidden",
    WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical" as const, maxHeight: 32,
  },
  suggestions: { display: "flex", flexWrap: "wrap" as const, gap: 8, marginTop: 8, width: "100%" },
  suggestBtn: {
    background: PRIMARY_LIGHT, color: PRIMARY_COLOR, border: "none",
    borderRadius: 10, padding: "8px 14px", fontSize: 14.5, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit", outline: "none",
  },
  inputWrap: {
    position: "absolute" as const, bottom: 0, left: 0, right: 0,
    padding: "44px 16px 16px",
    background: "linear-gradient(to top, #fff 0%, rgba(255,255,255,0.95) 40%, transparent 100%)",
    pointerEvents: "none" as const,
  },
  inputBar: {
    position: "relative" as const, display: "flex", alignItems: "center",
    borderRadius: 9999, background: "#fff", border: "2px solid #e5e7eb",
    pointerEvents: "auto" as const,
  },
  input: {
    width: "100%", background: "transparent", border: "none", outline: "none",
    color: "#111827", borderRadius: 9999,
    padding: "10px 48px 10px 20px", fontSize: 15, fontFamily: "inherit",
  },
  sendBtn: (active: boolean): React.CSSProperties => ({
    position: "absolute", top: "50%", transform: "translateY(-50%)", right: 5,
    width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", cursor: active ? "pointer" : "not-allowed",
    background: active ? PRIMARY_COLOR : "#E5E5E5", color: active ? "#fff" : "#8C8C8C",
    fontFamily: "inherit", outline: "none",
  }),
  toggle: {
    position: "fixed" as const, bottom: 24, right: 24, zIndex: 2147483646,
    borderRadius: "50%", overflow: "hidden", width: 40, height: 40,
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    border: "none", padding: 0, cursor: "pointer", background: "transparent",
    outline: "none", transition: "transform 0.2s, box-shadow 0.2s",
  },
  toggleImg: { width: "100%", height: "100%", objectFit: "cover" as const },
};
