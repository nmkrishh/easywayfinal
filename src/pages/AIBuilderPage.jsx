import React, { useState, useRef, useEffect, useCallback } from "react";
import { N8N_WEBHOOK_URL } from "../constants/theme";
import { useChatColors } from "../hooks/useChatColors";
import ChatTopBar from "../components/chat/ChatTopBar";
import WelcomeScreen from "../components/chat/WelcomeScreen";
import ChatBubble from "../components/chat/ChatBubble";
import TypingIndicator from "../components/chat/TypingIndicator";
import TemplatesSection from "../components/chat/TemplatesSection";
import ChatInputBar from "../components/chat/ChatInputBar";

const CHIPS = [
  "Build an e-commerce app",
  "App with AI features",
  "Marketplace app",
  "Social networking app",
];

const ts = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function AIBuilderPage({ theme, onBack }) {
  const c = useChatColors(theme);

  const [msgs, setMsgs]                   = useState([]);
  const [input, setInput]                 = useState("");
  const [imgs, setImgs]                   = useState([]);
  const [busy, setBusy]                   = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const chatEndRef = useRef(null);
  const textRef    = useRef(null);
  const fileRef    = useRef(null);

  /* ── latest state in a ref so send() stays stable ── */
  const stateRef = useRef({ input, imgs });
  useEffect(() => { stateRef.current = { input, imgs }; }, [input, imgs]);

  /* auto-scroll */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  /* auto-resize textarea */
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  /* keyframe injection for typing dots */
  useEffect(() => {
    const id = "ew-typing-kf";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes typingPulse {
        0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
        40%            { opacity: 1;    transform: scale(1);    }
      }
    `;
    document.head.appendChild(s);
    return () => document.getElementById(id)?.remove();
  }, []);

  const onFiles = useCallback((e) => {
    const picked = Array.from(e.target.files)
      .filter((f) => f.size <= 5 * 1024 * 1024)
      .slice(0, 5)
      .map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setImgs((prev) => [...prev, ...picked].slice(0, 5));
    e.target.value = "";
  }, []);

  const removeImg = useCallback((i) => {
    setImgs((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, j) => j !== i);
    });
  }, []);

  const send = useCallback(async (override) => {
    const { input: curInput, imgs: curImgs } = stateRef.current;
    const text = typeof override === "string" ? override.trim() : curInput.trim();
    if (!text && curImgs.length === 0) return;

    const sentImgs = [...curImgs];
    setMsgs((prev) => [...prev, {
      id: Date.now().toString(),
      role: "user", text,
      imgUrls: sentImgs.map((i) => i.url),
      time: ts(),
    }]);
    setInput("");
    setImgs([]);
    setShowTemplates(false);
    setBusy(true);

    try {
      const fd = new FormData();
      fd.append("type", "ai-builder");
      fd.append("prompt", text);
      fd.append("timestamp", new Date().toISOString());
      sentImgs.forEach((img, i) => fd.append(`image_${i}`, img.file, img.file.name));

      const res  = await fetch(N8N_WEBHOOK_URL, { method: "POST", body: fd });
      const data = await res.json().catch(() => null);

      setMsgs((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: data?.reply ?? "Thanks! Our AI agents are on it — you will receive your app details shortly.",
        time: ts(),
      }]);
    } catch {
      setMsgs((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: "Got your request! Once the connection is live I will generate your app instantly.",
        time: ts(),
      }]);
    } finally {
      setBusy(false);
      sentImgs.forEach((img) => URL.revokeObjectURL(img.url));
    }
  }, []);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }, [send]);

  const useTemplate = useCallback((t) => {
    setInput(t.prompt);
    setTimeout(() => textRef.current?.focus(), 30);
  }, []);

  const hasChat = msgs.length > 0;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: c.bg, position: "relative",
    }}>
      <ChatTopBar
        c={c}
        onBack={onBack}
        title="AI App Builder"
        badge="App"
      />

      <div style={{
        flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "0 1rem",
      }}>
        <div style={{ width: "100%", maxWidth: 720 }}>

          {!hasChat && (
            <WelcomeScreen
              c={c}
              chips={CHIPS}
              onChip={send}
              badgeLabel="AI App Builder"
              title="What app shall we build?"
              subtitle="Describe your idea, upload screenshots, or pick a template below."
            />
          )}

          {hasChat && (
            <div style={{ paddingTop: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {msgs.map((m) => <ChatBubble key={m.id} msg={m} c={c} />)}
              {busy && <TypingIndicator c={c} />}
              <div ref={chatEndRef} style={{ height: 8 }} />
            </div>
          )}

          {showTemplates && (
            <TemplatesSection c={c} onPick={useTemplate} variant="app" />
          )}
        </div>
      </div>

      <ChatInputBar
        c={c}
        input={input} setInput={setInput}
        imgs={imgs} removeImg={removeImg}
        textRef={textRef} fileRef={fileRef}
        onFiles={onFiles} onKeyDown={onKeyDown}
        send={send} busy={busy}
        showTemplates={showTemplates}
        setShowTemplates={setShowTemplates}
        hasChat={hasChat}
        placeholder="Describe your app idea…"
      />
    </div>
  );
}
