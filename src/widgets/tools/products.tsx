import { motion } from "motion/react";
import { ss, PRIMARY_COLOR } from "../styles";
import { formatPrice } from "../format";
import type { ProductItem } from "../types";

export default function ProductsCard({ products }: { products: ProductItem[] }) {
  const storeUrl = window.MarnoChatConfig?.storeUrl;

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
            {item.handle && storeUrl && (
              <a href={`${storeUrl}/products/${item.handle}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: PRIMARY_COLOR, textDecoration: "none", fontWeight: 500 }}>
                View product →
              </a>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
