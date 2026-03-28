import { useEffect } from "react";

/**
 * useCursor – zero React-state version.
 *
 * Problem: calling setHover() on every mouseover re-renders <App> → <Cursor>,
 * <Background>, and the current page 60+ times/sec → cursor lag.
 *
 * Fix: we emit a lightweight CustomEvent instead of touching React state.
 * Cursor.jsx listens to that event and updates the DOM directly.
 *
 * No React state, no re-renders, no lag.
 */
export const useCursor = () => {
  useEffect(() => {
    let lastHover = false;

    const handleMouseOver = (e) => {
      const target = e.target;
      const tag = target.tagName.toLowerCase();

      const isClickable =
        tag === "button" ||
        tag === "a" ||
        target.closest("button") !== null ||
        target.closest("a") !== null ||
        target.dataset.clickable === "true";

      // Only dispatch when the value actually changes — avoids flooding
      if (isClickable !== lastHover) {
        lastHover = isClickable;
        window.dispatchEvent(
          new CustomEvent("cursorhover", { detail: { hover: isClickable } })
        );
      }
    };

    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    return () => window.removeEventListener("mouseover", handleMouseOver);
  }, []);

  // Keep the same shape so App.jsx doesn't break
  return { pos: { x: 0, y: 0 }, hover: false, setHover: () => {} };
};
