import type React from "react";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
}

export function getPrimaryColor(): string {
  return window.MarnoChatConfig?.primaryColor || "#0D72FF";
}

export function getPrimaryLight(): string {
  const color = getPrimaryColor();
  const [pr, pg, pb] = hexToRgb(color);
  return rgbToHex(
    pr + (255 - pr) * 0.90,
    pg + (255 - pg) * 0.90,
    pb + (255 - pb) * 0.90,
  );
}

// Legacy module-level export, lazy-evaluated via getter in tool files
export const PRIMARY_COLOR = getPrimaryColor();
export const PRIMARY_LIGHT = getPrimaryLight();

const Z_INDEX = { toggle: 2147483646, panel: 2147483647 } as const;

export type StyleValue = React.CSSProperties | ((...args: (string | number | boolean | undefined)[]) => React.CSSProperties);

export const ss = {
  panel: {
    position: "fixed", bottom: 74, right: 24, zIndex: Z_INDEX.panel,
    width: 400, height: 720, maxHeight: "calc(100vh - 8rem)",
    background: "#fff", borderRadius: 24,
    boxShadow: "0 12px 48px rgba(0,0,0,0.12)",
    display: "flex", flexDirection: "column", overflow: "hidden",
    border: "1px solid #f3f4f6",
  } as React.CSSProperties,
  header: {
    background: PRIMARY_COLOR, color: "#fff", padding: "14px 16px",
    display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
  } as React.CSSProperties,
  headerLeft: { display: "flex", alignItems: "center", gap: 10 } as React.CSSProperties,
  logoCircle: {
    width: 26, height: 26, borderRadius: "50%", background: "#2A2E35",
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
  } as React.CSSProperties,
  headerTitle: { fontWeight: 600, fontSize: 15, letterSpacing: "0.02em" } as React.CSSProperties,
  headerActions: { display: "flex", alignItems: "center", gap: 14 } as React.CSSProperties,
  headerBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", opacity: 0.8 } as React.CSSProperties,
  msgArea: {
    flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column",
    padding: "24px 16px 112px", scrollbarWidth: "none",
  } as React.CSSProperties,
  msgList: { display: "flex", flexDirection: "column", gap: 6, width: "100%", position: "relative" } as React.CSSProperties,
  msgRowUser: { display: "flex", flexDirection: "column", gap: 6, width: "100%", alignItems: "flex-end" } as React.CSSProperties,
  msgRowBot: { display: "flex", flexDirection: "column", gap: 6, width: "100%", alignItems: "flex-start" } as React.CSSProperties,
  bubbleUser: {
    padding: "8px 16px", borderRadius: 12, borderBottomRightRadius: 4,
    fontSize: 15, width: "fit-content", maxWidth: "88%", lineHeight: 1.375,
    background: PRIMARY_COLOR, color: "#fff", overflow: "hidden",
  } as React.CSSProperties,
  bubbleBot: {
    padding: "8px 16px", borderRadius: 12, borderBottomLeftRadius: 4,
    fontSize: 15, width: "fit-content", maxWidth: "88%", lineHeight: 1.375,
    background: "#F0F2F5", color: "#1E1E1E", overflow: "hidden",
  } as React.CSSProperties,
  thinking: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 16px", borderRadius: 12, borderBottomLeftRadius: 4,
    fontSize: 15, width: "fit-content", maxWidth: "88%",
    background: "#F0F2F5", color: "#9ca3af", overflow: "hidden",
  } as React.CSSProperties,
  toolCard: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "6px 14px", borderRadius: 12, borderBottomLeftRadius: 4,
    fontSize: 14, width: "fit-content", maxWidth: "88%",
    background: PRIMARY_LIGHT, color: PRIMARY_COLOR,
    border: `1px solid ${PRIMARY_COLOR}20`,
  } as React.CSSProperties,
  toolCardDone: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "6px 14px", borderRadius: 12, borderBottomLeftRadius: 4,
    fontSize: 14, width: "fit-content", maxWidth: "88%",
    background: "#ECFDF5", color: "#065F46",
    border: "1px solid #A7F3D0",
  } as React.CSSProperties,
  bookingCard: {
    background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb",
    padding: 14, maxWidth: 340, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  } as React.CSSProperties,
  bookingHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 } as React.CSSProperties,
  bookingTitle: { fontWeight: 600, fontSize: 15, color: "#1e1e1e" } as React.CSSProperties,
  bookingRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "6px 0", borderBottom: "1px solid #f3f4f6", gap: 8 } as React.CSSProperties,
  bookingLabel: { fontSize: 13, color: "#6b7280", flexShrink: 0 } as React.CSSProperties,
  bookingValue: { fontSize: 13, fontWeight: 500, color: "#1e1e1e", textAlign: "right", wordBreak: "break-word", overflowWrap: "break-word" } as React.CSSProperties,
  bookingDetail: {
    marginTop: 10, padding: "8px 10px", background: "#f0fdf4",
    borderRadius: 8, fontSize: 13, color: "#065f46", lineHeight: 1.5,
  } as React.CSSProperties,
  productCard: {
    display: "flex", gap: 10, background: "#fff", borderRadius: 12,
    border: "1px solid #e5e7eb", padding: 8, maxWidth: 360,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)", alignItems: "center",
  } as React.CSSProperties,
  productImg: { width: 80, height: 80, borderRadius: 8, objectFit: "contain", flexShrink: 0 } as React.CSSProperties,
  productInfo: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 } as React.CSSProperties,
  productName: { fontSize: 14, fontWeight: 600, color: "#1e1e1e", lineHeight: 1.3 } as React.CSSProperties,
  productPrice: { fontSize: 13, fontWeight: 700, color: PRIMARY_COLOR } as React.CSSProperties,
  productDesc: {
    fontSize: 12, color: "#6b7280", lineHeight: 1.4, overflow: "hidden",
    WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", maxHeight: 32,
  } as React.CSSProperties,
  suggestions: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, width: "100%" } as React.CSSProperties,
  suggestBtn: {
    background: PRIMARY_LIGHT, color: PRIMARY_COLOR, border: "none",
    borderRadius: 10, padding: "8px 14px", fontSize: 14.5, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit", outline: "none",
  } as React.CSSProperties,
  inputWrap: (confirming?: boolean): React.CSSProperties => ({
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
    padding: "44px 16px 16px",
    background: confirming ? "transparent" : "linear-gradient(to top, #fff 0%, rgba(255,255,255,0.95) 40%, transparent 100%)",
    pointerEvents: "none",
  }),
  inputBar: {
    position: "relative", display: "flex", alignItems: "center",
    borderRadius: 24, background: "#fff", border: "2px solid #e5e7eb",
    pointerEvents: "auto",
  } as React.CSSProperties,
  input: {
    width: "100%", background: "transparent", border: "none", outline: "none",
    color: "#111827", borderRadius: 20,
    padding: "10px 48px 10px 20px", fontSize: 15, fontFamily: "inherit",
    resize: "none", overflowY: "auto", maxHeight: 120,
    lineHeight: 1.4,
  } as React.CSSProperties,
  sendBtn: (active: boolean): React.CSSProperties => ({
    position: "absolute", top: "50%", transform: "translateY(-50%)", right: 5,
    width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    border: "none", cursor: active ? "pointer" : "not-allowed",
    background: active ? PRIMARY_COLOR : "#E5E5E5", color: active ? "#fff" : "#8C8C8C",
    fontFamily: "inherit", outline: "none",
  }),
  toggle: {
    position: "fixed", bottom: 24, right: 24, zIndex: Z_INDEX.toggle,
    borderRadius: "50%", overflow: "hidden", width: 40, height: 40,
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    border: "none", padding: 0, cursor: "pointer", background: "transparent",
    outline: "none", transition: "transform 0.2s, box-shadow 0.2s",
  } as React.CSSProperties,
  toggleImg: { width: "100%", height: "100%", objectFit: "cover" } as React.CSSProperties,
  confirmBar: {
    marginTop: 10, padding: 12, background: "#fff",
    borderRadius: 16, border: "1px solid #e5e7eb",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    display: "flex", flexDirection: "column", gap: 8,
    pointerEvents: "auto",
  } as React.CSSProperties,
  confirmStartBtn: {
    width: "100%", padding: "10px 0", borderRadius: 12, border: "none",
    background: PRIMARY_COLOR, color: "#fff", fontSize: 15, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  } as React.CSSProperties,
  confirmCancelBtn: {
    width: "100%", padding: "10px 0", borderRadius: 12, border: "1px solid #d1d5db",
    background: "#f9fafb", color: "#374151", fontSize: 15, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit",
  } as React.CSSProperties,
} as const satisfies Record<string, StyleValue>;
