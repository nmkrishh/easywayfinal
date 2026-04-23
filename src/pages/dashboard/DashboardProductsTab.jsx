import React, { useEffect, useMemo, useState } from "react";
import {
  addEcommerceProduct,
  deleteEcommerceProduct,
  getEcommerceProducts,
  updateEcommerceProduct,
} from "../../lib/growth";

export default function DashboardProductsTab({ theme, siteProjects }) {
  const [projectId, setProjectId] = useState("");
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", price: "", stock: "", description: "", imageUrl: "" });
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ name: "", price: "", stock: "", description: "", imageUrl: "" });

  const options = useMemo(
    () => (siteProjects || []).map((p) => ({ value: String(p.id), label: p.name || `Website ${p.id}` })),
    [siteProjects],
  );

  const refreshProducts = async (targetProjectId) => {
    const data = await getEcommerceProducts(Number(targetProjectId));
    setProducts(data?.products || []);
  };

  useEffect(() => {
    if (!projectId) {
      setProducts([]);
      return;
    }
    setError("");
    refreshProducts(projectId).catch((err) => setError(err?.message || "Failed to load products"));
  }, [projectId]);

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      await addEcommerceProduct({
        projectId: Number(projectId),
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock || 0),
        description: form.description,
        imageUrl: form.imageUrl,
      });
      await refreshProducts(projectId);
      setForm({ name: "", price: "", stock: "", description: "", imageUrl: "" });
    } catch (err) {
      setError(err?.message || "Failed to add product");
    } finally {
      setBusy(false);
    }
  };

  const beginEdit = (product) => {
    setEditingId(product._id);
    setEditForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
      description: product.description || "",
      imageUrl: product.imageUrl || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setBusy(true);
    setError("");
    try {
      await updateEcommerceProduct(editingId, {
        projectId: Number(projectId),
        name: editForm.name,
        price: Number(editForm.price),
        stock: Number(editForm.stock || 0),
        description: editForm.description,
        imageUrl: editForm.imageUrl,
      });
      await refreshProducts(projectId);
      setEditingId("");
    } catch (err) {
      setError(err?.message || "Failed to update product");
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteEcommerceProduct(id, Number(projectId));
      await refreshProducts(projectId);
      if (editingId === id) setEditingId("");
    } catch (err) {
      setError(err?.message || "Failed to delete product");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={card(theme)}>
        <h3 style={{ marginTop: 0 }}>Product Management</h3>
        <p style={{ color: theme.muted, marginTop: 0, marginBottom: "0.8rem" }}>
          Select a website, then add, edit, and delete products for that store.
        </p>

        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={input(theme)}>
          <option value="">Select website</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {projectId && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.6rem" }}>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Product name" style={input(theme)} />
              <input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="Price" style={input(theme)} />
              <input value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} placeholder="Stock" style={input(theme)} />
              <input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="Image URL" style={input(theme)} />
            </div>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" style={{ ...input(theme), marginTop: "0.5rem" }} />
            <button disabled={busy || !form.name.trim() || !form.price} onClick={create} style={btn(theme, busy || !form.name.trim() || !form.price)}>
              {busy ? "Adding..." : "Add Product"}
            </button>
          </>
        )}

        {error && <p style={{ color: "#f87171", marginBottom: 0 }}>{error}</p>}
      </div>

      <div style={card(theme)}>
        <h3 style={{ marginTop: 0 }}>Products</h3>
        {!projectId ? (
          <p style={{ color: theme.muted, marginBottom: 0 }}>Select a website to view products.</p>
        ) : products.length === 0 ? (
          <p style={{ color: theme.muted, marginBottom: 0 }}>No products yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {products.map((p) => (
              <div key={p._id} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "0.65rem", display: "flex", justifyContent: "space-between", gap: "0.8rem" }}>
                <div style={{ flex: 1 }}>
                  {editingId === p._id ? (
                    <div style={{ display: "grid", gap: "0.42rem" }}>
                      <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Product name" style={input(theme)} />
                      <input value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" style={input(theme)} />
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "0.4rem" }}>
                        <input value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} placeholder="Price" style={input(theme)} />
                        <input value={editForm.stock} onChange={(e) => setEditForm((f) => ({ ...f, stock: e.target.value }))} placeholder="Stock" style={input(theme)} />
                        <input value={editForm.imageUrl} onChange={(e) => setEditForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="Image URL" style={input(theme)} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ color: theme.muted, fontSize: "0.82rem" }}>{p.description || "No description"}</div>
                    </>
                  )}
                </div>
                <div style={{ textAlign: "right", minWidth: 230 }}>
                  <div style={{ fontWeight: 700 }}>{p.currency || "INR"} {p.price}</div>
                  <div style={{ color: theme.muted, fontSize: "0.8rem", marginBottom: "0.4rem" }}>Stock: {p.stock ?? 0}</div>
                  {editingId === p._id ? (
                    <div style={{ display: "flex", gap: "0.45rem", justifyContent: "flex-end" }}>
                      <button onClick={saveEdit} disabled={busy || !editForm.name.trim() || !editForm.price} style={smallBtn(theme, busy || !editForm.name.trim() || !editForm.price)}>Save</button>
                      <button onClick={() => setEditingId("")} disabled={busy} style={smallBtn(theme, busy, true)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "0.45rem", justifyContent: "flex-end" }}>
                      <button onClick={() => beginEdit(p)} disabled={busy} style={smallBtn(theme, busy)}>Edit</button>
                      <button onClick={() => removeProduct(p._id)} disabled={busy} style={smallBtn(theme, busy, true)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
    marginTop: "0.6rem",
    border: "none",
    borderRadius: 8,
    padding: "0.55rem 0.9rem",
    background: disabled ? theme.border : theme.accentBtnBg,
    color: disabled ? theme.muted : theme.accentBtnText,
    cursor: disabled ? "default" : "pointer",
    fontWeight: 600,
  };
}

function smallBtn(theme, disabled, secondary = false) {
  return {
    border: `1px solid ${secondary ? theme.border : "transparent"}`,
    borderRadius: 7,
    padding: "0.38rem 0.62rem",
    background: disabled ? theme.border : (secondary ? "transparent" : theme.accentBtnBg),
    color: disabled ? theme.muted : (secondary ? theme.text : theme.accentBtnText),
    cursor: disabled ? "default" : "pointer",
    fontWeight: 600,
    fontSize: "0.78rem",
  };
}
