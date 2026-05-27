import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function SalesChart({ data }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: "28px",
        height: "500px",
        width: "100%",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          marginBottom: "20px",
        }}
      >
        Real Sales Analytics 📈
      </h2>

      <div
        style={{
          width: "100%",
          height: "380px",
          overflow: "hidden",
        }}
      >
        <LineChart
          width={900}
          height={350}
          data={data}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.08)"
          />

          <XAxis
            dataKey="name"
            stroke="#ccc"
          />

          <YAxis stroke="#ccc" />

          <Tooltip
            formatter={(value) => [`₹${value}`, "Revenue"]}
            contentStyle={{
              background:
                "rgba(15,23,42,0.95)",
              border:
                "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
            }}
          />

          <Line
            type="monotone"
            dataKey="sales"
            stroke="#06b6d4"
            strokeWidth={4}
            dot={{ r: 6 }}
          />
        </LineChart>
      </div>
    </div>
  );
}