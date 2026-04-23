import React, { useEffect, useState } from "react";
import {
  changeUserPassword,
  confirmEmailChange,
  disableTwoFactor,
  enableTwoFactor,
  getSessionInfo,
  getUserSettings,
  requestEmailChange,
  revokeAllSessions,
  saveUserSettings,
  setupTwoFactor,
} from "../../lib/dashboard";

export default function DashboardSettingsTab({ theme }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    company: "",
    timezone: "",
    defaultProjectType: "website",
    profileImageUrl: "",
    twoFactorEnabled: false,
    role: "owner",
    plan: "starter",
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [emailFlow, setEmailFlow] = useState({ newEmail: "", token: "", previewToken: "", expiresAt: "" });
  const [twoFaFlow, setTwoFaFlow] = useState({ secret: "", otpauthUrl: "", code: "" });
  const [sessionInfo, setSessionInfo] = useState({ sessionVersion: 1, currentRole: "owner", currentPlan: "starter" });

  const bootstrap = async () => {
    const [settingsData, sessionsData] = await Promise.all([getUserSettings(), getSessionInfo()]);
    setProfile({
      name: settingsData?.user?.name || "",
      email: settingsData?.user?.email || "",
      company: settingsData?.settings?.company || "",
      timezone: settingsData?.settings?.timezone || "",
      defaultProjectType: settingsData?.settings?.defaultProjectType || "website",
      profileImageUrl: settingsData?.settings?.profileImageUrl || "",
      twoFactorEnabled: Boolean(settingsData?.settings?.twoFactorEnabled),
      role: settingsData?.access?.role || "owner",
      plan: settingsData?.access?.plan || "starter",
    });
    setSessionInfo({
      sessionVersion: Number(sessionsData?.sessions?.sessionVersion || 1),
      currentRole: sessionsData?.sessions?.currentRole || settingsData?.access?.role || "owner",
      currentPlan: sessionsData?.sessions?.currentPlan || settingsData?.access?.plan || "starter",
    });
  };

  useEffect(() => {
    bootstrap()
      .catch((err) => setError(err?.message || "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await saveUserSettings({
        name: profile.name,
        company: profile.company,
        timezone: profile.timezone,
        defaultProjectType: profile.defaultProjectType,
        profileImageUrl: profile.profileImageUrl,
      });
      setMessage("Settings saved");
    } catch (err) {
      setError(err?.message || "Failed to save settings");
    } finally {
      setBusy(false);
    }
  };

  const onImageFile = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfile((p) => ({ ...p, profileImageUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const doChangePassword = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await changeUserPassword(passwordForm);
      setMessage(data?.message || "Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setError(err?.message || "Failed to change password");
    } finally {
      setBusy(false);
    }
  };

  const doRequestEmailChange = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await requestEmailChange({ newEmail: emailFlow.newEmail });
      setEmailFlow((p) => ({
        ...p,
        previewToken: data?.verificationToken || "",
        expiresAt: data?.expiresAt || "",
      }));
      setMessage("Email change request created. Use the token to confirm.");
    } catch (err) {
      setError(err?.message || "Failed to start email change");
    } finally {
      setBusy(false);
    }
  };

  const doConfirmEmailChange = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await confirmEmailChange({ token: emailFlow.token });
      setProfile((p) => ({ ...p, email: data?.email || p.email }));
      setEmailFlow({ newEmail: "", token: "", previewToken: "", expiresAt: "" });
      setMessage("Email changed. Please sign in again on other devices.");
    } catch (err) {
      setError(err?.message || "Failed to confirm email change");
    } finally {
      setBusy(false);
    }
  };

  const doSetup2FA = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await setupTwoFactor();
      setTwoFaFlow((p) => ({ ...p, secret: data?.secret || "", otpauthUrl: data?.otpauthUrl || "" }));
      setMessage("2FA setup started. Add secret to authenticator and verify code.");
    } catch (err) {
      setError(err?.message || "Failed to setup 2FA");
    } finally {
      setBusy(false);
    }
  };

  const doEnable2FA = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await enableTwoFactor({ code: twoFaFlow.code });
      setProfile((p) => ({ ...p, twoFactorEnabled: true }));
      setTwoFaFlow((p) => ({ ...p, code: "" }));
      setMessage("2FA enabled");
    } catch (err) {
      setError(err?.message || "Failed to enable 2FA");
    } finally {
      setBusy(false);
    }
  };

  const doDisable2FA = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await disableTwoFactor({ code: twoFaFlow.code });
      setProfile((p) => ({ ...p, twoFactorEnabled: false }));
      setTwoFaFlow({ secret: "", otpauthUrl: "", code: "" });
      setMessage("2FA disabled");
    } catch (err) {
      setError(err?.message || "Failed to disable 2FA");
    } finally {
      setBusy(false);
    }
  };

  const doRevokeSessions = async () => {
    if (!window.confirm("Revoke all other sessions? You may need to re-login on other devices.")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await revokeAllSessions();
      const data = await getSessionInfo();
      setSessionInfo((s) => ({ ...s, sessionVersion: Number(data?.sessions?.sessionVersion || s.sessionVersion + 1) }));
      setMessage("All sessions revoked");
    } catch (err) {
      setError(err?.message || "Failed to revoke sessions");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p style={{ color: theme.muted }}>Loading settings...</p>;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={card(theme)}>
        <h3 style={{ marginTop: 0 }}>Account Settings</h3>
        <p style={{ color: theme.muted, marginTop: 0, marginBottom: "0.65rem" }}>
          Role: <strong>{profile.role}</strong> | Plan: <strong>{profile.plan}</strong>
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.8rem", alignItems: "start", marginBottom: "0.8rem" }}>
          <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, height: 100, width: 100, overflow: "hidden", background: theme.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}>
            {profile.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : null}
          </div>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <input value={profile.profileImageUrl} onChange={(e) => setProfile((p) => ({ ...p, profileImageUrl: e.target.value }))} placeholder="Profile image URL or Data URL" style={input(theme)} />
            <input type="file" accept="image/*" onChange={(e) => onImageFile(e.target.files?.[0])} style={input(theme)} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          <input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Display name" style={input(theme)} />
          <input value={profile.email} disabled placeholder="Email" style={{ ...input(theme), opacity: 0.7 }} />
          <input value={profile.company} onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))} placeholder="Company" style={input(theme)} />
          <input value={profile.timezone} onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))} placeholder="Timezone (e.g. Asia/Kolkata)" style={input(theme)} />
          <select value={profile.defaultProjectType} onChange={(e) => setProfile((p) => ({ ...p, defaultProjectType: e.target.value }))} style={input(theme)}>
            <option value="website">Website</option>
            <option value="app">App</option>
          </select>
        </div>
        <button onClick={save} disabled={busy} style={btn(theme, busy)}>{busy ? "Saving..." : "Save Settings"}</button>
      </div>

      <div style={card(theme)}>
        <h3 style={{ marginTop: 0 }}>Email Change Flow</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input value={emailFlow.newEmail} onChange={(e) => setEmailFlow((p) => ({ ...p, newEmail: e.target.value }))} placeholder="New email" style={input(theme)} />
          <button onClick={doRequestEmailChange} disabled={busy || !emailFlow.newEmail.trim()} style={btn(theme, busy || !emailFlow.newEmail.trim())}>Request Token</button>
        </div>
        {emailFlow.previewToken ? (
          <p style={{ color: theme.muted, fontSize: "0.8rem", marginTop: 0 }}>
            Dev token preview: <code>{emailFlow.previewToken}</code> (expires: {new Date(emailFlow.expiresAt).toLocaleString()})
          </p>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem" }}>
          <input value={emailFlow.token} onChange={(e) => setEmailFlow((p) => ({ ...p, token: e.target.value }))} placeholder="Paste verification token" style={input(theme)} />
          <button onClick={doConfirmEmailChange} disabled={busy || !emailFlow.token.trim()} style={btn(theme, busy || !emailFlow.token.trim())}>Confirm Email</button>
        </div>
      </div>

      <div style={card(theme)}>
        <h3 style={{ marginTop: 0 }}>Security</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.6rem", alignItems: "center" }}>
          <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} placeholder="Current password" style={input(theme)} />
          <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} placeholder="New password" style={input(theme)} />
          <button onClick={doChangePassword} disabled={busy || !passwordForm.currentPassword || !passwordForm.newPassword} style={btn(theme, busy || !passwordForm.currentPassword || !passwordForm.newPassword)}>
            Change Password
          </button>
        </div>

        <div style={{ marginTop: "0.8rem", borderTop: `1px solid ${theme.border}`, paddingTop: "0.8rem", display: "grid", gap: "0.5rem" }}>
          <div style={{ color: theme.muted, fontSize: "0.84rem" }}>2FA Status: {profile.twoFactorEnabled ? "Enabled" : "Disabled"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "0.5rem", alignItems: "center" }}>
            <button onClick={doSetup2FA} disabled={busy} style={btn(theme, busy)}>Setup 2FA</button>
            <input value={twoFaFlow.code} onChange={(e) => setTwoFaFlow((p) => ({ ...p, code: e.target.value }))} placeholder="Authenticator 6-digit code" style={input(theme)} />
            <button onClick={doEnable2FA} disabled={busy || !twoFaFlow.code.trim()} style={btn(theme, busy || !twoFaFlow.code.trim())}>Enable</button>
            <button onClick={doDisable2FA} disabled={busy || !twoFaFlow.code.trim()} style={btn(theme, busy || !twoFaFlow.code.trim())}>Disable</button>
          </div>
          {twoFaFlow.secret ? (
            <div style={{ color: theme.muted, fontSize: "0.8rem" }}>
              Secret: <code>{twoFaFlow.secret}</code>
            </div>
          ) : null}
        </div>
      </div>

      <div style={card(theme)}>
        <h3 style={{ marginTop: 0 }}>Session Management</h3>
        <p style={{ color: theme.muted, marginTop: 0 }}>Session Version: {sessionInfo.sessionVersion}</p>
        <button onClick={doRevokeSessions} disabled={busy} style={btn(theme, busy)}>Revoke All Sessions</button>
      </div>

      {(error || message) && (
        <div style={{ ...card(theme), color: error ? "#f87171" : theme.text, fontWeight: 600 }}>
          {error || message}
        </div>
      )}
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
    marginTop: "0.1rem",
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
