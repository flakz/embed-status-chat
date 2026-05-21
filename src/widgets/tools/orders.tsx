import { motion } from "motion/react";
import { ss, PRIMARY_COLOR } from "../styles";
import { formatPrice, fmtDate } from "../format";
import type { Order } from "../types";

export default function OrdersCard({ orders }: { orders: Order[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 360 }}
    >
      {orders.map((order, idx) => (
        <div key={idx} style={ss.bookingCard}>
          <div style={ss.bookingRow}><span style={ss.bookingLabel}>Order</span><span style={ss.bookingValue}>{order.name}</span></div>
          <div style={ss.bookingRow}><span style={ss.bookingLabel}>Total</span><span style={{ ...ss.bookingValue, color: PRIMARY_COLOR }}>{formatPrice(order.total_price)}</span></div>
          <div style={ss.bookingRow}><span style={ss.bookingLabel}>Date</span><span style={ss.bookingValue}>{fmtDate(order.created_at)}</span></div>
          {order.status && <div style={{ ...ss.bookingDetail, marginTop: 6, textTransform: "capitalize" }}>{order.status}</div>}
        </div>
      ))}
    </motion.div>
  );
}
