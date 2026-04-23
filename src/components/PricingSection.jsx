import React, { memo } from "react";
import { Pricing } from "./ui/single-pricing-card-1";

const PricingSection = memo(({ theme, onNavigate }) => {
  return (
    <div style={{ background: theme.bg, color: theme.text }}>
      <Pricing onNavigate={onNavigate} />
    </div>
  );
});

export default PricingSection;
