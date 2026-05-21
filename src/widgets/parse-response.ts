import type { GenUIData } from "./types";

export function parseStructuredResponse(resp: any): GenUIData | undefined {
  if (!resp) return undefined;
  let inner = resp;
  while (inner && typeof inner === "object" && !Array.isArray(inner)) {
    if (inner.message || inner.products || inner.booking || inner.events || inner.task || inner.orders) break;
    if (inner.output && typeof inner.output === "object" && !Array.isArray(inner.output)) {
      inner = inner.output;
    } else {
      break;
    }
  }

  const gen: GenUIData = {};

  if (typeof inner.message === "string") gen.message = inner.message;
  if (Array.isArray(inner.products)) gen.products = inner.products;
  if (inner.booking && typeof inner.booking === "object") gen.booking = inner.booking;
  if (Array.isArray(inner.events)) gen.events = inner.events;
  if (inner.task && typeof inner.task === "object") gen.task = inner.task;
  if (Array.isArray(inner.orders)) gen.orders = inner.orders;

  if (gen.products || gen.booking || gen.events || gen.task || gen.orders || gen.message) return gen;
  return undefined;
}

export function getResponseText(genUI: GenUIData | undefined, resp: any): string {
  if (genUI?.message) return genUI.message;
  if (typeof resp.output === "string") return resp.output;
  if (typeof resp.response === "string") return resp.response;
  if (typeof resp.text === "string") return resp.text;
  return "";
}
