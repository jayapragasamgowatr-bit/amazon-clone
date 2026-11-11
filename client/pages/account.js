import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Heart, LogOut, MapPin, Package, Pencil, Plus, ShieldCheck, Trash2, User } from "lucide-react";
import toast from "react-hot-toast";

import ProtectedRoute from "../components/ProtectedRoute";
import SEO from "../components/SEO";
import { useAuth } from "../context/AuthContext";
import { addAddress, changeMyPassword, deleteAddress, getAddresses, updateAddress, updateMyProfile } from "../lib/api";
import { ROLE_LABELS, homeFor, isStaff, roleOf } from "../lib/permissions";

// ============================================================
// MY ACCOUNT
// ============================================================
// Profile, password and saved delivery addresses in one place.
// ============================================================

const EMPTY_ADDRESS = { label: "Home", name: "", phone: "", address: "", city: "", state: "", postalCode: "", isDefault: false };

function ProfileCard() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => setName(user?.name || ""), [user?.name]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await updateMyProfile({ name: name.trim() });
      const next = { ...user, name: data?.user?.name || name.trim() };
      setUser(next);
      try {
        localStorage.setItem("user", JSON.stringify(next));
      } catch {
        // Storage may be unavailable; the name is still saved on the server.
      }
      toast.success(data?.message || "Profile updated");
    } catch (error) {
      toast.error(error?.message || "Your profile could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="ui-card ui-stack" onSubmit={submit}>
      <h2><User size={18} /> Profile</h2>
      <label className="ui-field">
        <span>Full name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required autoComplete="name" />
      </label>
      <label className="ui-field">
        <span>Email address</span>
        <input value={user?.email || ""} disabled readOnly />
        <small>Your email is your sign-in. Contact support if you need to change it.</small>
      </label>
      <div>
        <button type="submit" className="ui-btn" disabled={saving || name.trim() === (user?.name || "") || name.trim().length < 2}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));
  const mismatch = form.confirm.length > 0 && form.next !== form.confirm;

  const submit = async (event) => {
    event.preventDefault();
    if (form.next !== form.confirm) return;
    setSaving(true);
    try {
      const data = await changeMyPassword(form.current, form.next);
      toast.success(data?.message || "Password changed");
      setForm({ current: "", next: "", confirm: "" });
    } catch (error) {
      toast.error(error?.message || "Your password could not be changed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="ui-card ui-stack" onSubmit={submit}>
      <h2><ShieldCheck size={18} /> Password</h2>
      <label className="ui-field">
        <span>Current password</span>
        <input type="password" value={form.current} onChange={set("current")} required autoComplete="current-password" maxLength={128} />
      </label>
      <label className="ui-field">
        <span>New password</span>
        <input type="password" value={form.next} onChange={set("next")} required minLength={8} maxLength={128} autoComplete="new-password" />
        <small>At least 8 characters, with a letter and a number.</small>
      </label>
      <label className="ui-field">
        <span>Confirm new password</span>
        <input type="password" value={form.confirm} onChange={set("confirm")} required autoComplete="new-password" maxLength={128} aria-invalid={mismatch} />
        {mismatch && <small style={{ color: "#fca5a5" }}>The two passwords do not match.</small>}
      </label>
      <div>
        <button type="submit" className="ui-btn" disabled={saving || mismatch || !form.current || form.next.length < 8}>
          {saving ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

function AddressDialog({ address, onClose, onSaved }) {
  const editing = Boolean(address?._id);
  const [form, setForm] = useState({ ...EMPTY_ADDRESS, ...address });
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) =>
    setForm((previous) => ({ ...previous, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = editing ? await updateAddress(address._id, form) : await addAddress(form);
      toast.success(editing ? "Address updated" : "Address saved");
      onSaved(data?.addresses || []);
    } catch (error) {
      toast.error(error?.message || "The address could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label={editing ? "Edit address" : "Add address"}>
      <form className="ui-dialog" onSubmit={submit}>
        <h2>{editing ? "Edit address" : "Add an address"}</h2>
        <div className="ui-grid ui-cols-2">
          <label className="ui-field"><span>Label</span><input value={form.label} onChange={set("label")} maxLength={40} placeholder="Home, Office, Site…" /></label>
          <label className="ui-field"><span>Recipient name</span><input value={form.name} onChange={set("name")} required maxLength={100} autoComplete="name" /></label>
          <label className="ui-field"><span>Phone</span><input type="tel" value={form.phone} onChange={set("phone")} required maxLength={20} autoComplete="tel" inputMode="tel" /></label>
          <label className="ui-field"><span>PIN code</span><input value={form.postalCode} onChange={set("postalCode")} required maxLength={6} inputMode="numeric" pattern="[0-9]{6}" autoComplete="postal-code" /></label>
        </div>
        <label className="ui-field" style={{ marginTop: 14 }}><span>Street address</span><textarea rows={2} value={form.address} onChange={set("address")} required maxLength={500} autoComplete="street-address" /></label>
        <div className="ui-grid ui-cols-2" style={{ marginTop: 14 }}>
          <label className="ui-field"><span>City</span><input value={form.city} onChange={set("city")} required maxLength={100} autoComplete="address-level2" /></label>
          <label className="ui-field"><span>State</span><input value={form.state} onChange={set("state")} required maxLength={100} autoComplete="address-level1" /></label>
        </div>
        <label className="ui-check" style={{ marginTop: 14 }}>
          <input type="checkbox" checked={form.isDefault} onChange={set("isDefault")} />
          <span>Use as my default delivery address</span>
        </label>
        <div className="ui-dialog-actions">
          <button type="button" className="ui-btn ui-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="ui-btn" disabled={saving}>{saving ? "Saving…" : "Save address"}</button>
        </div>
      </form>
    </div>
  );
}

function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    getAddresses()
      .then((data) => setAddresses(data?.addresses || []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (address) => {
    if (!window.confirm(`Remove the address "${address.label}"?`)) return;
    try {
      const data = await deleteAddress(address._id);
      setAddresses(data?.addresses || []);
      toast.success("Address removed");
    } catch (error) {
      toast.error(error?.message || "The address could not be removed.");
    }
  };

  const makeDefault = async (address) => {
    try {
      const data = await updateAddress(address._id, { ...address, isDefault: true });
      setAddresses(data?.addresses || []);
    } catch (error) {
      toast.error(error?.message || "The default address could not be changed.");
    }
  };

  return (
    <section className="ui-card">
      <div className="ui-spread" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}><MapPin size={18} /> Saved addresses</h2>
        <button type="button" className="ui-btn ui-sm" onClick={() => setDialog({})}><Plus size={15} /> Add address</button>
      </div>

      {loading && <div className="ui-loading"><span className="wv-spinner" /> Loading addresses…</div>}

      {!loading && addresses.length === 0 && (
        <p className="ui-muted" style={{ margin: 0 }}>You have no saved addresses yet. Add one to check out faster next time.</p>
      )}

      <div className="ui-grid ui-cols-3">
        {addresses.map((address) => (
          <div className="wvac-address" key={address._id}>
            <div className="ui-row">
              <strong>{address.label}</strong>
              {address.isDefault && <span className="ui-badge ui-info">Default</span>}
            </div>
            <p>
              {address.name}<br />
              {address.address}<br />
              {address.city}, {address.state} {address.postalCode}<br />
              {address.phone}
            </p>
            <div className="ui-row">
              <button type="button" className="ui-btn ui-ghost ui-sm" onClick={() => setDialog(address)}><Pencil size={14} /> Edit</button>
              {!address.isDefault && <button type="button" className="ui-btn ui-ghost ui-sm" onClick={() => makeDefault(address)}>Make default</button>}
              <button type="button" className="ui-btn ui-danger ui-sm" onClick={() => remove(address)} aria-label={`Remove ${address.label}`}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {dialog && (
        <AddressDialog
          address={dialog}
          onClose={() => setDialog(null)}
          onSaved={(next) => {
            setAddresses(next);
            setDialog(null);
          }}
        />
      )}
    </section>
  );
}

function Account() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const signOut = async () => {
    try {
      await logout?.();
    } finally {
      router.push("/");
    }
  };

  const initial = String(user?.name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="ui-page">
      <SEO title="My account | Waventra Vetric" noIndex />

      <div className="ui-head">
        <div className="ui-row" style={{ gap: 18 }}>
          <span className="wvac-avatar" aria-hidden="true">{initial}</span>
          <div>
            <span className="ui-eyebrow">My account</span>
            <h1 className="ui-title" style={{ margin: "6px 0 4px" }}>{user?.name}</h1>
            <p className="ui-lead">
              {user?.email}
              {isStaff(user) && <> · <span className="ui-badge ui-info">{ROLE_LABELS[roleOf(user)]}</span></>}
            </p>
          </div>
        </div>
        <button type="button" className="ui-btn ui-ghost" onClick={signOut}><LogOut size={16} /> Log out</button>
      </div>

      <div className="ui-grid ui-cols-4" style={{ marginBottom: 20 }}>
        <Link href="/orders" className="ui-card wvac-link"><Package size={20} /><strong>Orders</strong><span>Track, cancel or return</span></Link>
        <Link href="/wishlist" className="ui-card wvac-link"><Heart size={20} /><strong>Wishlist</strong><span>Products you saved</span></Link>
        <Link href="/dashboard" className="ui-card wvac-link"><User size={20} /><strong>Dashboard</strong><span>Spending and activity</span></Link>
        {isStaff(user) ? (
          <Link href={homeFor(user)} className="ui-card wvac-link"><ShieldCheck size={20} /><strong>Admin panel</strong><span>Manage the store</span></Link>
        ) : (
          <Link href="/notifications" className="ui-card wvac-link"><ShieldCheck size={20} /><strong>Notifications</strong><span>Order and price alerts</span></Link>
        )}
      </div>

      <div className="ui-grid ui-cols-2" style={{ marginBottom: 20, alignItems: "start" }}>
        <ProfileCard />
        <PasswordCard />
      </div>

      <AddressBook />

      <style jsx global>{`
        .wvac-avatar { width: 72px; height: 72px; flex: none; display: grid; place-items: center; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #6366f1); color: #fff; font-size: 30px; font-weight: 800; }
        .ui-card h2 svg { vertical-align: -3px; margin-right: 6px; color: #7dd3fc; }
        .wvac-link { display: grid; gap: 4px; color: #f8fafc; transition: border-color 0.15s ease, transform 0.15s ease; }
        .wvac-link:hover { border-color: rgba(56, 189, 248, 0.55); transform: translateY(-2px); }
        .wvac-link svg { width: 20px; height: 20px; margin-bottom: 6px; color: #7dd3fc; }
        .wvac-link span { font-size: 13px; color: #94a3b8; }
        .wvac-address { display: grid; gap: 10px; align-content: start; padding: 16px; border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 16px; background: rgba(2, 6, 23, 0.35); }
        .wvac-address p { margin: 0; font-size: 14px; line-height: 1.6; color: #cbd5e1; overflow-wrap: anywhere; }
        @media (prefers-reduced-motion: reduce) { .wvac-link { transition: none; } .wvac-link:hover { transform: none; } }
      `}</style>
    </div>
  );
}

export default function AccountPage() {
  return <ProtectedRoute><Account /></ProtectedRoute>;
}
