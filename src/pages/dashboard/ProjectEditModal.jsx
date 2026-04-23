import React, { useMemo, useRef, useState } from "react";

const EDITOR_STYLE_ID = "ew-editor-runtime-style";
const EDITOR_SCRIPT_ID = "ew-editor-runtime-script";

export default function ProjectEditModal({ theme, project, saving, aiEditing, onClose, onApply, onPromptApply }) {
  const iframeRef = useRef(null);
  const [prompt, setPrompt] = useState("");

  const editorHtml = useMemo(
    () => buildEditableHtml(project?.html_content || ""),
    [project?.html_content],
  );

  const canEdit = Boolean(project?.html_content && String(project.html_content).trim());

  const handleSave = () => {
    if (!canEdit) return;
    const editorWindow = iframeRef.current?.contentWindow;
    const payload = editorWindow?.__EW_GET_EDITOR_STATE?.();
    const htmlContent = payload?.html || project?.html_content || "";
    onApply({ htmlContent, styleState: payload?.styleState || {} });
  };

  const handlePromptApply = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || !onPromptApply) return;
    await onPromptApply(trimmed);
    setPrompt("");
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.58)",
        backdropFilter: "blur(3px)",
        zIndex: 1500,
        display: "grid",
        placeItems: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1200px, 96vw)",
          height: "min(90vh, 900px)",
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "0.85rem 1rem",
            borderBottom: `1px solid ${theme.border}`,
            display: "grid",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.8rem" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem" }}>Visual Text Editor</h3>
              <p style={{ margin: "0.22rem 0 0", color: theme.muted, fontSize: "0.82rem" }}>
                Click any text element to edit text, color, and font size.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={onClose} style={{ ...actionBtn(theme), background: "transparent", color: theme.text }}>
                Close
              </button>
              <button
                disabled={!canEdit || saving}
                onClick={handleSave}
                style={{
                  ...actionBtn(theme),
                  background: canEdit ? theme.accentBtnBg : theme.border,
                  color: canEdit ? theme.accentBtnText : theme.muted,
                  border: "none",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div
            style={{
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              padding: "0.65rem",
              background: theme.dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ color: theme.muted, fontSize: "0.78rem", marginBottom: "0.45rem" }}>
              AI Edit by Prompt
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem" }}>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Change hero headline to 'Grow Faster', make button green, and update pricing section text."
                style={{
                  width: "100%",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  background: theme.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                  color: theme.text,
                  padding: "0.52rem 0.62rem",
                  outline: "none",
                  fontSize: "0.82rem",
                }}
              />
              <button
                onClick={handlePromptApply}
                disabled={!prompt.trim() || aiEditing}
                style={{
                  ...actionBtn(theme),
                  background: prompt.trim() ? theme.accentBtnBg : theme.border,
                  color: prompt.trim() ? theme.accentBtnText : theme.muted,
                  border: "none",
                  minWidth: 118,
                }}
              >
                {aiEditing ? "Applying..." : "Apply AI Edit"}
              </button>
            </div>
          </div>
        </div>

        {!canEdit ? (
          <div style={{ padding: "1.2rem", color: theme.muted }}>
            This project has no editable HTML content yet.
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title={`editor-${project?.id || "project"}`}
            srcDoc={editorHtml}
            sandbox="allow-same-origin allow-scripts"
            style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
          />
        )}
      </div>
    </div>
  );
}

function actionBtn(theme) {
  return {
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "0.45rem 0.72rem",
    cursor: "pointer",
    background: theme.accentBg,
    color: theme.text,
    fontSize: "0.8rem",
    fontWeight: 600,
  };
}

