import React, { useCallback, useEffect, useMemo, useState } from "react";

const WEBHOOK_URL = "http://localhost:5678/webhook/receive-app-code";

function parseFilename(url) {
  if (!url || typeof url !== "string") return "app-release.apk";
  return url.split("/").pop() || "app-release.apk";
}

export default function DownloadSection({ appName = "EasyWay App", packageName = "com.easyway.app", c }) {
  const colors = {
    bg: c?.surface || "#17171a",
    border: c?.border || "rgba(255,255,255,0.12)",
    text: c?.text || "#f2f2f2",
    muted: c?.muted || "#9a9a9f",
    accentBtnBg: c?.accentBtnBg || "rgb(255 0 64 / 44%)",
    accentBtnText: c?.accentBtnText || "#ffffff",
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const triggerBuildFetch = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName: appName || "EasyWay App",
          packageName: packageName || "com.easyway.app",
        }),
      });

      if (!response.ok) throw new Error("Build not ready");
      const data = await response.json();
      if (!data?.apkUrl || !data?.aabUrl) throw new Error("Build not ready");
      setResult(data);
    } catch {
      setResult(null);
      setError("⏳ Build not ready yet. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [appName, packageName]);

  useEffect(() => {
    triggerBuildFetch();
  }, [triggerBuildFetch]);

  const apkFilename = useMemo(() => parseFilename(result?.apkUrl), [result?.apkUrl]);
  const adbCommand = `adb install ${apkFilename}`;

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(adbCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }, [adbCommand]);

  return (
    <div
      style={{
        margin: "1rem",
        marginTop: 0,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        background: colors.bg,
        padding: "0.9rem",
      }}
    >
      <style>{`@keyframes easywaySpin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontWeight: 700, marginBottom: "0.65rem", color: colors.text }}>Build Download</div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: colors.muted }}>
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: `2px solid ${colors.border}`,
              borderTopColor: colors.text,
              animation: "easywaySpin 0.9s linear infinite",
              display: "inline-block",
            }}
          />
          <span>Checking latest build...</span>
        </div>
      ) : null}

      {!loading && error ? (
        <div>
          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: "0.65rem 0.75rem",
              background: "rgba(255, 193, 7, 0.08)",
              color: colors.text,
              marginBottom: "0.7rem",
            }}
          >
            {error}
          </div>
          <button
            type="button"
            onClick={triggerBuildFetch}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: "0.55rem 0.9rem",
              background: colors.accentBtnBg,
              color: colors.accentBtnText,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && result ? (
        <div style={{ display: "grid", gap: "0.7rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.8rem", flexWrap: "wrap" }}>
            <div style={{ color: colors.text, fontWeight: 600 }}>{result.appName || appName}</div>
            <span
              style={{
                fontSize: "0.78rem",
                border: `1px solid ${colors.border}`,
                borderRadius: 999,
                padding: "0.2rem 0.55rem",
                color: colors.muted,
              }}
            >
              {result.version || "v1"}
            </span>
          </div>

          <div style={{ color: colors.muted, fontSize: "0.85rem" }}>
            Published: {new Date(result.publishedAt || Date.now()).toLocaleDateString()}
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <a
              href={result.apkUrl}
              download
              style={{
                textDecoration: "none",
                borderRadius: 10,
                padding: "0.55rem 0.9rem",
                background: colors.accentBtnBg,
                color: colors.accentBtnText,
                border: `1px solid ${colors.border}`,
                fontWeight: 600,
              }}
            >
              ⬇ Download APK
            </a>
            <a
              href={result.aabUrl}
              download
              style={{
                textDecoration: "none",
                borderRadius: 10,
                padding: "0.55rem 0.9rem",
                background: "transparent",
                color: colors.text,
                border: `1px solid ${colors.border}`,
                fontWeight: 600,
              }}
            >
              ⬇ Download AAB
            </a>
          </div>

          <div
            style={{
              background: "#0c0d10",
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: "0.6rem 0.65rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.7rem",
            }}
          >
            <code style={{ color: "#f3f4f6", fontSize: "0.84rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {adbCommand}
            </code>
            <button
              type="button"
              onClick={onCopy}
              aria-label="Copy ADB command"
              title="Copy"
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                width: 30,
                height: 30,
                background: "transparent",
                color: colors.text,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {copied ? "✓" : "📋"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
