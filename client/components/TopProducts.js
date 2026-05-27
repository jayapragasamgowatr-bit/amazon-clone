import { motion } from "framer-motion";

export default function TopProducts({
  products,
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: "28px",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          marginBottom: "24px",
        }}
      >
        Top Products 🔥
      </h2>

      <div
        style={{
          display: "grid",
          gap: "18px",
        }}
      >
        {products
          .slice(0, 5)
          .map((product) => (
            <motion.div
              key={product._id}
              whileHover={{
                x: 6,
              }}
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "16px",
                padding:
                  "14px 0",
                borderBottom:
                  "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: "70px",
                  height: "70px",
                  objectFit:
                    "contain",
                  padding: "8px",
                  background:
                    "rgba(255,255,255,0.05)",
                  borderRadius:
                    "14px",
                }}
              />

              <div
                style={{
                  flex: 1,
                }}
              >
                <h4>
                  {product.name}
                </h4>

                <p
                  style={{
                    opacity: 0.7,
                  }}
                >
                  ₹
                  {product.price}
                </p>
              </div>

              <span
                style={{
                  fontSize: "22px",
                }}
              >
                ⭐
              </span>
            </motion.div>
          ))}
      </div>
    </div>
  );
}