import React, { useState, useCallback, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { getTheme } from "./constants/theme";
import { globalStyles } from "./styles/global";
import AppleCursor from "./components/AppleCursor";
import Background from "./components/Background";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ConvertPage from "./pages/ConvertPage";
import AIWebsiteBuilderPage from "./pages/AIWebsiteBuilderPage";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import SuccessModal from "./components/SuccessModal";
import { getSession, onAuthStateChange, logActivity } from "./lib/auth";
import ShimmerText from "./components/ui/shimmer-text";
import IntroPage from "./pages/IntroPage";

const ROUTE_BY_TARGET = {
  auth: "/",
  home: "/home",
  dashboard: "/dashboard",
  convert: "/convert",
  "ai-website-builder": "/ai-website-builder",
};

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode] = useState(true);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Show intro only on root path. If they refresh on /dashboard, they skip it.
  const [showIntro, setShowIntro] = useState(() => location.pathname === "/");

  const theme = getTheme(darkMode);
  const pageKind = (() => {
    if (location.pathname === "/dashboard") return "dashboard";
    if (location.pathname === "/ai-website-builder") return "ai-website-builder";
    return "default";
  })();

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getSession(),
      new Promise(resolve => setTimeout(resolve, 2000))
    ]).then(([{ session: activeSession }]) => {
      if (!mounted) return;
      setSession(activeSession);
      setAuthLoading(false);
    });

    const sub = onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      sub?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const el = document.createElement("style");
    el.id = "ew-global";
    el.textContent = globalStyles(theme);
    document.head.appendChild(el);

    if (theme.dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    return () => el.remove();
  }, [theme]);

  useEffect(() => {
    if (authLoading || showIntro) return;

    if (!session && location.pathname !== "/") {
      navigate("/", { replace: true });
      return;
    }
    if (session && location.pathname === "/") {
      navigate("/home", { replace: true });
    }
  }, [authLoading, session, location.pathname, navigate, showIntro]);

  const onNavigate = useCallback((target) => {
    const directRoute = ROUTE_BY_TARGET[target];
    if (directRoute) {
      navigate(directRoute);
      window.scrollTo(0, 0);
      if (session) {
        logActivity("Navigation", { target, route: directRoute }).catch(() => { });
      }
      return;
    }

    navigate("/home");
    setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [navigate, session]);

  const handleEnterIntro = () => {
    setShowIntro(false);
    // Let the useEffect navigation handle the next steps based on session.
  };

  if (showIntro) {
    return (
      <>
        <AppleCursor />
        <IntroPage onEnter={handleEnterIntro} />
      </>
    );
  }

  if (authLoading) {
    return (
      <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <ShimmerText className="text-4xl font-bold tracking-tight">Introducing EasyWay</ShimmerText>
      </div>
    );
  }

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh", position: "relative" }}>
      <AppleCursor />
      <Background theme={theme} />

      {location.pathname !== "/" && (
        <Navbar
          theme={theme}
          onNavigate={onNavigate}
          pageKind={pageKind}
        />
      )}

      <Routes>
        <Route path="/" element={<AuthPage theme={theme} onAuthSuccess={() => onNavigate("home")} />} />
        <Route path="/home" element={<HomePage theme={theme} onNavigate={onNavigate} />} />
        <Route path="/convert" element={<ConvertPage theme={theme} onBack={() => onNavigate("home")} onSuccess={() => setShowSuccess(true)} />} />
        <Route path="/ai-website-builder" element={<AIWebsiteBuilderPage theme={theme} onBack={() => onNavigate("home")} />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute session={session}>
              <Dashboard theme={theme} onNavigate={onNavigate} />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to={session ? "/home" : "/"} replace />} />
      </Routes>

      {showSuccess && (
        <SuccessModal
          theme={theme}
          onClose={() => {
            setShowSuccess(false);
            onNavigate("home");
          }}
        />
      )}
    </div>
  );
}
