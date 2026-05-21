export function toolIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("search") || lower.includes("duck") || lower.includes("google") || lower.includes("scrappa")) return "🔍";
  if (lower.includes("create_event") || lower.includes("book")) return "📅";
  if (lower.includes("get_event") || lower.includes("calendar") || lower.includes("schedule")) return "📆";
  if (lower.includes("email") || lower.includes("mail")) return "📧";
  if (lower.includes("weather")) return "🌤️";
  if (lower.includes("product") || lower.includes("shopify") || lower.includes("inventory") || lower.includes("store")) return "🛍️";
  if (lower.includes("database") || lower.includes("query")) return "🗄️";
  if (lower.includes("code") || lower.includes("api")) return "⚙️";
  if (lower.includes("image") || lower.includes("picture")) return "🖼️";
  if (lower.includes("create_task") || lower.includes("todo")) return "✅";
  return "🔧";
}

export function toolLabel(name: string) {
  const lower = name.toLowerCase();
  if (lower === "search" || lower.includes("duck")) return `Searching…`;
  if (lower.includes("create_event") || lower.includes("book")) return `Booking…`;
  if (lower.includes("get_event") || lower.includes("calendar") || lower.includes("schedule")) return `Checking schedule…`;
  if (lower.includes("email")) return `Sending email…`;
  if (lower.includes("weather")) return `Getting weather…`;
  if (lower.includes("product") || lower.includes("shopify") || lower.includes("inventory") || lower.includes("store")) return `Fetching products…`;
  if (lower.includes("create_task") || lower.includes("todo")) return `Creating task…`;
  return `Running ${name}…`;
}

export function toolDoneLabel(name: string) {
  const lower = name.toLowerCase();
  if (lower === "search" || lower.includes("duck")) return `Search complete`;
  if (lower.includes("create_event") || lower.includes("book")) return `Appointment booked`;
  if (lower.includes("get_event") || lower.includes("calendar")) return `Schedule checked`;
  if (lower.includes("email")) return `Email sent`;
  if (lower.includes("product") || lower.includes("shopify") || lower.includes("inventory") || lower.includes("store")) return `Products loaded`;
  if (lower.includes("create_task") || lower.includes("todo")) return `Task created`;
  return `${name} complete`;
}
