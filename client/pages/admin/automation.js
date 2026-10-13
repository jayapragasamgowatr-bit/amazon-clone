import { useEffect, useState } from "react";
import Head from "next/head";
import { getAutomationAlerts, runAutomationScan, resolveAutomationAlert } from "../../lib/api";

export default function AutomationPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [resolvingId, setResolvingId] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("open");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAutomationAlerts({ status });
      setAlerts(result.alerts || []);
    } catch (e) {
      setError(e.message || "Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const scan = async () => {
    setScanning(true);
    setError("");
    try {
      await runAutomationScan();
      await load();
    } catch (e) {
      setError(e.message || "Scan failed.");
    } finally {
      setScanning(false);
    }
  };

  const resolve = async (id) => {
    setResolvingId(id);
    setError("");
    try {
      await resolveAutomationAlert(id);
      await load();
    } catch (e) {
      setError(e.message || "Unable to mark this alert reviewed.");
    } finally {
      setResolvingId("");
    }
  };

  return <>
    <Head><title>AI Automation | Waventra Vetric</title></Head>
    <main style={styles.page}>
      <div style={styles.header}>
        <div><h1>AI Automation</h1><p>Operational alerts generated from application data. Review before taking action.</p></div>
        <div style={styles.actions}>
          <select aria-label="Alert status" value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select}>
            <option value="open">Open</option><option value="resolved">Reviewed / resolved</option><option value="all">All</option>
          </select>
          <button onClick={scan} disabled={scanning} style={styles.button}>{scanning ? "Scanning..." : "Run Scan"}</button>
        </div>
      </div>
      {error && <div role="alert" style={styles.error}>{error}</div>}
      {loading ? <div style={styles.card}>Loading alerts...</div> : alerts.length === 0 ? <div style={styles.card}><h3>No alerts</h3><p>No matching operational signals were found.</p></div> :
        <div style={styles.grid}>{alerts.map((alert) => <div key={alert._id} style={styles.card}>
          <div style={styles.row}>
            <span style={{ ...styles.badge, ...(alert.severity === "critical" ? styles.critical : alert.severity === "warning" ? styles.warning : styles.info) }}>{String(alert.severity || "info").toUpperCase()}</span>
            <span>{alert.detectedAt ? new Date(alert.detectedAt).toLocaleString() : "Detection time unavailable"}</span>
          </div>
          <h3>{alert.title}</h3><p>{alert.message}</p><small>Type: {alert.type}</small>
          {alert.type === "HIGH_RISK" && <p style={styles.reviewHint}>Risk signals are indicators for administrator review, not a finding of fraud.</p>}
          {alert.status === "open" ? <button onClick={() => resolve(alert._id)} disabled={resolvingId === alert._id} style={styles.resolve}>{resolvingId === alert._id ? "Saving..." : "Mark reviewed & resolve"}</button> :
            <div style={styles.resolved}>
              <strong>Reviewed / resolved</strong>
              <span>{alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : "Review time not recorded"}</span>
              {alert.resolvedBy?.name && <span>By {alert.resolvedBy.name}</span>}
            </div>}
        </div>)}</div>}
      <div style={styles.note}>Automation does not automatically block customers or orders. Alerts are review signals; the admin remains responsible for decisions.</div>
    </main>
  </>;
}

const styles = {
  page: { minHeight: "100vh", padding: "32px", background: "#071126", color: "#eef4ff", fontFamily: "Inter,Arial,sans-serif" },
  header: { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center", flexWrap: "wrap", marginBottom: 24 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
  select: { padding: "11px 14px", borderRadius: 10, background: "#101d38", color: "white", border: "1px solid #2a3d63" },
  button: { padding: "11px 16px", border: 0, borderRadius: 10, background: "#18c8e8", color: "#04101d", fontWeight: 800, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 },
  card: { background: "#0d1930", border: "1px solid #20365d", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,.18)" },
  row: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#93a7c7" },
  badge: { padding: "5px 8px", borderRadius: 999, fontWeight: 800 },
  critical: { background: "#4a1c2a", color: "#ff9cac" },
  warning: { background: "#463a17", color: "#ffd66b" },
  info: { background: "#163b4a", color: "#77e4ff" },
  resolve: { marginTop: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid #36527e", background: "#123047", color: "#b9e9f4", cursor: "pointer", fontWeight: 700 },
  resolved: { marginTop: 14, padding: 12, display: "grid", gap: 5, borderRadius: 8, background: "#102b25", color: "#a7f3d0", fontSize: 13 },
  reviewHint: { color: "#ffd66b", fontSize: 13 },
  error: { background: "#481d2a", color: "#ffb7c3", padding: 14, borderRadius: 10, marginBottom: 16 },
  note: { marginTop: 24, color: "#7f94b8", fontSize: 13 },
};
