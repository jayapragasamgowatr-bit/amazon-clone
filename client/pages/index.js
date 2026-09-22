import dynamic from "next/dynamic";

const HomePage = dynamic(
  () => import("../components/HomePage"),
  {
    ssr: false,

    loading: () => (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              margin: "0 auto 18px",
              borderRadius: "50%",
              border: "4px solid rgba(14,165,233,0.15)",
              borderTopColor: "#0284c7",
              animation: "wateros-spin 0.8s linear infinite",
            }}
          />

          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 800,
            }}
          >
            Loading WaterOS...
          </h2>

          <p
            style={{
              marginTop: "8px",
              opacity: 0.6,
            }}
          >
            Please wait...
          </p>
        </div>

        <style jsx>{`
          @keyframes wateros-spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    ),
  }
);

export default function IndexPage() {
  return <HomePage />;
}