import { motion } from "framer-motion";

export default function AdminStatsCard({
  title,
  value,
  icon,
  color,
}) {
  return (
    <motion.div
      whileHover={{
        y: -8,
        scale: 1.02,
      }}
      className="glass-card"
      style={{
        padding: "28px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-40px",
          right: "-40px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: color,
          filter: "blur(50px)",
          opacity: 0.35,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              opacity: 0.7,
              fontSize: "15px",
              marginBottom: "10px",
            }}
          >
            {title}
          </p>

          <h2
            style={{
              fontSize: "34px",
              fontWeight: "800",
            }}
          >
            {value}
          </h2>
        </div>

        <div
          style={{
            fontSize: "42px",
          }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}