import React, { useState } from "react";
import { signIn, signUp } from "../lib/auth";

export default function AuthPage({ theme, onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = isSignup
        ? await signUp(email.trim(), password, name.trim())
        : await signIn(email.trim(), password);

      if (result.error) {
        setError(result.error.message || "Authentication failed.");
        return;
      }
      onAuthSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 420,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: "1.5rem",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>
          {isSignup ? "Create Account" : "Welcome Back"}
        </h1>
        <p style={{ color: theme.muted, margin: "0.5rem 0 1.2rem" }}>
          {isSignup ? "Sign up to start building." : "Login to access your dashboard."}
        </p>

        {isSignup && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            style={inputStyle(theme)}
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={inputStyle(theme)}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          style={inputStyle(theme)}
        />

        {isSignup && (
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
            style={inputStyle(theme)}
          />
        )}

        {error && (
          <p style={{ color: "#ef4444", margin: "0.25rem 0 0.75rem", fontSize: "0.9rem" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 10,
            padding: "0.75rem 1rem",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            background: theme.accentBtnBg,
            color: theme.accentBtnText,
          }}
        >
          {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(isSignup ? "login" : "signup");
            setError("");
          }}
          style={{
            width: "100%",
            marginTop: "0.75rem",
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            padding: "0.7rem 1rem",
            cursor: "pointer",
            background: "transparent",
            color: theme.text,
          }}
        >
          {isSignup ? "Already have an account? Login" : "New here? Create account"}
        </button>
      </form>
    </div>
  );
}

function inputStyle(theme) {
  return {
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "0.75rem",
    padding: "0.7rem 0.8rem",
    borderRadius: 10,
    border: `1px solid ${theme.border}`,
    background: theme.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    color: theme.text,
    outline: "none",
  };
}
