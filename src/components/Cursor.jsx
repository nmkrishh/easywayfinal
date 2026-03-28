import React, { memo, useEffect, useRef } from "react";

/**
 * Cursor – GPU-accelerated with smooth ring trailing effect.
 *
 * - Dot follows the mouse instantly (via transform, GPU only)
 * - Ring lerps (smooth-follows) behind the dot using requestAnimationFrame
 * - Hover state via CustomEvent from useCursor (no React state / re-renders)
 * - All positioning via transform (never left/top) → zero layout cost
 */
const Cursor = memo(({ theme }) => {
  const dotRef         = useRef(null);
  const ringRef        = useRef(null);
  const accentRef      = useRef(theme.accent);
  const accentGlowRef  = useRef(theme.accentGlow);

  // Keep color refs fresh when theme toggles
  useEffect(() => {
    accentRef.current     = theme.accent;
    accentGlowRef.current = theme.accentGlow;
    if (dotRef.current)  dotRef.current.style.background   = theme.accent;
    if (ringRef.current) ringRef.current.style.borderColor = theme.accent;
  }, [theme.accent, theme.accentGlow]);

  useEffect(() => {
    // Current mouse position (dot snaps here instantly)
    let mx = -200, my = -200;
    // Ring's smoothed position (lerps towards mx/my)
    let rx = -200, ry = -200;
    let rafId = null;

    // ── Lerp factor: lower = more trailing ──
    const LERP = 0.2;

    const tick = () => {
      // Smooth-follow ring position
      rx += (mx - rx) * LERP;
      ry += (my - ry) * LERP;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    const onMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      // Dot snaps instantly
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mx}px, ${my}px)`;
      }
    };

    const onHover = (e) => {
      const ring = ringRef.current;
      if (!ring) return;
      const { hover } = e.detail;
      ring.style.width      = hover ? "56px"  : "36px";
      ring.style.height     = hover ? "56px"  : "36px";
      ring.style.marginLeft = hover ? "-28px" : "-18px";
      ring.style.marginTop  = hover ? "-28px" : "-18px";
      ring.style.opacity    = hover ? "0.15"  : "0.45";
      ring.style.background = hover ? accentGlowRef.current : "transparent";
    };

    rafId = requestAnimationFrame(tick);
    window.addEventListener("mousemove",   onMouseMove, { passive: true });
    window.addEventListener("cursorhover", onHover,     { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove",   onMouseMove);
      window.removeEventListener("cursorhover", onHover);
    };
  }, []);

  return (
    <>
      {/* Dot — snaps instantly to mouse */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          pointerEvents: "none",
          zIndex: 99999,
          top: 0, left: 0,
          width: 8, height: 8,
          marginLeft: -4, marginTop: -4,
          borderRadius: "50%",
          background: theme.accent,
          willChange: "transform",
          transform: "translate(-200px, -200px)",
        }}
      />

      {/* Ring — trails behind the dot smoothly */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          pointerEvents: "none",
          zIndex: 99998,
          top: 0, left: 0,
          width: 36, height: 36,
          marginLeft: -18, marginTop: -18,
          borderRadius: "50%",
          border: `1.5px solid ${theme.accent}`,
          background: "transparent",
          opacity: 0.45,
          transition: "width 0.18s ease, height 0.18s ease, margin 0.18s ease, background 0.18s ease, opacity 0.18s ease",
          willChange: "transform",
          transform: "translate(-200px, -200px)",
        }}
      />
    </>
  );
});

Cursor.displayName = "Cursor";
export default Cursor;
