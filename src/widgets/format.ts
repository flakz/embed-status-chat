export function fmtDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {}
  return dateStr;
}

export function fmtTime(start: string, end: string) {
  try {
    const s = new Date(start);
    const e = new Date(end);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()))
      return `${s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} - ${e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  } catch {}
  return "";
}

export function formatPrice(price: string | number): string {
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(n)) return String(price);
  const symbol = window.MarnoChatConfig?.currencySymbol || "₹";
  const locale = window.MarnoChatConfig?.currencyLocale || "en-IN";
  return `${symbol}${n.toLocaleString(locale)}`;
}
