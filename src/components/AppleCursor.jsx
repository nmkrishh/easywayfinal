import React, { memo, useEffect, useRef } from "react";

const CURSORS = {
  default: { src: "/cursors/left_ptr.svg", w: 24, h: 24, hotX: 2, hotY: 2 },
  pointer: { src: "/cursors/hand2.svg", w: 24, h: 24, hotX: 6, hotY: 2 },
  text: { src: "/cursors/xterm.svg", w: 24, h: 24, hotX: 11, hotY: 12 },
};

const AppleCursor = memo(function AppleCursor() {
  const cursorRef = useRef(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const prevMouseRef = useRef({ x: -100, y: -100, t: 0 });
  const scaleRef = useRef({ current: 1, target: 1, lastMoveAt: 0 });
  const modeRef = useRef("default");
  const rafRef = useRef(0);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return undefined;
    const prevHtmlCursor = document.documentElement.style.cursor;
    const prevBodyCursor = document.body.style.cursor;
    document.documentElement.style.cursor = "none";
    document.body.style.cursor = "none";

    const setMode = (next) => {
      if (next === modeRef.current || !cursorRef.current) return;
      modeRef.current = next;
      const def = CURSORS[next] || CURSORS.default;
      cursorRef.current.src = def.src;
      cursorRef.current.style.width = `${def.w}px`;
      cursorRef.current.style.height = `${def.h}px`;
    };

    const classifyTarget = (target) => {
      if (!target || !(target instanceof HTMLElement)) return "default";

      const isText =
        target.closest("input:not([type='button']):not([type='submit'])") ||
        target.closest("textarea") ||
        target.closest("[contenteditable='true']");
      if (isText) return "text";

      const isPointer =
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[role='button']") ||
        target.closest("[data-clickable='true']");
      if (isPointer) return "pointer";

      return "default";
    };

    const render = () => {
      if (!cursorRef.current) return;
      const mode = CURSORS[modeRef.current] || CURSORS.default;
      const x = mouseRef.current.x - mode.hotX;
      const y = mouseRef.current.y - mode.hotY;
      const now = performance.now();
      if (now - scaleRef.current.lastMoveAt > 120) {
        scaleRef.current.target = 1;
      }
      scaleRef.current.current += (scaleRef.current.target - scaleRef.current.current) * 0.2;
      cursorRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scaleRef.current.current})`;
      rafRef.current = requestAnimationFrame(render);
    };

    const onMove = (e) => {
      const now = performance.now();
      if (prevMouseRef.current.t > 0) {
        const dx = e.clientX - prevMouseRef.current.x;
        const dy = e.clientY - prevMouseRef.current.y;
        const dt = Math.max(1, now - prevMouseRef.current.t);
        const speed = Math.hypot(dx, dy) / dt; // px/ms
        // No hard upper cap: scale keeps growing with pointer speed.
        // A small multiplier keeps low-speed motion natural.
        scaleRef.current.target = 1 + (speed * 0.5);
      }

      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      prevMouseRef.current.x = e.clientX;
      prevMouseRef.current.y = e.clientY;
      prevMouseRef.current.t = now;
      scaleRef.current.lastMoveAt = now;
      setMode(classifyTarget(e.target));
    };

    const onOver = (e) => setMode(classifyTarget(e.target));
    const onLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = "0";
    };
    const onEnter = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = "1";
    };

    rafRef.current = requestAnimationFrame(render);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mouseleave", onLeave, { passive: true });
    window.addEventListener("mouseenter", onEnter, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseenter", onEnter);
      document.documentElement.style.cursor = prevHtmlCursor;
      document.body.style.cursor = prevBodyCursor;
    };
  }, []);

  return (
    <img
      ref={cursorRef}
      src={CURSORS.default.src}
      alt=""
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: `${CURSORS.default.w}px`,
        height: `${CURSORS.default.h}px`,
        pointerEvents: "none",
        zIndex: 2147483647,
        transform: "translate(-100px, -100px)",
        opacity: 1,
        willChange: "transform",
        background: "transparent",
      }}
    />
  );
});

export default AppleCursor;
