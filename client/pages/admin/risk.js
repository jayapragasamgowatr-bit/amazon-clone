import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getRiskAnalysis, getRiskCustomer } from "../../lib/api";

export default function Risk() {
  return <ProtectedRoute adminOnly><Inner /></ProtectedRoute>;
}

function Inner() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getRiskAnalysis({ days }));
    } catch (e) {
      setError(e.message || "Unable to load risk analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [days]);

  const lookup = async (event) => {
    if (event) event.preventDefault();
    if (!query.trim()) return;
    setCustomerLoading(true);
    setError("");
    try {
      setCustomer(await getRiskCustomer(query.trim()));
    } catch (e) {
      setError(e.message || "Unable to check this customer.");
    } finally {
      setCustomerLoading(false);
    }
  };

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.head}>
          <div>
            <span style={S.phase}>PHASE 18</span>
            <h1>Risk &amp; Anomaly Signals</h1>
            <p>Rule-based signals help administrators review unusual order patterns. A signal is not a fraud determination.</p>
          </div>
          <div>
            <select aria-label="Analysis period" value={days} onChange={(e) => setDays(Number(e.target.value))} style={S.select}>
              <option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={180}>180 days</option>
            </select>
            <button onClick={load} disabled={loading} style={S.btn}>{loading ? "Checking..." : "Refresh"}</button>
          </div>
        </div>

        {error && <div role="alert" style={S.err}>{error}</div>}

        {loading && !data ? <section style={S.panel}>Loading risk analysis...</section> : data && <>
          <div style={S.stats}>
            <Box title="Orders" value={data.summary.orders} />
            <Box title="Customers" value={data.summary.uniqueCustomers} />
            <Box title="Flagged" value={data.summary.flaggedCustomers} />
            <Box title="High risk" value={data.summary.highRisk} />
            <Box title="Medium risk" value={data.summary.mediumRisk} />
            <Box title="High-value orders" value={data.summary.highValueOrders} />
          </div>

          <section style={S.panel}>
            <h2>Customer signals</h2>
            <p style={S.muted}>Customer identifiers are masked in this summary. Use the authorized customer lookup below when investigation is necessary.</p>
            {data.signals.length === 0 ? <p>No rule-based signals were triggered in this period.</p> : <div style={S.tableWrap}>
              <table style={S.table}>
                <thead><tr><th>Masked customer</th><th>Level</th><th>Score</th><th>Orders</th><th>Cancelled</th><th>Value</th><th>Signals</th></tr></thead>
                <tbody>{data.signals.map((item) => <tr key={item.id || item.key}>
                  <td>{item.key}</td>
                  <td><span style={riskBadge(item.level)}>{item.level}</span></td>
                  <td>{item.score}</td><td>{item.orderCount}</td><td>{item.cancelledCount}</td>
                  <td>₹{Number(item.totalValue).toLocaleString("en-IN")}</td>
                  <td>{item.reasons.join(" · ")}</td>
                </tr>)}</tbody>
              </table>
            </div>}
          </section>

          <section style={S.panel}>
            <h2>Review a customer</h2>
            <form onSubmit={lookup} style={S.lookup}>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Email, phone or user ID" aria-label="Customer email, phone or user ID" style={S.input} />
              <button type="submit" disabled={customerLoading || !query.trim()} style={S.btn}>{customerLoading ? "Checking..." : "Check customer"}</button>
            </form>
            {customer && <div style={S.customer}>
              <strong>{customer.customer?.name || "Customer lookup result"}</strong>
              <span>{customer.level} risk · score {customer.score}</span>
              <p>{customer.signals?.length ? customer.signals.join(" · ") : "No rule-based customer signals."}</p>
              <small>{customer.orders?.length || 0} matching recent orders (maximum 100)</small>
            </div>}
          </section>

          <section style={S.note}><b>Methodology:</b> {data.methodology} Thresholds: ₹{Number(data.thresholds.highValueOrder).toLocaleString("en-IN")} high-value order; {data.thresholds.rapidOrderWindowMinutes}-minute rapid-order window. Signals should be reviewed by an administrator before action.</section>
        </>}
      </div>
    </main>
  );
}

function Box({ title, value }) {
  return <div style={S.box}><small>{title}</small><strong>{value}</strong></div>;
}

function riskBadge(level) {
  const colors = level === "High" ? { color: "#ff9cac", borderColor: "#773847" } : level === "Medium" ? { color: "#ffd66b", borderColor: "#6b5929" } : { color: "#9de7c1", borderColor: "#285f4a" };
  return { display: "inline-block", padding: "4px 9px", borderRadius: 99, border: `1px solid ${colors.borderColor}`, color: colors.color, fontSize: 12, fontWeight: 800 };
}

const S = {
  page: { minHeight: "90vh", background: "#07111f", color: "#eef6ff", padding: "38px 18px" },
  wrap: { maxWidth: 1250, margin: "auto" },
  head: { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap" },
  phase: { fontSize: 12, letterSpacing: 2, color: "#67e8f9" },
  btn: { margin: "10px 0 0 8px", padding: "10px 15px", border: 0, borderRadius: 10, background: "#22d3ee", color: "#06202b", fontWeight: 800, cursor: "pointer" },
  select: { padding: "10px", borderRadius: 10, background: "#0d1b2d", color: "#eef6ff", border: "1px solid #29425c" },
  stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 24 },
  box: { background: "#0d1b2d", border: "1px solid #20364e", borderRadius: 14, padding: 17, display: "grid", gap: 8 },
  panel: { background: "#0d1b2d", border: "1px solid #20364e", borderRadius: 16, padding: 20, marginTop: 18 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  lookup: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { flex: "1 1 300px", padding: 11, borderRadius: 10, border: "1px solid #29425c", background: "#091726", color: "#eef6ff" },
  customer: { marginTop: 14, padding: 15, borderRadius: 12, background: "#091726", display: "grid", gap: 7 },
  muted: { color: "#b9c9d8", fontSize: 13 },
  note: { marginTop: 18, padding: 14, borderRadius: 12, border: "1px solid #29425c", color: "#b9c9d8", fontSize: 13 },
  err: { marginTop: 15, padding: 12, borderRadius: 10, background: "#3b1117", color: "#fecaca" },
};
