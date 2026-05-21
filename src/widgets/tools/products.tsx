import React from "react";
import { motion } from "motion/react";
import { ss, PRIMARY_COLOR } from "../styles";
import type { ProductItem } from "../types";

function formatPrice(price: string | number): string {
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(n)) return String(price);
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function ProductsCard({ products }: { products: ProductItem[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 360 }}
    >
      {products.map((item, idx) => (
        <div key={idx} style={ss.productCard}>
          {item.image && <img src={item.image} alt={item.title} style={ss.productImg} />}
          <div style={ss.productInfo}>
            <div style={ss.productName}>{item.title}</div>
            {item.price && <div style={ss.productPrice}>{formatPrice(item.price)}</div>}
            {item.description && <div style={ss.productDesc}>{item.description}</div>}
            {item.handle && (
              <a href={`https://anarcx.in/products/${item.handle}`} target="_blank" style={{ fontSize: 12, color: PRIMARY_COLOR, textDecoration: "none", fontWeight: 500 }}>
                View product →
              </a>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
