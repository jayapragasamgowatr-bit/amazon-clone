import { motion } from "framer-motion";

export default function TopProducts({ products = [] }) {
  return (
    <div className="glass-card" style={{ padding: "28px" }}>
      <h2 style={{ fontSize: "28px", marginBottom: "24px" }}>
        Top Products 🔥
      </h2>
      <div style={{ display: "grid", gap: "18px" }}>
        {products.slice(0, 5).map((product) => (
          <motion.div
            key={product._id}
            whileHover={{ x: 6 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "14px 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ flex: 1 }}>
              <h4>{product.name || "Product"}</h4>
              <p style={{ opacity: 0.7 }}>
                {Number(product.quantitySold || 0)} sold
              </p>
            </div>
            <strong>
              ₹{Number(product.revenue || 0).toLocaleString("en-IN")}
            </strong>
          </motion.div>
        ))}
        {!products.length && <p style={{ opacity: 0.65 }}>No sales data yet.</p>}
      </div>
    </div>
  );
}
