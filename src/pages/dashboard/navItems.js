import { Layout, Smartphone, Globe, Box, CreditCard, Settings, Rocket } from "lucide-react";

export const DASHBOARD_NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Layout },
  { id: "sites", label: "My Websites", icon: Globe },
  { id: "apps", label: "My Apps", icon: Smartphone },
  { id: "growth", label: "Growth Suite", icon: Rocket },
  { id: "products", label: "Products", icon: Box },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
];
