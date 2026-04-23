import React, { useMemo, useState } from "react";
import { connectBufferByToken, generateScheduleImage, getBufferConnectUrl, scheduleBufferPost } from "../lib/buffer";

export default function SchedulePostModal({
  theme,
  open,
  onClose,
  bufferStatus,
  onRefreshBufferStatus,
  defaultCaption = "",
  defaultImageUrl = "",
}) {
  const [platform, setPlatform] = useState("instagram");
  const [profileId, setProfileId] = useState("");
  const [caption, setCaption] = useState(defaultCaption);
  const [imageUrl, setImageUrl] = useState(defaultImageUrl);
  const [scheduleTime, setScheduleTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [bufferToken, setBufferToken] = useState("");

  const profiles = useMemo(() => {
    const all = Array.isArray(bufferStatus?.profiles) ? bufferStatus.profiles : [];
    return all.filter((p) => {
      const label = String(p?.service || p?.service_username || "").toLowerCase();
      return platform === "instagram" ? label.includes("instagram") : label.includes("linkedin");
    });
  }, [bufferStatus, platform]);

  React.useEffect(() => {
    setCaption(defaultCaption);
    setImageUrl(defaultImageUrl);
  }, [defaultCaption, defaultImageUrl, open]);

  if (!open) return null;

  const connectBuffer = () => {
    const url = getBufferConnectUrl();
    const popup = window.open(url, "_blank", "width=700,height=820");
    const listener = async (event) => {
      if (event?.data?.type !== "easyway-buffer-connected") return;
      window.removeEventListener("message", listener);
      try {
        await onRefreshBufferStatus?.();
      } finally {
        popup?.close?.();
      }
    };
    window.addEventListener("message", listener);
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    const proceed = window.confirm("Generate AI image for this social post now?");
    if (!proceed) return;
    setBusy(true);
    setError("");
    setOk("");
    try {
      const out = await generateScheduleImage(imagePrompt.trim());
      setImageUrl(out.imageUrl || "");
      setOk("AI image URL generated.");
    } catch (e) {
      setError(e?.message || "Image generation failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSchedule = async () => {
    setBusy(true);
    setError("");
    setOk("");
    try {
      if (!profileId) throw new Error("Select an account/profile");
      if (!caption.trim()) throw new Error("Caption is required");
      if (!scheduleTime) throw new Error("Schedule time is required");
      await scheduleBufferPost({
        caption: caption.trim(),
        imageUrl: imageUrl.trim(),
        profileId,
        scheduleTime: new Date(scheduleTime).toISOString(),
      });
      setOk("Post scheduled successfully in Buffer.");
    } catch (e) {
      setError(e?.message || "Schedule failed");
    } finally {
      setBusy(false);
    }
  };

  const connected = Boolean(bufferStatus?.connected);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 1800,
        display: "grid",
        placeItems: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(780px, 96vw)",
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 14,
          padding: "1rem",
          display: "grid",
          gap: "0.7rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h3 style={{ margin: 0 }}>Schedule Post</h3>
            <p style={{ margin: "0.2rem 0 0", color: theme.muted, fontSize: "0.82rem" }}>
              Publish to your Instagram or LinkedIn via Buffer OAuth.
            </p>
          </div>
          <button onClick={onClose} style={btn(theme, false)}>Close</button>
        </div>

        {!connected ? (
          <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 10, padding: "0.85rem" }}>
            <p style={{ margin: 0, color: theme.muted, fontSize: "0.84rem" }}>
              Connect Buffer first to fetch your social profiles.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
              <button onClick={connectBuffer} style={btn(theme, true)}>Connect Instagram / LinkedIn (Buffer OAuth)</button>
            </div>
            <div style={{ marginTop: "0.7rem", display: "grid", gap: "0.45rem" }}>
              <input
                value={bufferToken}
                onChange={(e) => setBufferToken(e.target.value)}
                placeholder="Or paste Buffer access token"
                style={input(theme)}
              />
              <button
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  setOk("");
                  try {
                    await connectBufferByToken(bufferToken.trim());
                    await onRefreshBufferStatus?.();
                    setOk("Buffer connected via access token.");
                    setBufferToken("");
                  } catch (e) {
                    setError(e?.message || "Token connect failed");
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy || !bufferToken.trim()}
                style={btn(theme, false)}
              >
                Connect with Token
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <select value={platform} onChange={(e) => { setPlatform(e.target.value); setProfileId(""); }} style={input(theme)}>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
              </select>
              <select value={profileId} onChange={(e) => setProfileId(e.target.value)} style={input(theme)}>
                <option value="">Select connected account</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.service || "social"} - {p.service_username || p.formatted_username || p.id}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              rows={5}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write caption..."
              style={{ ...input(theme), minHeight: 120, resize: "vertical" }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.5rem" }}>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" style={input(theme)} />
              <input value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Optional image prompt" style={input(theme)} />
              <button disabled={busy || !imagePrompt.trim()} onClick={handleGenerateImage} style={btn(theme, true)}>
                {busy ? "..." : "Generate Image"}
              </button>
            </div>

            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              style={input(theme)}
            />

            {error ? <div style={{ color: "#f87171", fontSize: "0.82rem" }}>{error}</div> : null}
            {ok ? <div style={{ color: theme.text, fontSize: "0.82rem" }}>{ok}</div> : null}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button onClick={connectBuffer} style={btn(theme, false)}>Reconnect Buffer</button>
              <button disabled={busy} onClick={handleSchedule} style={btn(theme, true)}>
                {busy ? "Scheduling..." : "Schedule Post"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function input(theme) {
  return {
    width: "100%",
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    background: theme.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    color: theme.text,
    padding: "0.55rem 0.66rem",
    outline: "none",
    fontSize: "0.84rem",
  };
}

function btn(theme, primary) {
  return {
    border: primary ? "none" : `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "0.52rem 0.8rem",
    background: primary ? theme.accentBtnBg : "transparent",
    color: primary ? theme.accentBtnText : theme.text,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.8rem",
  };
}
