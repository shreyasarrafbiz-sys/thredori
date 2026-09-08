"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function ensureProfile(user) {
    const fullName = user.user_metadata?.full_name || "";
    await supabase.from("profiles").upsert({ id: user.id, full_name: fullName, avatar_seed: "flower" }, { onConflict: "id", ignoreDuplicates: true });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
    } else if (data.user) {
      await ensureProfile(data.user);
      router.push("/");
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/profile/setup` },
    });
    if (error) setMessage(error.message);
  }

  return (
    <main className="auth-page">
      <form onSubmit={handleLogin} className="auth-card">
        <div className="wordmark">thredori</div>
        <h1>Log in</h1>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
        {message && <p className="message">{message}</p>}
        <div className="divider"><span>or</span></div>
        <button type="button" className="google-btn" onClick={handleGoogleLogin}>Continue with Google</button>
        <p className="switch">No account yet? <a href="/signup">Sign up</a></p>
      </form>
      <style jsx>{`
        .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:30px 16px; background:var(--blush); }
        .auth-card { background:rgba(255,253,252,.96); border:1px solid var(--cotton-line); border-radius:22px; padding:30px; width:100%; max-width:360px; display:flex; flex-direction:column; gap:12px; box-shadow:var(--shadow-soft); }
        .wordmark { font:italic 20px var(--font-voice); text-align:center; }
        h1 { font:600 22px var(--font-voice); text-align:center; margin:0 0 6px; }
        label { font:600 12px var(--font-sans); color:var(--muted); display:flex; flex-direction:column; gap:6px; }
        input { padding:10px 12px; border-radius:12px; border:1px solid var(--cotton-line); background:#fff; font:13px var(--font-sans); color:var(--ink); }
        form > button:not(.google-btn) { margin-top:5px; background:var(--indigo); color:var(--indigo-text); border:0; border-radius:20px; padding:10px; font:600 13px var(--font-sans); }
        button:disabled { opacity:.6; }
        .message { font:12px var(--font-sans); color:var(--madder); text-align:center; margin:0; }
        .divider { display:flex; align-items:center; gap:10px; color:var(--muted); font:11px var(--font-sans); }
        .divider:before,.divider:after { content:""; flex:1; height:1px; background:var(--cotton-line); }
        .google-btn { background:#fff; color:var(--ink); border:1px solid var(--cotton-line); border-radius:20px; padding:10px; font:600 13px var(--font-sans); }
        .switch { font:12px var(--font-sans); color:var(--muted); text-align:center; margin:3px 0 0; }
        .switch a { color:var(--indigo); font-weight:600; }
      `}</style>
    </main>
  );
}
