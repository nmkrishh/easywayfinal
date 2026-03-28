import React, { useState, useCallback, useEffect } from "react";
import { getTheme } from "./constants/theme";
import { globalStyles } from "./styles/global";
import { useCursor } from "./hooks/useCursor";
import Cursor from "./components/Cursor";
import Background from "./components/Background";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ConvertPage from "./pages/ConvertPage";
import AIBuilderPage from "./pages/AIBuilderPage";
import AIWebsiteBuilderPage from "./pages/AIWebsiteBuilderPage";
import SuccessModal from "./components/SuccessModal";

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [page, setPage] = useState("home");
  const [showSuccess, setShowSuccess] = useState(false);
  useCursor(); // registers event listeners only; no React state

  const theme = getTheme(darkMode);

  // Inject global styles
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "ew-global";
    el.textContent = globalStyles(theme);
    document.head.appendChild(el);
    return () => el.remove();
  }, [darkMode]);

  const navigate = useCallback((target) => {
    if (target === "convert") {
      setPage("convert");
      window.scrollTo(0, 0);
    } else if (target === "ai-builder") {
      setPage("ai-builder");
      window.scrollTo(0, 0);
    } else if (target === "ai-website-builder") {
      setPage("ai-website-builder");
      window.scrollTo(0, 0);
    } else if (target === "home") {
      setPage("home");
      window.scrollTo(0, 0);
    } else {
      // Scroll to section on home page
      setPage("home");
      setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh", position: "relative" }}>
      <Cursor theme={theme} />
      <Background theme={theme} />

      {page !== "ai-builder" && page !== "ai-website-builder" && (
        <Navbar
          theme={theme}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onNavigate={navigate}
        />
      )}

      {page === "home" && (
        <HomePage theme={theme} onNavigate={navigate} />
      )}
      {page === "convert" && (
        <ConvertPage
          theme={theme}
          onBack={() => navigate("home")}
          onSuccess={() => { setShowSuccess(true); }}
        />
      )}
      {page === "ai-builder" && (
        <AIBuilderPage
          theme={theme}
          onBack={() => navigate("home")}
        />
      )}
      {page === "ai-website-builder" && (
        <AIWebsiteBuilderPage
          theme={theme}
          onBack={() => navigate("home")}
        />
      )}

      {showSuccess && (
        <SuccessModal
          theme={theme}
          onClose={() => { setShowSuccess(false); navigate("home"); }}
        />
      )}
    </div>
  );
}
