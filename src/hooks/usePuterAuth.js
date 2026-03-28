import { useState, useEffect, useCallback } from "react";

/**
 * usePuterAuth — thin wrapper around window.puter.auth
 * Puter.js must be loaded via <script src="https://js.puter.com/v2/"> in index.html.
 *
 * Returns:
 *   puterUser    — { username, ... } or null when not signed in
 *   puterLoading — true while checking auth status on mount
 *   signIn       — call to open Puter sign-in dialog
 *   signOut      — call to sign out
 */
export function usePuterAuth() {
  const [puterUser,    setPuterUser]    = useState(null);
  const [puterLoading, setPuterLoading] = useState(true);

  const getPuter = () => window.puter;

  // Check whether already signed in on mount
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const p = getPuter();
        if (!p) { setPuterLoading(false); return; }
        const signedIn = await p.auth.isSignedIn();
        if (!signedIn) { setPuterLoading(false); return; }
        const user = await p.auth.getUser();
        if (!cancelled) setPuterUser(user);
      } catch (_) {
        // puter.js not loaded yet — silently ignore
      } finally {
        if (!cancelled) setPuterLoading(false);
      }
    };
    // Wait a tick for puter.js script to initialise
    const timer = setTimeout(check, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const signIn = useCallback(async () => {
    try {
      const p = getPuter();
      if (!p) return;
      await p.auth.signIn();
      const user = await p.auth.getUser();
      setPuterUser(user);
    } catch (e) {
      console.error("Puter sign-in failed:", e);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const p = getPuter();
      if (!p) return;
      await p.auth.signOut();
      setPuterUser(null);
    } catch (e) {
      console.error("Puter sign-out failed:", e);
    }
  }, []);

  return { puterUser, puterLoading, signIn, signOut };
}
