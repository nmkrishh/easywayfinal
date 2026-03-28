import React, { memo } from "react";

const Footer = memo(({ theme }) => (
  <footer style={{
    padding: "2rem", borderTop: `1px solid ${theme.border}`,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: "0.85rem", color: theme.muted,
    zIndex: 2, position: "relative", flexWrap: "wrap", gap: "1rem",
  }}>
    <span>© 2026 EasyWay. All rights reserved.</span>
    <span>Designed for businesses that want to scale.</span>
  </footer>
));

export default Footer;
