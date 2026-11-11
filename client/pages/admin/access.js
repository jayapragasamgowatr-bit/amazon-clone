import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import ProtectedRoute from "../../components/ProtectedRoute";
import SEO from "../../components/SEO";
import { useAuth } from "../../context/AuthContext";
import { getUsers, setUserBlocked, setUserRole } from "../../lib/api";
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, hasPermission, roleOf } from "../../lib/permissions";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

function SuspendDialog({ person, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await setUserBlocked(person._id, true, reason.trim());
      toast.success(data?.message || "Account suspended");
      onDone();
    } catch (error) {
      toast.error(error?.message || "The account could not be suspended.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label="Suspend account">
      <form className="ui-dialog" onSubmit={submit}>
        <h2>Suspend {person.name}?</h2>
        <p className="ui-muted">They will be signed out and will not be able to log in or place orders until you restore the account. Their order history is kept.</p>
        <label className="ui-field" style={{ marginTop: 14 }}>
          <span>Reason (kept in the activity log)</span>
          <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} required />
        </label>
        <div className="ui-dialog-actions">
          <button type="button" className="ui-btn ui-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="ui-btn ui-danger" disabled={saving}>{saving ? "Suspending…" : "Suspend account"}</button>
        </div>
      </form>
    </div>
  );
}

function Access() {
  const { user: me } = useAuth();
  const canManageStaff = hasPermission(me, "staff.manage");

  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [term, setTerm] = useState("");
  const [view, setView] = useState("staff");
  const [suspending, setSuspending] = useState(null);
  const [busy, setBusy] = useState("");

  const load = () => {
    getUsers()
      .then((data) => {
        setPeople(Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => setError(err?.message || "Accounts could not be loaded."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const counts = useMemo(
    () => ({
      staff: people.filter((person) => roleOf(person) !== "user").length,
      customers: people.filter((person) => roleOf(person) === "user").length,
      suspended: people.filter((person) => person.isBlocked).length,
    }),
    [people]
  );

  const visible = useMemo(() => {
    const query = term.trim().toLowerCase();
    return people
      .filter((person) =>
        view === "staff" ? roleOf(person) !== "user" : view === "suspended" ? person.isBlocked : roleOf(person) === "user"
      )
      .filter((person) => !query || `${person.name} ${person.email}`.toLowerCase().includes(query))
      .slice(0, 200);
  }, [people, term, view]);

  const changeRole = async (person, role) => {
    if (role === roleOf(person)) return;
    if (!window.confirm(`Change ${person.name} to ${ROLE_LABELS[role]}?\n\n${ROLE_DESCRIPTIONS[role]}`)) return;
    setBusy(person._id);
    try {
      const data = await setUserRole(person._id, role);
      toast.success(data?.message || "Role updated");
      load();
    } catch (err) {
      toast.error(err?.message || "The role could not be changed.");
    } finally {
      setBusy("");
    }
  };

  const restore = async (person) => {
    setBusy(person._id);
    try {
      const data = await setUserBlocked(person._id, false);
      toast.success(data?.message || "Account restored");
      load();
    } catch (err) {
      toast.error(err?.message || "The account could not be restored.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="ui-page">
      <SEO title="Team & access | Admin" noIndex />

      <div className="ui-head">
        <div>
          <span className="ui-eyebrow">Security</span>
          <h1 className="ui-title">Team &amp; access</h1>
          <p className="ui-lead">Give staff only the access their job needs, and suspend accounts that should not be able to sign in.</p>
        </div>
      </div>

      <div className="ui-grid ui-cols-4" style={{ marginBottom: 24 }}>
        {ROLES.filter((role) => role !== "user").map((role) => (
          <div className="ui-card" key={role}>
            <strong>{ROLE_LABELS[role]}</strong>
            <p className="ui-muted ui-small" style={{ margin: "6px 0 0", lineHeight: 1.5 }}>{ROLE_DESCRIPTIONS[role]}</p>
          </div>
        ))}
      </div>

      <div className="ui-spread" style={{ marginBottom: 16 }}>
        <div className="ui-tabs" role="tablist" style={{ marginBottom: 0 }}>
          <button type="button" role="tab" aria-selected={view === "staff"} onClick={() => setView("staff")}>Staff ({counts.staff})</button>
          <button type="button" role="tab" aria-selected={view === "customers"} onClick={() => setView("customers")}>Customers ({counts.customers})</button>
          <button type="button" role="tab" aria-selected={view === "suspended"} onClick={() => setView("suspended")}>Suspended ({counts.suspended})</button>
        </div>
        <label className="ui-field" style={{ minWidth: "min(100%, 280px)" }}>
          <input aria-label="Search by name or email" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search by name or email" />
        </label>
      </div>

      {!canManageStaff && (
        <div className="ui-alert ui-info" style={{ marginBottom: 16 }}>Your role can suspend and restore customer accounts. Only an administrator can change roles or suspend staff.</div>
      )}
      {error && <div className="ui-alert" role="alert">{error}</div>}
      {loading && <div className="ui-loading"><span className="wv-spinner" /> Loading accounts…</div>}

      {!loading && !error && visible.length === 0 && (
        <div className="ui-empty">
          <h2>No accounts found</h2>
          <p>{term ? "Try a different name or email address." : "There is nobody in this list yet."}</p>
        </div>
      )}

      {visible.length > 0 && (
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr><th>Person</th><th>Role</th><th>Joined</th><th>Status</th><th className="ui-right">Actions</th></tr>
            </thead>
            <tbody>
              {visible.map((person) => {
                const role = roleOf(person);
                const isMe = String(person._id) === String(me?._id);
                const isStaffMember = role !== "user";
                const canSuspend = !isMe && (!isStaffMember || canManageStaff);
                return (
                  <tr key={person._id}>
                    <td>
                      <strong>{person.name}</strong>{isMe && <span className="ui-muted"> (you)</span>}
                      <div className="ui-muted ui-small">{person.email}</div>
                    </td>
                    <td>
                      {canManageStaff && !isMe ? (
                        <select
                          className="ui-input"
                          style={{ minHeight: 36, padding: "6px 10px", width: "auto" }}
                          value={role}
                          disabled={busy === person._id}
                          onChange={(event) => changeRole(person, event.target.value)}
                          aria-label={`Role for ${person.name}`}
                        >
                          {ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}
                        </select>
                      ) : (
                        ROLE_LABELS[role] || role
                      )}
                    </td>
                    <td className="ui-small">{formatDate(person.createdAt)}</td>
                    <td>
                      {person.isBlocked ? (
                        <>
                          <span className="ui-badge ui-bad">Suspended</span>
                          {person.blockedReason && <div className="ui-muted ui-small" style={{ marginTop: 4, maxWidth: 260 }}>{person.blockedReason}</div>}
                        </>
                      ) : (
                        <span className="ui-badge ui-good">Active</span>
                      )}
                    </td>
                    <td className="ui-right">
                      {canSuspend &&
                        (person.isBlocked ? (
                          <button type="button" className="ui-btn ui-ghost ui-sm" disabled={busy === person._id} onClick={() => restore(person)}>Restore</button>
                        ) : (
                          <button type="button" className="ui-btn ui-danger ui-sm" disabled={busy === person._id} onClick={() => setSuspending(person)}>Suspend</button>
                        ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {suspending && (
        <SuspendDialog
          person={suspending}
          onClose={() => setSuspending(null)}
          onDone={() => {
            setSuspending(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function AccessPage() {
  return <ProtectedRoute adminOnly><Access /></ProtectedRoute>;
}
