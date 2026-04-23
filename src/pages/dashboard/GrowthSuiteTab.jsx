import React, { useEffect, useMemo, useState } from "react";
import {
  addEcommerceCustomer,
  addEcommerceOrder,
  addEcommerceProduct,
  addCustomDomain,
  addNotificationTarget,
  generateLivePost,
  getEcommerceCustomers,
  getEcommerceOrders,
  getEcommerceProducts,
  generateSeoForProject,
  getBusinessProfile,
  getCustomDomains,
  getNotificationTargets,
  getSocialAccounts,
  getSocialSchedules,
  saveBusinessProfile,
  saveNotificationSettings,
  scheduleSocialPost,
  sendPushNotification,
  sendTestNotification,
  startSocialOAuth,
  verifyCustomDomain,
} from "../../lib/growth";

export default function GrowthSuiteTab({ theme, siteProjects, onProjectRefresh }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [profile, setProfile] = useState({
    businessName: "",
    industry: "",
    city: "",
    country: "",
    mapProfileUrl: "",
    audience: "",
    brandTone: "",
    goals: "",
  });

  const [oneTapEnabled, setOneTapEnabled] = useState(true);
  const [targets, setTargets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [domains, setDomains] = useState([]);

  // Push notification composer
  const [pushForm, setPushForm] = useState({ title: "", message: "", url: "", appId: "" });
  const [pushResult, setPushResult] = useState(null);

  const [quickTarget, setQuickTarget] = useState({ type: "web", label: "", endpoint: "" });
  const [seoProjectId, setSeoProjectId] = useState("");
  const [domainForm, setDomainForm] = useState({ projectId: "", domain: "" });
  const [postForm, setPostForm] = useState({
    projectId: "",
    platform: "instagram",
    socialAccountId: "",
    scheduledFor: "",
    caption: "",
    tags: "",
  });
  const [ecomProjectId, setEcomProjectId] = useState("");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productForm, setProductForm] = useState({ name: "", price: "", stock: "", description: "", imageUrl: "" });
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "" });

  const projectOptions = useMemo(
    () => (siteProjects || []).map((p) => ({ value: String(p.id), label: p.name || `Website ${p.id}` })),
    [siteProjects],
  );

  const refreshAll = async () => {
    const [profileRes, notificationsRes, accountRes, scheduleRes, domainRes] = await Promise.all([
      getBusinessProfile(),
      getNotificationTargets(),
      getSocialAccounts(),
      getSocialSchedules(),
      getCustomDomains(),
    ]);
    const p = profileRes?.profile;
    if (p) {
      setProfile({
        businessName: p.businessName || "",
        industry: p.industry || "",
        city: p.city || "",
        country: p.country || "",
        mapProfileUrl: p.mapProfileUrl || "",
        audience: p.audience || "",
        brandTone: p.brandTone || "",
        goals: Array.isArray(p.goals) ? p.goals.join(", ") : "",
      });
    }
    setTargets(notificationsRes?.targets || []);
    setOneTapEnabled(Boolean(notificationsRes?.settings?.oneTapEnabled ?? true));
    setAccounts(accountRes?.accounts || []);
    setSchedules(scheduleRes?.schedules || []);
    setDomains(domainRes?.domains || []);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await refreshAll();
      } catch (err) {
        if (mounted) setError(err?.message || "Failed to load Growth Suite");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    const onOAuth = (event) => {
      const type = event?.data?.type;
      if (type !== "easyway-social-oauth" && type !== "easyway-buffer-oauth") return;
      refreshAll().catch(() => {});
    };
    window.addEventListener("message", onOAuth);
    return () => {
      mounted = false;
      window.removeEventListener("message", onOAuth);
    };
  }, []);

  useEffect(() => {
    if (!ecomProjectId) {
      setProducts([]);
      setCustomers([]);
      setOrders([]);
      return;
    }
    const projectId = Number(ecomProjectId);
    if (!Number.isFinite(projectId)) return;
    Promise.all([
      getEcommerceProducts(projectId),
      getEcommerceCustomers(projectId),
      getEcommerceOrders(projectId),
    ])
      .then(([p, c, o]) => {
        setProducts(p?.products || []);
        setCustomers(c?.customers || []);
        setOrders(o?.orders || []);
      })
      .catch((err) => setError(err?.message || "Failed to load ecommerce data"));
  }, [ecomProjectId]);

  const run = async (key, fn, okMessage) => {
    setError("");
    setMessage("");
    setBusy(key);
    try {
      const result = await fn();
      if (okMessage) setMessage(okMessage);
      return result;
    } catch (err) {
      setError(err?.message || "Request failed");
      return null;
    } finally {
      setBusy("");
    }
  };

  const connectOAuth = (platform) =>
    run(`oauth-${platform}`, async () => {
      const data = await startSocialOAuth(platform);
      window.open(data.authorizationUrl, "_blank", "width=640,height=760");
    }, `OAuth started for ${platform}`);

  if (loading) return <p style={{ color: theme.muted }}>Loading Growth Suite...</p>;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <style>{dropdownStyles}</style>

      {(error || message) && (
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "0.7rem 0.9rem", color: error ? "#f87171" : theme.text }}>
          {error || message}
        </div>
      )}

      <Card theme={theme} title="Step 1 - Business Profile" subtitle="Quick details used automatically by Website/App AI builders.">
        <Grid2>
          <Input theme={theme} value={profile.businessName} onChange={(v) => setProfile((p) => ({ ...p, businessName: v }))} placeholder="Business name" />
          <Input theme={theme} value={profile.industry} onChange={(v) => setProfile((p) => ({ ...p, industry: v }))} placeholder="Industry" />
          <Input theme={theme} value={profile.city} onChange={(v) => setProfile((p) => ({ ...p, city: v }))} placeholder="City" />
          <Input theme={theme} value={profile.country} onChange={(v) => setProfile((p) => ({ ...p, country: v }))} placeholder="Country" />
        </Grid2>
        <Input theme={theme} value={profile.mapProfileUrl} onChange={(v) => setProfile((p) => ({ ...p, mapProfileUrl: v }))} placeholder="Google Maps business profile URL" />
        <Grid2>
          <Input theme={theme} value={profile.audience} onChange={(v) => setProfile((p) => ({ ...p, audience: v }))} placeholder="Target audience" />
          <Input theme={theme} value={profile.brandTone} onChange={(v) => setProfile((p) => ({ ...p, brandTone: v }))} placeholder="Brand tone" />
        </Grid2>
        <Input theme={theme} value={profile.goals} onChange={(v) => setProfile((p) => ({ ...p, goals: v }))} placeholder="Goals (comma separated)" />
        <Button
          theme={theme}
          disabled={busy === "save-profile"}
          onClick={() =>
            run("save-profile", () => saveBusinessProfile({
              ...profile,
              goals: profile.goals.split(",").map((g) => g.trim()).filter(Boolean),
            }), "Business profile saved")
          }
        >
          {busy === "save-profile" ? "Saving..." : "Save Profile"}
        </Button>
      </Card>

      <Card theme={theme} title="Step 2 - Notifications + Social Connect" subtitle="Turn one-tap launch notifications on/off and connect socials with OAuth.">
        <Row>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <label style={{ color: theme.muted, fontSize: "0.85rem" }}>One-Tap Notification</label>
            <button
              onClick={() =>
                run("toggle-notify", async () => {
                  const next = !oneTapEnabled;
                  await saveNotificationSettings({ oneTapEnabled: next });
                  setOneTapEnabled(next);
                }, !oneTapEnabled ? "One-tap notifications enabled" : "One-tap notifications disabled")
              }
              style={{
                width: 62,
                borderRadius: 20,
                border: `1px solid ${theme.border}`,
                padding: "0.2rem",
                background: oneTapEnabled ? theme.accentBtnBg : theme.border,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#fff",
                  transform: oneTapEnabled ? "translateX(30px)" : "translateX(0)",
                  transition: "transform 140ms ease",
                }}
              />
            </button>
          </div>
          <Button
            theme={theme}
            disabled={busy === "send-notify" || !oneTapEnabled}
            onClick={() =>
              run("send-notify", () => {
                const selected = siteProjects.find((p) => String(p.id) === String(postForm.projectId));
                return sendTestNotification({
                  message: selected ? `${selected.name} is now live!` : "Your EasyWay website is live!",
                  url: selected?.published_url || "",
                });
              }, "Launch notification sent")
            }
          >
            {busy === "send-notify" ? "Sending..." : "Send One-Tap Live Alert"}
          </Button>
        </Row>

        <Grid2>
          <Button theme={theme} disabled={busy === "oauth-instagram"} onClick={() => connectOAuth("instagram")}>Connect Instagram (OAuth)</Button>
          <Button theme={theme} disabled={busy === "oauth-linkedin"} onClick={() => connectOAuth("linkedin")}>Connect LinkedIn (OAuth)</Button>
          <Button theme={theme} disabled={busy === "oauth-facebook"} onClick={() => connectOAuth("facebook")}>Connect Facebook (OAuth)</Button>
          <Button
            theme={theme}
            disabled={busy === "add-target" || !quickTarget.endpoint.trim()}
            onClick={() =>
              run("add-target", async () => {
                await addNotificationTarget(quickTarget);
                const data = await getNotificationTargets();
                setTargets(data.targets || []);
                setQuickTarget((f) => ({ ...f, label: "", endpoint: "" }));
              }, "Notification target added")
            }
          >
            Add Manual Push Target
          </Button>
        </Grid2>
        <Row>
          <GlassDropdown value={quickTarget.type} onChange={(v) => setQuickTarget((f) => ({ ...f, type: v }))} options={[{ value: "web", label: "Web" }, { value: "app", label: "App" }]} />
          <Input theme={theme} value={quickTarget.label} onChange={(v) => setQuickTarget((f) => ({ ...f, label: v }))} placeholder="Device label" />
          <Input theme={theme} value={quickTarget.endpoint} onChange={(v) => setQuickTarget((f) => ({ ...f, endpoint: v }))} placeholder="Push token/endpoint" />
        </Row>
        <MiniList theme={theme} empty="No connected social accounts yet." items={accounts.map((a) => `${a.platform} - ${a.accountHandle}`)} />
      </Card>

      {/* Push Notification Composer */}
      <Card theme={theme} title="📱 Send Push Notification" subtitle="Send a real push notification to all devices that installed your app.">
        <Grid2>
          <Input theme={theme} value={pushForm.title} onChange={(v) => setPushForm(f => ({ ...f, title: v }))} placeholder="Notification title (e.g. Big Sale!)" />
          <Input theme={theme} value={pushForm.appId} onChange={(v) => setPushForm(f => ({ ...f, appId: v }))} placeholder="App ID to target (blank = all apps)" />
        </Grid2>
        <Input theme={theme} value={pushForm.message} onChange={(v) => setPushForm(f => ({ ...f, message: v }))} placeholder="Notification body message" />
        <Input theme={theme} value={pushForm.url} onChange={(v) => setPushForm(f => ({ ...f, url: v }))} placeholder="Deep link URL (optional)" />
        <Button
          theme={theme}
          disabled={busy === "push-send" || !pushForm.message.trim()}
          onClick={() =>
            run("push-send", async () => {
              const result = await sendPushNotification({ ...pushForm, title: pushForm.title || "EasyWay" });
              setPushResult(result);
              return result;
            }, "Notification sent!")
          }
        >
          {busy === "push-send" ? "Sending..." : "🔔 Send Push Notification"}
        </Button>
        {pushResult && (
          <div style={{ fontSize: "0.82rem", border: `1px solid ${theme.border}`, borderRadius: 8, padding: "0.5rem 0.7rem",
            color: pushResult.transport === "fcm-v1" && pushResult.sent > 0 ? "#22c55e" : theme.muted }}>
            {pushResult.transport === "stub"
              ? `⚠️ ${pushResult.note}`
              : pushResult.note && !pushResult.transport
                ? `📭 ${pushResult.note}`
                : `✅ Sent to ${pushResult.sent} of ${pushResult.tokens} device(s)${pushResult.failed > 0 ? ` · ${pushResult.failed} failed` : ""}`
            }
          </div>
        )}
        <p style={{ margin: 0, fontSize: "0.78rem", color: theme.muted }}>
          💡 Make sure <code>FIREBASE_SERVICE_ACCOUNT</code> is set in <code>.env</code> and the app is installed on a real device with push enabled.
        </p>
      </Card>

      <Card theme={theme} title="Step 3 - Launch Automation" subtitle="Generate SEO + social launch post in a few clicks.">
        <Row>
          <GlassDropdown value={seoProjectId} onChange={setSeoProjectId} options={[{ value: "", label: "Select website" }, ...projectOptions]} />
          <Button
            theme={theme}
            disabled={busy === "seo" || !seoProjectId}
            onClick={() =>
              run("seo", async () => {
                await generateSeoForProject(Number(seoProjectId));
                await onProjectRefresh?.();
              }, "SEO generated and applied")
            }
          >
            {busy === "seo" ? "Generating..." : "Generate SEO (Trinity)"}
          </Button>
        </Row>

        <Row>
          <GlassDropdown value={postForm.projectId} onChange={(v) => setPostForm((f) => ({ ...f, projectId: v }))} options={[{ value: "", label: "Website" }, ...projectOptions]} />
          <GlassDropdown
            value={postForm.platform}
            onChange={(v) => setPostForm((f) => ({ ...f, platform: v }))}
            options={[
              { value: "instagram", label: "Instagram" },
              { value: "linkedin", label: "LinkedIn" },
              { value: "facebook", label: "Facebook" },
            ]}
          />
          <GlassDropdown
            value={postForm.socialAccountId}
            onChange={(v) => setPostForm((f) => ({ ...f, socialAccountId: v }))}
            options={[{ value: "", label: "Connected account" }, ...accounts.map((a) => ({ value: String(a.id), label: `${a.platform} - ${a.accountHandle}` }))]}
          />
          <Button
            theme={theme}
            disabled={busy === "launch-copy" || !postForm.projectId}
            onClick={() =>
              run("launch-copy", async () => {
                const data = await generateLivePost({ projectId: Number(postForm.projectId), platform: postForm.platform });
                setPostForm((f) => ({
                  ...f,
                  caption: data.caption || "",
                  tags: Array.isArray(data.hashtags) ? data.hashtags.join(", ") : "",
                }));
              }, "Launch copy generated")
            }
          >
            {busy === "launch-copy" ? "Generating..." : "Generate Launch Post"}
          </Button>
        </Row>

        <Input theme={theme} value={postForm.caption} onChange={(v) => setPostForm((f) => ({ ...f, caption: v }))} placeholder="Post caption" />
        <Row>
          <Input theme={theme} value={postForm.tags} onChange={(v) => setPostForm((f) => ({ ...f, tags: v }))} placeholder="Tags / hashtags" />
          <input type="datetime-local" value={postForm.scheduledFor} onChange={(e) => setPostForm((f) => ({ ...f, scheduledFor: e.target.value }))} style={inputStyle(theme)} />
          <Button
            theme={theme}
            disabled={busy === "schedule" || !postForm.caption.trim() || !postForm.scheduledFor}
            onClick={() =>
              run("schedule", async () => {
                await scheduleSocialPost({
                  projectId: postForm.projectId ? Number(postForm.projectId) : null,
                  platform: postForm.platform,
                  socialAccountId: postForm.socialAccountId ? Number(postForm.socialAccountId) : null,
                  scheduledFor: new Date(postForm.scheduledFor).toISOString(),
                  caption: postForm.caption,
                  tags: postForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
                });
                const data = await getSocialSchedules();
                setSchedules(data.schedules || []);
                setPostForm((f) => ({ ...f, scheduledFor: "", caption: "", tags: "" }));
              }, "Post scheduled")
            }
          >
            Schedule Post
          </Button>
        </Row>
        <MiniList theme={theme} empty="No scheduled posts yet." items={schedules.slice(0, 5).map((s) => `${s.platform} - ${new Date(s.scheduledFor).toLocaleString()}`)} />
      </Card>

      <Card theme={theme} title="Step 4 - Custom Domain" subtitle="Add custom domain and verify DNS TXT record.">
        <Row>
          <GlassDropdown value={domainForm.projectId} onChange={(v) => setDomainForm((f) => ({ ...f, projectId: v }))} options={[{ value: "", label: "Website" }, ...projectOptions]} />
          <Input theme={theme} value={domainForm.domain} onChange={(v) => setDomainForm((f) => ({ ...f, domain: v }))} placeholder="www.yourdomain.com" />
          <Button
            theme={theme}
            disabled={busy === "add-domain" || !domainForm.projectId || !domainForm.domain.trim()}
            onClick={() =>
              run("add-domain", async () => {
                await addCustomDomain({ projectId: Number(domainForm.projectId), domain: domainForm.domain });
                const data = await getCustomDomains();
                setDomains(data.domains || []);
                setDomainForm((f) => ({ ...f, domain: "" }));
              }, "Domain added")
            }
          >
            Add Domain
          </Button>
        </Row>
        <div style={{ display: "grid", gap: "0.45rem" }}>
          {domains.map((d) => (
            <div key={d.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 8, padding: "0.55rem 0.65rem", display: "flex", justifyContent: "space-between", gap: "0.8rem", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{d.domain}</div>
                <div style={{ color: theme.muted, fontSize: "0.78rem" }}>
                  Status: {d.status} | TXT: `_easyway.{d.domain}` = {d.verificationToken}
                </div>
              </div>
              <Button
                theme={theme}
                disabled={busy === `verify-${d.id}` || d.status === "verified"}
                onClick={() =>
                  run(`verify-${d.id}`, async () => {
                    await verifyCustomDomain(d.id);
                    const data = await getCustomDomains();
                    setDomains(data.domains || []);
                  }, "Verification checked")
                }
              >
                {d.status === "verified" ? "Verified" : "Verify"}
              </Button>
            </div>
          ))}
          {domains.length === 0 && <p style={{ margin: 0, color: theme.muted }}>No custom domains yet.</p>}
        </div>
      </Card>

      <Card theme={theme} title="Step 5 - Ecommerce Data (MongoDB)" subtitle="Select a website project, then manage products, customers, and orders.">
        <Row>
          <GlassDropdown
            value={ecomProjectId}
            onChange={setEcomProjectId}
            options={[{ value: "", label: "Select website for store data" }, ...projectOptions]}
          />
          <div />
          <div />
        </Row>

        {ecomProjectId ? (
          <>
            <Grid2>
              <Input theme={theme} value={productForm.name} onChange={(v) => setProductForm((f) => ({ ...f, name: v }))} placeholder="Product name" />
              <Input theme={theme} value={productForm.price} onChange={(v) => setProductForm((f) => ({ ...f, price: v }))} placeholder="Price" />
              <Input theme={theme} value={productForm.stock} onChange={(v) => setProductForm((f) => ({ ...f, stock: v }))} placeholder="Stock" />
              <Input theme={theme} value={productForm.imageUrl} onChange={(v) => setProductForm((f) => ({ ...f, imageUrl: v }))} placeholder="Image URL" />
            </Grid2>
            <Input theme={theme} value={productForm.description} onChange={(v) => setProductForm((f) => ({ ...f, description: v }))} placeholder="Product description" />
            <Button
              theme={theme}
              disabled={busy === "add-product" || !productForm.name.trim() || !productForm.price}
              onClick={() =>
                run("add-product", async () => {
                  await addEcommerceProduct({
                    projectId: Number(ecomProjectId),
                    name: productForm.name,
                    price: Number(productForm.price),
                    stock: Number(productForm.stock || 0),
                    description: productForm.description,
                    imageUrl: productForm.imageUrl,
                  });
                  const data = await getEcommerceProducts(Number(ecomProjectId));
                  setProducts(data?.products || []);
                  setProductForm({ name: "", price: "", stock: "", description: "", imageUrl: "" });
                }, "Product added")
              }
            >
              Add Product
            </Button>

            <Grid2>
              <Input theme={theme} value={customerForm.name} onChange={(v) => setCustomerForm((f) => ({ ...f, name: v }))} placeholder="Customer name" />
              <Input theme={theme} value={customerForm.email} onChange={(v) => setCustomerForm((f) => ({ ...f, email: v }))} placeholder="Customer email" />
              <Input theme={theme} value={customerForm.phone} onChange={(v) => setCustomerForm((f) => ({ ...f, phone: v }))} placeholder="Customer phone" />
              <Button
                theme={theme}
                disabled={busy === "add-customer" || !customerForm.name.trim()}
                onClick={() =>
                  run("add-customer", async () => {
                    await addEcommerceCustomer({
                      projectId: Number(ecomProjectId),
                      name: customerForm.name,
                      email: customerForm.email,
                      phone: customerForm.phone,
                    });
                    const data = await getEcommerceCustomers(Number(ecomProjectId));
                    setCustomers(data?.customers || []);
                    setCustomerForm({ name: "", email: "", phone: "" });
                  }, "Customer added")
                }
              >
                Add Customer
              </Button>
            </Grid2>

            <Button
              theme={theme}
              disabled={busy === "sample-order" || products.length === 0}
              onClick={() =>
                run("sample-order", async () => {
                  const p = products[0];
                  await addEcommerceOrder({
                    projectId: Number(ecomProjectId),
                    items: [{ productId: p._id, name: p.name, qty: 1, price: Number(p.price || 0) }],
                    amount: Number(p.price || 0),
                    customerId: customers[0]?._id || null,
                    status: "pending",
                  });
                  const data = await getEcommerceOrders(Number(ecomProjectId));
                  setOrders(data?.orders || []);
                }, "Sample order recorded")
              }
            >
              Create Sample Order
            </Button>

            <MiniList theme={theme} empty="No products yet." items={products.slice(0, 5).map((p) => `${p.name} - ${p.currency || "INR"} ${p.price}`)} />
            <MiniList theme={theme} empty="No customers yet." items={customers.slice(0, 5).map((c) => `${c.name}${c.email ? ` - ${c.email}` : ""}`)} />
            <MiniList theme={theme} empty="No orders yet." items={orders.slice(0, 5).map((o) => `${o.status} - ${o.amount} (${new Date(o.createdAt).toLocaleString()})`)} />
          </>
        ) : (
          <p style={{ margin: 0, color: theme.muted }}>Select a website first to manage its ecommerce data.</p>
        )}
      </Card>

      <MiniList theme={theme} empty="No notification targets yet." items={targets.map((t) => `${t.type.toUpperCase()} - ${t.label || t.endpoint}`)} />
    </div>
  );
}

