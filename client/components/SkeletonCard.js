export default function SkeletonCard() {
  return (
    <div
      className="product-card skeleton-card"
      style={{
        padding: "18px",
      }}
    >
      <div
        className="skeleton shimmer"
        style={{
          height: "220px",
          borderRadius: "16px",
        }}
      />

      <div
        className="skeleton shimmer"
        style={{
          height: "24px",
          marginTop: "18px",
          borderRadius: "10px",
        }}
      />

      <div
        className="skeleton shimmer"
        style={{
          height: "18px",
          marginTop: "12px",
          borderRadius: "10px",
        }}
      />

      <div
        className="skeleton shimmer"
        style={{
          height: "18px",
          width: "60%",
          marginTop: "8px",
          borderRadius: "10px",
        }}
      />

      <div
        className="skeleton shimmer"
        style={{
          height: "44px",
          marginTop: "20px",
          borderRadius: "14px",
        }}
      />
    </div>
  );
}