import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getAdminShippingOrders, updateShippingDetails } from "../../lib/api";
import {
  Truck,
  Search,
  RefreshCw,
  Save,
  PackageCheck,
} from "lucide-react";
import toast from "react-hot-toast";

const initial = {
  carrier: "",
  trackingNumber: "",
  trackingUrl: "",
  currentLocation: "",
  packageWeight: "",
  shippingStatus: "In Transit",
  estimatedDeliveryAt: "",
  notes: "",
};

const dateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

export default function AdminShippingPage() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initial);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAdminShippingOrders();
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (error) {
      toast.error(error?.message || "Unable to load shipping orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;

    return orders.filter((order) =>
      [
        order._id,
        order.customer?.name,
        order.customer?.email,
        order.shipment?.trackingNumber,
        order.shipment?.carrier,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [orders, search]);

  const selectOrder = (order) => {
    setSelected(order);
    setForm({
      ...initial,
      ...(order.shipment || {}),
      estimatedDeliveryAt: dateInput(order.shipment?.estimatedDeliveryAt),
      shippingStatus:
        order.shipment?.shippingStatus ||
        (order.status === "Delivered"
          ? "Delivered"
          : order.status === "Shipped"
          ? "Shipped"
          : "Processing"),
    });
  };

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (!selected) return;

    try {
      setSaving(true);

      const data = await updateShippingDetails(selected._id, {
        ...form,
        estimatedDeliveryAt: form.estimatedDeliveryAt || null,
      });

      const updated = data?.order;

      if (updated) {
        setOrders((current) =>
          current.map((order) =>
            String(order._id) === String(updated._id) ? updated : order
          )
        );
        setSelected(updated);
        setForm((current) => ({
          ...current,
          ...updated.shipment,
          estimatedDeliveryAt: dateInput(
            updated.shipment?.estimatedDeliveryAt
          ),
        }));
      }

      toast.success("Shipping details saved. Customer notification sent.");
    } catch (error) {
      toast.error(error?.message || "Unable to save shipping details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="shipping-page">
        <header>
          <div>
            <div className="eyebrow">ORDER OPERATIONS</div>
            <h1>
              <Truck size={25} /> Shipping Management
            </h1>
            <p>
              Update courier, tracking, delivery estimate, location and
              shipment notes from one dedicated page.
            </p>
          </div>

          <button onClick={load} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
        </header>

        <div className="layout">
          <section className="list">
            <div className="search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order, customer or tracking number"
              />
            </div>

            {loading ? (
              <div className="empty">Loading shipping orders...</div>
            ) : filtered.length === 0 ? (
              <div className="empty">No shipping orders found.</div>
            ) : (
              filtered.map((order) => (
                <button
                  className={`order ${
                    selected?._id === order._id ? "active" : ""
                  }`}
                  key={order._id}
                  onClick={() => selectOrder(order)}
                >
                  <div className="order-top">
                    <strong>
                      #{String(order._id).slice(-8).toUpperCase()}
                    </strong>
                    <span>{order.status}</span>
                  </div>
                  <b>{order.customer?.name || "Customer"}</b>
                  <small>
                    {order.shipment?.carrier || "Carrier not assigned"} · {" "}
                    {order.shipment?.trackingNumber || "No tracking number"}
                  </small>
                </button>
              ))
            )}
          </section>

          <section className="editor">
            {!selected ? (
              <div className="empty">
                <PackageCheck size={45} />
                <h2>Select an order</h2>
                <p>
                  Choose a shipped/processing order to manage its shipment.
                </p>
              </div>
            ) : (
              <>
                <div className="editor-head">
                  <div>
                    <span>
                      ORDER #{String(selected._id).slice(-8).toUpperCase()}
                    </span>
                    <h2>{selected.customer?.name || "Customer"}</h2>
                    <p>{selected.customer?.email || ""}</p>
                  </div>
                  <span className="status">{selected.status}</span>
                </div>

                <form onSubmit={save}>
                  <div className="grid">
                    {[
                      ["carrier", "Courier / Carrier", "BlueDart"],
                      ["trackingNumber", "Tracking Number", "BD123456"],
                      ["trackingUrl", "Tracking URL", "https://..."],
                      ["currentLocation", "Current Location", "Chennai Hub"],
                      ["packageWeight", "Package Weight", "2.5 kg"],
                    ].map(([name, label, placeholder]) => (
                      <label key={name}>
                        {label}
                        <input
                          name={name}
                          value={form[name] || ""}
                          onChange={change}
                          placeholder={placeholder}
                        />
                      </label>
                    ))}

                    <label>
                      Shipping Status
                      <select
                        name="shippingStatus"
                        value={form.shippingStatus}
                        onChange={change}
                      >
                        {[
                          "Packed",
                          "Picked Up",
                          "In Transit",
                          "Out for Delivery",
                          "Delivered",
                          "Delayed",
                        ].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Estimated Delivery
                      <input
                        type="date"
                        name="estimatedDeliveryAt"
                        value={form.estimatedDeliveryAt || ""}
                        onChange={change}
                      />
                    </label>

                    <label className="full">
                      Shipping Notes
                      <textarea
                        name="notes"
                        value={form.notes || ""}
                        onChange={change}
                        placeholder="Dispatch notes, delivery instructions, delay reason, etc."
                      />
                    </label>
                  </div>

                  <button className="save" disabled={saving}>
                    <Save size={16} />
                    {saving
                      ? "Saving..."
                      : "Save Shipping Details & Notify Customer"}
                  </button>
                </form>

                {selected.shipmentUpdates?.length ? (
                  <div className="updates">
                    <h3>Shipment Updates</h3>
                    {selected.shipmentUpdates.slice(0, 8).map((update, index) => (
                      <div key={index}>
                        <strong>{update.status || "Update"}</strong>
                        <span>{update.location || ""}</span>
                        <small>
                          {update.note || ""} · {" "}
                          {new Date(update.updatedAt).toLocaleString("en-IN")}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>

        <style jsx>{`
          body {
            background: #07111f;
          }

          .shipping-page {
            min-height: 100vh;
            padding: 30px;
            max-width: 1450px;
            margin: auto;
            color: #e8f0f9;
          }

          .shipping-page header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: flex-start;
            margin-bottom: 24px;
          }

          .eyebrow {
            font-size: 11px;
            letter-spacing: 2px;
            color: #38bdf8;
            font-weight: 800;
          }

          .shipping-page h1 {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 7px 0;
            font-size: 26px;
          }

          .shipping-page header p {
            color: #7f8da4;
            margin: 0;
            max-width: 700px;
            font-size: 13px;
          }

          .shipping-page header button,
          .save {
            border: 0;
            border-radius: 10px;
            padding: 11px 15px;
            background: #0ea5e9;
            color: #fff;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 7px;
            cursor: pointer;
          }

          .shipping-page button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .layout {
            display: grid;
            grid-template-columns: 390px 1fr;
            gap: 18px;
          }

          .list,
          .editor {
            background: #0b1729;
            border: 1px solid rgba(148, 163, 184, 0.12);
            border-radius: 16px;
            overflow: hidden;
          }

          .search {
            margin: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            background: #07111f;
            border: 1px solid #22324a;
            border-radius: 10px;
            padding: 0 11px;
          }

          .search input {
            border: 0;
            background: transparent;
            color: #fff;
            padding: 12px 0;
            width: 100%;
            outline: 0;
          }

          .order {
            display: block;
            width: 100%;
            text-align: left;
            padding: 15px;
            border: 0;
            border-top: 1px solid rgba(148, 163, 184, 0.09);
            background: transparent;
            color: #dbe7f3;
            cursor: pointer;
          }

          .order.active {
            background: rgba(14, 165, 233, 0.1);
            border-left: 3px solid #38bdf8;
          }

          .order-top {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 7px;
          }

          .order-top span,
          .status {
            color: #38bdf8;
          }

          .order small {
            display: block;
            color: #72819a;
            margin-top: 5px;
          }

          .editor {
            padding: 24px;
          }

          .editor-head {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
            padding-bottom: 18px;
            margin-bottom: 20px;
          }

          .editor-head > div > span:first-child {
            font-size: 11px;
            color: #6f8099;
          }

          .editor-head h2 {
            margin: 5px 0;
          }

          .editor-head p {
            margin: 0;
            color: #75849b;
            font-size: 12px;
          }

          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }

          .grid label {
            display: flex;
            flex-direction: column;
            gap: 7px;
            color: #aab8cb;
            font-size: 12px;
            font-weight: 700;
          }

          .grid input,
          .grid select,
          .grid textarea {
            background: #07111f;
            border: 1px solid #26364f;
            color: #fff;
            border-radius: 9px;
            padding: 11px;
            outline: 0;
          }

          .grid textarea {
            min-height: 100px;
            resize: vertical;
          }

          .full {
            grid-column: 1 / -1;
          }

          .save {
            margin-top: 18px;
          }

          .updates {
            margin-top: 28px;
            border-top: 1px solid rgba(148, 163, 184, 0.1);
            padding-top: 18px;
          }

          .updates h3 {
            margin: 0 0 12px;
          }

          .updates > div {
            padding: 11px 0;
            border-bottom: 1px solid rgba(148, 163, 184, 0.08);
          }

          .updates strong,
          .updates span,
          .updates small {
            display: block;
          }

          .updates span {
            color: #38bdf8;
            font-size: 12px;
            margin-top: 3px;
          }

          .updates small {
            color: #74839a;
            margin-top: 4px;
          }

          .empty {
            min-height: 260px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 8px;
            color: #73839a;
            padding: 25px;
            text-align: center;
          }

          .empty h2 {
            color: #dce8f3;
            margin: 0;
          }

          .empty p {
            margin: 0;
            font-size: 12px;
          }

          @media (max-width: 900px) {
            .layout {
              grid-template-columns: 1fr;
            }

            .grid {
              grid-template-columns: 1fr;
            }

            .full {
              grid-column: auto;
            }

            .shipping-page {
              padding: 18px;
            }

            .shipping-page header {
              flex-direction: column;
            }
          }
        `}</style>
      </main>
    </ProtectedRoute>
  );
}