function Card({ theme, title, subtitle, children }) {
  return (
    <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: "0.9rem", background: theme.surface }}>
      <h3 style={{ margin: "0 0 0.2rem" }}>{title}</h3>
      <p style={{ margin: "0 0 0.7rem", color: theme.muted, fontSize: "0.82rem" }}>{subtitle}</p>
      <div style={{ display: "grid", gap: "0.55rem" }}>{children}</div>
    </div>
  );
}

function Grid2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>{children}</div>;
}

function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.5rem" }}>{children}</div>;
}

function Button({ theme, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "none",
        borderRadius: 8,
        padding: "0.55rem 0.7rem",
        background: disabled ? theme.border : theme.accentBtnBg,
        color: disabled ? theme.muted : theme.accentBtnText,
        cursor: disabled ? "default" : "pointer",
        fontWeight: 600,
        fontSize: "0.8rem",
      }}
    >
      {children}
    </button>
  );
}

function Input({ theme, value, onChange, placeholder }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle(theme)} />;
}

function GlassDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value)) || options[0] || { label: "Select", value: "" };

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    const onEsc = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className={`gs-dropdown-wrapper ${open ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="gs-dropdown-trigger" onClick={() => setOpen((v) => !v)}>
        <span>{selected.label}</span>
        <svg className="gs-chevron" viewBox="0 0 20 20" fill="none">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="gs-dropdown-menu">
        {options.map((opt) => {
          const active = String(opt.value) === String(value);
          return (
            <button
              key={opt.value}
              type="button"
              className={`gs-menu-item ${active ? "checked" : ""}`}
              onClick={() => {
                onChange(String(opt.value));
                setOpen(false);
              }}
            >
              <span className="gs-label">{opt.label}</span>
              <span className="gs-checkmark">{active ? "✓" : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniList({ theme, items, empty }) {
  if (!items.length) return <p style={{ margin: 0, color: theme.muted }}>{empty}</p>;
  return (
    <div style={{ display: "grid", gap: "0.3rem" }}>
      {items.map((item, idx) => (
        <div key={`${idx}-${item}`} style={{ border: `1px solid ${theme.border}`, borderRadius: 8, padding: "0.45rem 0.6rem", fontSize: "0.8rem" }}>
          {item}
        </div>
      ))}
    </div>
  );
}

function inputStyle(theme) {
  return {
    width: "100%",
    minHeight: 36,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    background: theme.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    color: theme.text,
    padding: "0.5rem 0.6rem",
    outline: "none",
    fontSize: "0.82rem",
  };
}

const dropdownStyles = `
  .gs-dropdown-wrapper { position: relative; display: inline-block; width: 100%; }
  .gs-dropdown-trigger {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.6);
    border-radius: 980px;
    font-size: 15px;
    font-weight: 500;
    color: #1d1d1f;
    cursor: pointer;
    transition: background .15s ease, box-shadow .15s ease, transform .1s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,.1), 0 0 0 .5px rgba(0,0,0,.06);
    user-select: none;
    outline: none;
  }
  .gs-dropdown-trigger:hover { background: rgba(255,255,255,.95); box-shadow: 0 2px 8px rgba(0,0,0,.12), 0 0 0 .5px rgba(0,0,0,.08); }
  .gs-dropdown-trigger:active { transform: scale(.98); background: rgba(240,240,240,.9); }
  .gs-chevron { width: 12px; height: 12px; color: #6e6e73; transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
  .gs-dropdown-wrapper.open .gs-chevron { transform: rotate(180deg); }
  .gs-dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    min-width: 220px;
    width: 100%;
    background: rgba(255,255,255,.72);
    backdrop-filter: blur(40px) saturate(200%);
    -webkit-backdrop-filter: blur(40px) saturate(200%);
    border: 1px solid rgba(255,255,255,.5);
    border-radius: 14px;
    box-shadow: 0 4px 6px rgba(0,0,0,.05), 0 10px 25px rgba(0,0,0,.10), 0 20px 50px rgba(0,0,0,.08), 0 0 0 .5px rgba(0,0,0,.06);
    padding: 6px;
    z-index: 1000;
    opacity: 0;
    transform: scale(.95) translateY(-6px);
    transform-origin: top left;
    pointer-events: none;
    transition: opacity .2s cubic-bezier(.16,1,.3,1), transform .25s cubic-bezier(.16,1,.3,1);
  }
  .gs-dropdown-wrapper.open .gs-dropdown-menu { opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }
  .gs-menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 7px 10px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 400;
    color: #1d1d1f;
    cursor: pointer;
    border: none;
    background: transparent;
    transition: background .1s ease;
  }
  .gs-menu-item:hover { background: rgba(0,0,0,.04); }
  .gs-menu-item:active { background: rgba(0,0,0,.08); }
  .gs-menu-item.checked { font-weight: 500; }
  .gs-checkmark { width: 14px; color: #0071e3; text-align: right; }
`;
