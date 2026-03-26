import { supabase } from "./client";

// ── SIGN UP ────────────────────────────────────────────────────────────────
/**
 * Register a new user with email + password.
 * Supabase sends a confirmation email automatically.
 */
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) throw error;
  return data;
}

// ── SIGN IN ────────────────────────────────────────────────────────────────
/**
 * Sign in an existing user with email + password.
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// ── SIGN IN WITH GOOGLE ────────────────────────────────────────────────────
/**
 * OAuth sign-in via Google. Redirects to /dashboard on success.
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) throw error;
  return data;
}

// ── SIGN OUT ───────────────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── GET SESSION ────────────────────────────────────────────────────────────
/**
 * Returns the current session or null if not logged in.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ── GET USER ───────────────────────────────────────────────────────────────
/**
 * Returns the currently authenticated user or null.
 */
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

// ── RESET PASSWORD ─────────────────────────────────────────────────────────
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

// ── AUTH STATE LISTENER ────────────────────────────────────────────────────
/**
 * Subscribe to auth changes (login/logout).
 * Returns the unsubscribe function — call it on cleanup.
 *
 * Usage:
 *   const unsubscribe = onAuthChange((session) => setUser(session?.user));
 *   return () => unsubscribe();
 */
export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => callback(session)
  );
  return () => subscription.unsubscribe();
}