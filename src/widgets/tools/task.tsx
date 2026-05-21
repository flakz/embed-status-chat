import { motion } from "motion/react";
import { Check } from "lucide-react";
import { ss } from "../styles";
import type { Task } from "../types";

export default function TaskCard({ task }: { task: Task }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      style={{ marginTop: 8 }}
    >
      <div style={{ ...ss.bookingCard, padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: task.notes ? 6 : 0 }}>
          <Check size={16} style={{ color: "#059669" }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: "#1e1e1e" }}>{task.title}</span>
        </div>
        {task.notes && <div style={ss.bookingDetail}>{task.notes}</div>}
      </div>
    </motion.div>
  );
}
