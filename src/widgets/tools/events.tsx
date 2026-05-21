import React from "react";
import { motion } from "motion/react";
import { ss } from "../styles";
import type { CalendarEvent } from "../types";

function fmtDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {}
  return dateStr;
}

function fmtTime(start: string, end: string) {
  try {
    const s = new Date(start);
    const e = new Date(end);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()))
      return `${s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} - ${e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  } catch {}
  return "";
}

export default function EventsCard({ events }: { events: CalendarEvent[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 360 }}
    >
      {events.map((event, idx) => (
        <div key={idx} style={ss.bookingCard}>
          <div style={ss.bookingHeader}>
            <span style={{ fontSize: 18 }}>📆</span>
            <span style={ss.bookingTitle}>{event.summary || "Event"}</span>
            <span style={{ fontSize: 12, color: event.status === "confirmed" ? "#059669" : "#6b7280", marginLeft: "auto", padding: "2px 8px", background: "#f0fdf4", borderRadius: 6 }}>
              {event.status}
            </span>
          </div>
          {event.start && <div style={ss.bookingRow}><span style={ss.bookingLabel}>Date</span><span style={ss.bookingValue}>{fmtDate(event.start)}</span></div>}
          {event.start && event.end && <div style={ss.bookingRow}><span style={ss.bookingLabel}>Time</span><span style={ss.bookingValue}>{fmtTime(event.start, event.end)}</span></div>}
        </div>
      ))}
    </motion.div>
  );
}
