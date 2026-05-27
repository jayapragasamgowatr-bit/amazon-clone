export default function SkeletonOrder() {
  return (
    <div
      className="glass-card"
      style={{
        padding: "30px",
      }}
    >
      <div
        className="skeleton shimmer"
        style={{
          height: "30px",
          width: "220px",
          borderRadius: "12px",
        }}
      />

      <div
        className="skeleton shimmer"
        style={{
          height: "18px",
          width: "150px",
          marginTop: "12px",
          borderRadius: "10px",
        }}
      />

      <div
        style={{
          marginTop: "28px",
          display: "grid",
          gap: "18px",
        }}
      >
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            style={{
              display: "flex",
              gap: "18px",
              alignItems: "center",
            }}
          >
            <div
              className="skeleton shimmer"
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "16px",
              }}
            />

            <div
              style={{
                flex: 1,
              }}
            >
              <div
                className="skeleton shimmer"
                style={{
                  height: "20px",
                  width: "220px",
                  borderRadius: "10px",
                }}
              />

              <div
                className="skeleton shimmer"
                style={{
                  height: "16px",
                  width: "120px",
                  marginTop: "10px",
                  borderRadius: "10px",
                }}
              />
            </div>

            <div
              className="skeleton shimmer"
              style={{
                width: "80px",
                height: "24px",
                borderRadius: "10px",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}