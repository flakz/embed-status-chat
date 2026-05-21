import type { GenUIData, WebhookResponse, ProductItem, Booking, CalendarEvent, Task, Order } from "./types";

export function parseStructuredResponse(resp: WebhookResponse): GenUIData | undefined {
  if (!resp) return undefined;
  let inner: unknown = resp;
  while (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const obj = inner as Record<string, unknown>;
    if (obj.message || obj.products || obj.booking || obj.events || obj.task || obj.orders) break;
    if (obj.output && typeof obj.output === "object" && !Array.isArray(obj.output)) {
      inner = obj.output;
    } else {
      break;
    }
  }

  if (!inner || typeof inner !== "object" || Array.isArray(inner)) return undefined;
  const obj = inner as Record<string, unknown>;

  const gen: GenUIData = {};

  if (typeof obj.message === "string") gen.message = obj.message;
  if (Array.isArray(obj.products)) gen.products = obj.products as ProductItem[];
  if (obj.booking && typeof obj.booking === "object") gen.booking = obj.booking as Booking;
  if (Array.isArray(obj.events)) gen.events = obj.events as CalendarEvent[];
  if (obj.task && typeof obj.task === "object") gen.task = obj.task as Task;
  if (Array.isArray(obj.orders)) gen.orders = obj.orders as Order[];

  if (gen.products || gen.booking || gen.events || gen.task || gen.orders || gen.message) return gen;
  return undefined;
}

export function getResponseText(genUI: GenUIData | undefined, resp: WebhookResponse): string {
  if (genUI?.message) return genUI.message;
  if (typeof resp.output === "string") return resp.output;
  if (typeof resp.response === "string") return resp.response;
  if (typeof resp.text === "string") return resp.text;
  return "";
}
