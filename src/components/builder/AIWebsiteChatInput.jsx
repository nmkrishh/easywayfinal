import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Lightbulb, Mic, Globe, Paperclip, Send } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "motion/react";

const PLACEHOLDERS = [
  "Generate website with HextaUI",
  "Create a new project with Next.js",
  "What is the meaning of life?",
  "What is the best way to learn React?",
  "How to cook a delicious meal?",
  "Summarize this article",
];

const AIWebsiteChatInput = memo(({
  c,
  inputValue,
  setInputValue,
  imageData,
  setImageData,
  onAttachFile,
  onSend,
  onKeyDown,
  busy,
  placeholder,
  textareaRef,
  fileInputRef,
}) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const wrapperRef = useRef(null);
  const isDark = Boolean(c?.dark);
  const canSend = !busy && inputValue.trim().length > 0;

  const palette = {
    shellBorder: c?.border || (isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.1)"),
    barBg: isDark ? "rgba(102, 102, 102, 0.55)" : "#ffffff",
    barBorder: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#f5f5f5" : "#111111",
    muted: isDark ? "rgba(255,255,255,0.65)" : "#9ca3af",
    hover: isDark ? "rgba(255,255,255,0.12)" : "#f3f4f6",
    chip: isDark ? "rgba(255,255,255,0.12)" : "#f3f4f6",
    chipText: isDark ? "#f5f5f5" : "#374151",
    sendBg: canSend ? "#000000" : (isDark ? "rgba(255,255,255,0.28)" : "#d1d5db"),
    sendText: canSend ? "#ffffff" : (isDark ? "rgba(255,255,255,0.7)" : "#6b7280"),
  };

  const placeholders = useMemo(() => {
    const primary = (placeholder || "Describe the website you want to build...").trim();
    return [primary, ...PLACEHOLDERS.filter((p) => p !== primary)];
  }, [placeholder]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaceholderIndex(0);
    setShowPlaceholder(true);
  }, [placeholders]);

  useEffect(() => {
    if (isActive || inputValue || busy) return undefined;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [busy, inputValue, isActive, placeholders.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if (!inputValue) setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue]);

  const handleActivate = () => setIsActive(true);

  const expanded = isActive || inputValue || imageData;

  const containerVariants = {
    collapsed: {
      height: 68,
      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
    expanded: {
      height: imageData ? 182 : 128,
      boxShadow: "0 8px 32px 0 rgba(0,0,0,0.16)",
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
  };

  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };

  const letterVariants = {
    initial: {
      opacity: 0,
      filter: "blur(12px)",
      y: 10,
    },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: "blur(12px)",
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
  };

  return (
    <div
      style={{
        borderTop: `1px solid ${palette.shellBorder}`,
        padding: "0.75rem 0.9rem",
        background: "transparent",
        flexShrink: 0,
      }}
    >
      <motion.div
        ref={wrapperRef}
        variants={containerVariants}
        animate={expanded ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{
          overflow: "hidden",
          borderRadius: 28,
          background: palette.barBg,
          border: `1px solid ${palette.barBorder}`,
        }}
        onClick={handleActivate}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", width: "100%", height: "100%" }}>
          {imageData && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.7rem 0.9rem 0.1rem" }}>
              <img
                src={imageData}
                alt="attachment"
                style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: `1px solid ${palette.barBorder}` }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageData(null);
                }}
                type="button"
                style={{
                  background: palette.chip,
                  border: `1px solid ${palette.barBorder}`,
                  borderRadius: 999,
                  color: palette.text,
                  cursor: "pointer",
                  padding: "0.24rem 0.72rem",
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-body)",
                }}
              >
                Remove
              </button>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.5rem 0.5rem", borderRadius: 999, width: "100%" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              title="Attach image"
              type="button"
              style={{
                padding: 12,
                borderRadius: 999,
                border: "none",
                background: "transparent",
                color: palette.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = palette.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Paperclip size={20} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => onAttachFile?.(e.target.files?.[0])}
            />

            <div style={{ position: "relative", flex: 1, minHeight: 42 }}>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                disabled={busy}
                onFocus={handleActivate}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  borderRadius: 8,
                  padding: "0.56rem 0.4rem",
                  fontSize: "1rem",
                  lineHeight: 1.45,
                  background: "transparent",
                  color: palette.text,
                  maxHeight: 110,
                  overflowY: "auto",
                  fontFamily: "var(--font-body)",
                  position: "relative",
                  zIndex: 1,
                }}
              />

              <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", display: "flex", alignItems: "center", padding: "0.56rem 0.4rem" }}>
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !inputValue && !busy && (
                    <motion.span
                      key={placeholderIndex}
                      style={{
                        color: palette.muted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                      variants={placeholderContainerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {placeholders[placeholderIndex].split("").map((char, i) => (
                        <motion.span
                          key={`${char}-${i}`}
                          variants={letterVariants}
                          style={{ display: "inline-block" }}
                        >
                          {char === " " ? "\u00A0" : char}
                        </motion.span>
                      ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <button
              onClick={(e) => e.stopPropagation()}
              title="Voice input"
              type="button"
              style={{
                padding: 12,
                borderRadius: 999,
                border: "none",
                background: "transparent",
                color: palette.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = palette.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Mic size={20} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSend?.();
              }}
              disabled={!canSend}
              title="Send"
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: palette.sendBg,
                color: palette.sendText,
                border: "none",
                cursor: canSend ? "pointer" : "default",
                padding: "0.72rem",
                borderRadius: 999,
                fontWeight: 500,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              <Send size={18} />
            </button>
          </div>

          <motion.div
            style={{ width: "100%", display: "flex", justifyContent: "flex-start", padding: "0 0.95rem", alignItems: "center", fontSize: "0.84rem", marginTop: 2 }}
            variants={{
              hidden: {
                opacity: 0,
                y: 20,
                pointerEvents: "none",
                transition: { duration: 0.25 },
              },
              visible: {
                opacity: 1,
                y: 0,
                pointerEvents: "auto",
                transition: { duration: 0.35, delay: 0.08 },
              },
            }}
            initial="hidden"
            animate={expanded ? "visible" : "hidden"}
          >
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.55rem" }}>
              <button
                title="Think"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setThinkActive((a) => !a);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0.42rem 0.82rem",
                  borderRadius: 999,
                  border: thinkActive ? "1px solid rgba(37,99,235,0.6)" : "1px solid transparent",
                  background: thinkActive ? "rgba(37,99,235,0.15)" : palette.chip,
                  color: thinkActive ? (isDark ? "#bfdbfe" : "#1e3a8a") : palette.chipText,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <Lightbulb size={16} />
                Think
              </button>

              <motion.button
                title="Deep Search"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeepSearchActive((a) => !a);
                }}
                initial={false}
                animate={{
                  width: deepSearchActive ? 126 : 38,
                  paddingLeft: deepSearchActive ? 8 : 10,
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  borderRadius: 999,
                  border: deepSearchActive ? "1px solid rgba(37,99,235,0.6)" : "1px solid transparent",
                  background: deepSearchActive ? "rgba(37,99,235,0.15)" : palette.chip,
                  color: deepSearchActive ? (isDark ? "#bfdbfe" : "#1e3a8a") : palette.chipText,
                  cursor: "pointer",
                  height: 33,
                  fontWeight: 500,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 18 }}>
                  <Globe size={16} />
                </span>
                <motion.span
                  initial={false}
                  animate={{ opacity: deepSearchActive ? 1 : 0 }}
                  style={{ paddingBottom: 2 }}
                >
                  Deep Search
                </motion.span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.62rem",
          color: palette.muted,
          margin: "0.4rem 0 0",
          textAlign: "center",
          letterSpacing: "0.01em",
        }}
      >
        Enter to send · Shift+Enter for new line · Drop an image to attach
      </p>
    </div>
  );
});

AIWebsiteChatInput.displayName = "AIWebsiteChatInput";

export default AIWebsiteChatInput;