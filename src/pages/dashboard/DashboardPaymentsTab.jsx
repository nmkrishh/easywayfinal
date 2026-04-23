import React, { useEffect, useMemo, useState } from "react";
import { getEcommerceOrders, syncEcommerceOrderPayment } from "../../lib/growth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export default function DashboardPaymentsTab({ theme, siteProjects }) {
  const [projectId, setProjectId] = useState("");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [syncForm, setSyncForm] = useState({ orderId: "", status: "paid", paymentRef: "", paymentMethod: "upi" });

  const options = useMemo(
    () => (siteProjects || []).map((p) => ({ value: String(p.id), label: p.name || `Website ${p.id}` })),
    [siteProjects],
  );

  const refreshOrders = async (targetProjectId) => {
    const data = await getEcommerceOrders(Number(targetProjectId));
    setOrders(data?.orders || []);
  };

  useEffect(() => {
    if (!projectId) {
      setOrders([]);
      return;
    }
    setError("");
    refreshOrders(projectId).catch((err) => setError(err?.message || "Failed to load orders"));
  }, [projectId]);

  const totals = useMemo(() => {
    const total = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const paid = orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const pending = orders
      .filter((o) => o.status === "pending" || o.status === "processing")
      .reduce((sum, o) => sum + Number(o.amount || 0), 0);
    return { total, paid, pending };
  }, [orders]);

  const triggerSync = async () => {
    if (!syncForm.orderId) return;
    setBusyId(syncForm.orderId);
    setError("");
    try {
      await syncEcommerceOrderPayment(syncForm.orderId, {
        projectId: Number(projectId),
        status: syncForm.status,
        paymentRef: syncForm.paymentRef,
        paymentMethod: syncForm.paymentMethod,
        paymentGateway: "razorpay",
      });
      await refreshOrders(projectId);
      setSyncForm((f) => ({ ...f, paymentRef: "" }));
    } catch (err) {
      setError(err?.message || "Failed to sync payment");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={card(theme)}>
        <h3 style={{ marginTop: 0 }}>Payments & Orders</h3>
        <p style={{ color: theme.muted, marginTop: 0 }}>Track transactions and apply gateway status sync per project.</p>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={input(theme)}>
          <option value="">Select website</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <p style={{ marginBottom: 0, marginTop: "0.6rem", color: theme.muted, fontSize: "0.8rem" }}>
          Razorpay webhook endpoint: <code>{API_BASE}/api/ecommerce/payments/webhook</code>
        </p>
      </div>

      {projectId && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "0.8rem" }}>
          <Stat theme={theme} label="Gross" value={totals.total} />
          <Stat theme={theme} label="Paid" value={totals.paid} />
          <Stat theme={theme} label="Pending" value={totals.pending} />
        </div>
      )}

      {projectId && (
        <div style={card(theme)}>
          <h3 style={{ marginTop: 0 }}>Manual Sync</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 1fr 0.9fr auto", gap: "0.5rem", alignItems: "center" }}>
            <select value={syncForm.orderId} onChange={(e) => setSyncForm((f) => ({ ...f, orderId: e.target.value }))} style={input(theme)}>
              <option value="">Select order</option>
              {orders.map((o) => (
                <option key={o._id} value={o._id}>{o._id.slice(-8)} - INR {o.amount}</option>
              ))}
            </select>
            <select value={syncForm.status} onChange={(e) => setSyncForm((f) => ({ ...f, status: e.target.value }))} style={input(theme)}>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
            <input value={syncForm.paymentRef} onChange={(e) => setSyncForm((f) => ({ ...f, paymentRef: e.target.value }))} placeholder="Gateway payment ref" style={input(theme)} />
            <select value={syncForm.paymentMethod} onChange={(e) => setSyncForm((f) => ({ ...f, paymentMethod: e.target.value }))} style={input(theme)}>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">Netbanking</option>
              <option value="wallet">Wallet</option>
            </select>
            <button onClick={triggerSync} disabled={!syncForm.orderId || !!busyId} style={btn(theme, !syncForm.orderId || !!busyId)}>
              {busyId ? "Syncing..." : "Sync"}
            </button>
          </div>
        </div>
      )}

      <div style={card(theme)}>
        <h3 style={{ marginTop: 0 }}>Recent Orders</h3>
        {!projectId ? (
          <p style={{ color: theme.muted, marginBottom: 0 }}>Select a website to view orders.</p>
        ) : orders.length === 0 ? (
          <p style={{ color: theme.muted, marginBottom: 0 }}>No orders found for this website.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.45rem" }}>
            {orders.slice(0, 20).map((o) => (
              <div key={o._id} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "0.65rem", display: "flex", justifyContent: "space-between", gap: "0.8rem" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{String(o.status || "pending").toUpperCase()}</div>
                  <div style={{ color: theme.muted, fontSize: "0.82rem" }}>{new Date(o.createdAt).toLocaleString()}</div>
                  <div style={{ color: theme.muted, fontSize: "0.76rem" }}>
                    Ref: {o.paymentRef || "-"} | Method: {o.paymentMethod || "-"}
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>INR {o.amount}</div>
              </div>
            ))}
          </div>
        )}
        {error && <p style={{ color: "#f87171", marginBottom: 0 }}>{error}</p>}
      </div>
    </div>
  );
}

function Stat({ theme, label, value }) {
  return (
    <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: "0.8rem", background: theme.surface }}>
      <div style={{ color: theme.muted, fontSize: "0.8rem", marginBottom: "0.2rem" }}>{label}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>INR {value}</div>
    </div>
  );
}

function card(theme) {
  return {
    padding: "1rem",
    border: `1px solid ${theme.border}`,
    borderRadius: 14,
    background: theme.surface,
  };
}

function input(theme) {
  return {
    width: "100%",
    minHeight: 36,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    background: theme.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    color: theme.text,
    padding: "0.5rem 0.6rem",
    outline: "none",
    fontSize: "0.84rem",
  };
}

function btn(theme, disabled) {
  return {
    border: "none",
    borderRadius: 8,
    padding: "0.55rem 0.9rem",
    background: disabled ? theme.border : theme.accentBtnBg,
    color: disabled ? theme.muted : theme.accentBtnText,
    cursor: disabled ? "default" : "pointer",
    fontWeight: 600,
    minHeight: 36,
  };
}
