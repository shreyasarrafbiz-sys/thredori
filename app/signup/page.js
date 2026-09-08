"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const AVATARS = ["flower", "smiley", "heart", "sun", "cloud", "star"];
const avatarEmoji = { flower: "🌸", smiley: "😊", heart: "💗", sun: "🌞", cloud: "☁️", star: "⭐" };

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("flower");
  const [avatarFile, setAvatarFile] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function createProfile(user) {
    let avatarUrl = null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (!error) avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }
    await supabase.from("profiles").upsert({ id: user.id, full_name: fullName.trim(), avatar_url: avatarUrl, avatar_seed: avatarSeed }, { onConflict: "id" });
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName.trim() } } });
    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }
    if (data.user && data.session) {
      await createProfile(data.user);
      router.push("/");
    } else {
      setMessage("Check your email to confirm your account, then log in. Your profile details will be ready when you return.");
    }
    setLoading(false);
  }

  async function handleGoogleSignUp() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/profile/setup` } });
  }

  return (
    <main className="auth-page">
      <form onSubmit={handleSignUp} className="auth-card">
        <div className="wordmark">thredori</div>
        <h1>Create your account</h1>
        <p className="intro">Make your little corner of Thredori feel like yours.</p>
        <label>Full name<input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" /></label>
        <div className="avatar-section">
          <span className="avatar-label">Profile picture</span>
          <div className="avatar-row">
            <div className="avatar-preview">{avatarFile ? <img src={URL.createObjectURL(avatarFile)} alt="" /> : avatarEmoji[avatarSeed]}</div>
            <div className="avatar-options">
              <div className="choices">{AVATARS.map((key) => <button type="button" key={key} className={avatarSeed === key && !avatarFile ? "choice active" : "choice"} onClick={() => { setAvatarSeed(key); setAvatarFile(null); }}>{avatarEmoji[key]}</button>)}</div>
              <label className="upload">Upload your photo<input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} /></label>
            </div>
          </div>
        </div>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button type="submit" disabled={loading}>{loading ? "Creating account..." : "Sign up"}</button>
        {message && <p className="message">{message}</p>}
        <div className="divider"><span>or</span></div>
        <button type="button" className="google-btn" onClick={handleGoogleSignUp}>Continue with Google</button>
        <p className="switch">Already have an account? <a href="/login">Log in</a></p>
      </form>
      <style jsx>{`
        .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:30px 16px; background:var(--blush); }
        .auth-card { background:rgba(255,253,252,.96); border:1px solid var(--cotton-line); border-radius:22px; padding:30px; width:100%; max-width:390px; display:flex; flex-direction:column; gap:12px; box-shadow:var(--shadow-soft); }
        .wordmark { font:italic 20px var(--font-voice); text-align:center; }
        h1 { font:600 22px var(--font-voice); text-align:center; margin:0; color:var(--ink); }
        .intro { margin:-3px 0 7px; text-align:center; font:12px var(--font-sans); color:var(--muted); }
        label, .avatar-label { font:600 12px var(--font-sans); color:var(--muted); display:flex; flex-direction:column; gap:6px; }
        input { padding:10px 12px; border-radius:12px; border:1px solid var(--cotton-line); background:#fff; font:13px var(--font-sans); color:var(--ink); }
        .avatar-section { padding:12px; border:1px solid var(--cotton-line); border-radius:16px; background:var(--blush-soft); }
        .avatar-row { display:flex; gap:12px; align-items:center; margin-top:8px; }
        .avatar-preview { width:64px; height:64px; flex:0 0 64px; display:grid; place-items:center; border-radius:50%; background:#fff; border:1px solid var(--cotton-line); font-size:31px; overflow:hidden; }
        .avatar-preview img { width:100%; height:100%; object-fit:cover; }
        .avatar-options { flex:1; min-width:0; }
        .choices { display:flex; gap:5px; flex-wrap:wrap; }
        .choice { width:29px; height:29px; border-radius:50%; border:1px solid transparent; background:#fff; font-size:15px; padding:0; }
        .choice.active { border-color:var(--madder); box-shadow:0 0 0 2px rgba(199,122,125,.15); }
        .upload { margin-top:7px; display:block; font:11px var(--font-sans); color:var(--indigo); cursor:pointer; }
        .upload input { display:none; }
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
