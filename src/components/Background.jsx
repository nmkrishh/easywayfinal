import React, { memo, useEffect, useRef } from "react";

const Background = memo(({ theme }) => {
  const glowRef = useRef(null);

  // Directly track mouse to move the gradient without triggering App re-renders
  useEffect(() => {
    const onMouseMove = (e) => {
      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(circle 500px at ${e.clientX}px ${e.clientY}px, ${theme.accentGlow} 0%, transparent 60%)`;
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [theme.accentGlow]);

  return (
    <>
      <div 
        ref={glowRef}
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1,
          background: `radial-gradient(circle 500px at -500px -500px, ${theme.accentGlow} 0%, transparent 60%)`,
        }} 
      />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />
    </>
  );
});

export default Background;