function buildEditableHtml(sourceHtml) {
  const baseHtml = String(sourceHtml || "").trim() || "<!doctype html><html><head></head><body><p>Edit content</p></body></html>";
  const parser = new DOMParser();
  const doc = parser.parseFromString(baseHtml, "text/html");

  const isReact = baseHtml.includes('type="text/babel"') || baseHtml.includes("react");

  if (!doc.head) {
    const head = doc.createElement("head");
    doc.documentElement.insertBefore(head, doc.body || null);
  }
  if (!doc.body) {
    const body = doc.createElement("body");
    doc.documentElement.appendChild(body);
  }

  if (!isReact) {
    const sourceScripts = doc.querySelectorAll("script");
    sourceScripts.forEach((node) => node.remove());
  }
  
  const cspMeta = doc.querySelectorAll('meta[http-equiv="Content-Security-Policy"], meta[http-equiv="content-security-policy"]');
  cspMeta.forEach((node) => node.remove());

  // Only inject visual editor if it's not a React app
  if (!isReact) {
    const styleEl = doc.createElement("style");
    styleEl.id = EDITOR_STYLE_ID;
    styleEl.setAttribute("data-ew-editor-artifact", "true");
    styleEl.textContent = `
      .ew-text-editable {
        outline: 1px dashed rgba(37, 99, 235, 0.45);
        outline-offset: 2px;
        cursor: text;
        transition: outline-color 120ms ease;
      }
      .ew-text-editable:focus {
        outline: 2px solid rgba(37, 99, 235, 0.85);
      }
    `;

    const scriptEl = doc.createElement("script");
    scriptEl.id = EDITOR_SCRIPT_ID;
    scriptEl.setAttribute("data-ew-editor-artifact", "true");
    scriptEl.textContent = editorRuntimeScript();

    doc.head.appendChild(styleEl);
    doc.body.appendChild(scriptEl);
  }

  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

function editorRuntimeScript() {
  return `
(function () {
  var styleState = {};
  var selected = null;
  var toolbar = null;
  var colorInput = null;
  var fontSelect = null;
  var counter = 0;

  function shouldBeEditable(el) {
    if (!el || !el.tagName) return false;
    var tag = el.tagName.toUpperCase();
    if (["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "SVG", "PATH", "INPUT", "TEXTAREA", "SELECT", "OPTION"].indexOf(tag) >= 0) return false;
    if (el.closest('[data-ew-editor-artifact="true"]')) return false;
    var text = String(el.innerText || "").trim();
    if (!text) return false;
    var childElements = el.children || [];
    for (var i = 0; i < childElements.length; i += 1) {
      var c = childElements[i];
      if (String(c.innerText || "").trim()) {
        return false;
      }
    }
    return true;
  }

  function ensureId(el) {
    var id = el.getAttribute("data-ew-text-id");
    if (id) return id;
    counter += 1;
    id = "ew-text-" + counter;
    el.setAttribute("data-ew-text-id", id);
    return id;
  }

  function applyStyleFromState(el) {
    if (!el) return;
    var id = ensureId(el);
    var current = styleState[id] || {};
    if (current.color) el.style.color = current.color;
    if (current.fontSize) el.style.fontSize = current.fontSize;
  }

  function selectElement(el) {
    selected = el;
    if (!selected) return;
    var id = ensureId(selected);
    selected.focus();

    var state = styleState[id] || {};
    colorInput.value = normalizeColor(state.color || selected.style.color || "#111111");
    fontSelect.value = normalizeFontSize(state.fontSize || selected.style.fontSize || "16px");
    placeToolbar(selected);
    toolbar.style.display = "flex";
  }

  function normalizeColor(value) {
    var color = String(value || "").trim();
    if (!color) return "#111111";
    if (color[0] === "#" && (color.length === 7 || color.length === 4)) {
      if (color.length === 4) {
        return "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
      }
      return color;
    }
    var temp = document.createElement("span");
    temp.style.color = color;
    document.body.appendChild(temp);
    var computed = window.getComputedStyle(temp).color || "rgb(17, 17, 17)";
    temp.remove();
    var match = computed.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/i);
    if (!match) return "#111111";
    var r = Number(match[1]).toString(16).padStart(2, "0");
    var g = Number(match[2]).toString(16).padStart(2, "0");
    var b = Number(match[3]).toString(16).padStart(2, "0");
    return "#" + r + g + b;
  }

  function normalizeFontSize(value) {
    var v = String(value || "").trim();
    var n = parseInt(v, 10);
    if (!Number.isFinite(n)) n = 16;
    if (n < 10) n = 10;
    if (n > 96) n = 96;
    return n + "px";
  }

  function placeToolbar(el) {
    var rect = el.getBoundingClientRect();
    var top = rect.top - 52;
    if (top < 8) top = rect.bottom + 8;
    var left = rect.left;
    var maxLeft = Math.max(8, window.innerWidth - 260);
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;
    toolbar.style.top = top + "px";
    toolbar.style.left = left + "px";
  }

  function updateStyle(partial) {
    if (!selected) return;
    var id = ensureId(selected);
    styleState[id] = Object.assign({}, styleState[id] || {}, partial);
    applyStyleFromState(selected);
    window.__EW_STYLE_STATE = styleState;
    placeToolbar(selected);
  }

  function buildToolbar() {
    toolbar = document.createElement("div");
    toolbar.setAttribute("data-ew-editor-artifact", "true");
    toolbar.style.position = "fixed";
    toolbar.style.zIndex = "2147483647";
    toolbar.style.display = "none";
    toolbar.style.alignItems = "center";
    toolbar.style.gap = "8px";
    toolbar.style.padding = "8px";
    toolbar.style.borderRadius = "10px";
    toolbar.style.background = "rgba(17, 24, 39, 0.94)";
    toolbar.style.color = "#f9fafb";
    toolbar.style.boxShadow = "0 8px 30px rgba(0,0,0,0.35)";
    toolbar.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    toolbar.style.fontSize = "12px";

    var colorLabel = document.createElement("span");
    colorLabel.textContent = "Color";
    colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = "#111111";
    colorInput.style.width = "28px";
    colorInput.style.height = "28px";
    colorInput.style.padding = "0";
    colorInput.style.border = "none";
    colorInput.style.background = "transparent";
    colorInput.addEventListener("input", function (e) {
      updateStyle({ color: e.target.value });
    });

    var fontLabel = document.createElement("span");
    fontLabel.textContent = "Size";
    fontSelect = document.createElement("select");
    var sizes = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px"];
    for (var i = 0; i < sizes.length; i += 1) {
      var opt = document.createElement("option");
      opt.value = sizes[i];
      opt.textContent = sizes[i];
      fontSelect.appendChild(opt);
    }
    fontSelect.style.height = "28px";
    fontSelect.style.borderRadius = "6px";
    fontSelect.style.border = "1px solid rgba(255,255,255,0.22)";
    fontSelect.style.background = "rgba(255,255,255,0.08)";
    fontSelect.style.color = "#f9fafb";
    fontSelect.addEventListener("change", function (e) {
      updateStyle({ fontSize: e.target.value });
    });

    toolbar.appendChild(colorLabel);
    toolbar.appendChild(colorInput);
    toolbar.appendChild(fontLabel);
    toolbar.appendChild(fontSelect);
    document.body.appendChild(toolbar);
  }

  function setupEditableElements() {
    var all = document.body.querySelectorAll("*");
    for (var i = 0; i < all.length; i += 1) {
      var el = all[i];
      if (!shouldBeEditable(el)) continue;
      ensureId(el);
      el.classList.add("ew-text-editable");
      el.setAttribute("contenteditable", "true");
      el.setAttribute("spellcheck", "true");
      el.style.userSelect = "text";
      if (el.tagName.toUpperCase() === "A") {
        el.setAttribute("href", "javascript:void(0)");
      }
      if (el.tagName.toUpperCase() === "BUTTON") {
        el.setAttribute("type", "button");
      }
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        selectElement(e.currentTarget);
      });
      el.addEventListener("focus", function (e) {
        selectElement(e.currentTarget);
      });
      el.addEventListener("input", function (e) {
        var target = e.currentTarget;
        if (!target) return;
        ensureId(target);
      });
    }
  }

  function exportCleanHtml() {
    var parser = new DOMParser();
    var raw = "<!DOCTYPE html>\\n" + document.documentElement.outerHTML;
    var exportDoc = parser.parseFromString(raw, "text/html");
    var runtimeStyle = exportDoc.getElementById("${EDITOR_STYLE_ID}");
    if (runtimeStyle) runtimeStyle.remove();
    var runtimeScript = exportDoc.getElementById("${EDITOR_SCRIPT_ID}");
    if (runtimeScript) runtimeScript.remove();
    var artifacts = exportDoc.querySelectorAll('[data-ew-editor-artifact="true"]');
    for (var i = 0; i < artifacts.length; i += 1) {
      artifacts[i].remove();
    }
    var editable = exportDoc.querySelectorAll("[data-ew-text-id]");
    for (var j = 0; j < editable.length; j += 1) {
      editable[j].removeAttribute("data-ew-text-id");
      editable[j].removeAttribute("contenteditable");
      editable[j].removeAttribute("spellcheck");
      editable[j].classList.remove("ew-text-editable");
    }
    return "<!DOCTYPE html>\\n" + exportDoc.documentElement.outerHTML;
  }

  buildToolbar();
  setupEditableElements();

  var observer = new MutationObserver(function () {
    setupEditableElements();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener("click", function (e) {
    if (!toolbar) return;
    if (toolbar.contains(e.target)) return;
    if (selected && selected.contains(e.target)) return;
    toolbar.style.display = "none";
    selected = null;
  });

  window.addEventListener("resize", function () {
    if (selected && toolbar.style.display !== "none") {
      placeToolbar(selected);
    }
  });

  window.__EW_STYLE_STATE = styleState;
  window.__EW_GET_EDITOR_STATE = function () {
    return {
      html: exportCleanHtml(),
      styleState: styleState,
    };
  };
})();
`;
}
