"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

const AVATARS = ["flower", "smiley", "heart", "sun", "cloud", "star"];
const avatarEmoji = { flower: "🌸", smiley: "😊", heart: "💗", sun: "🌞", cloud: "☁️", star: "⭐" };

export default function ProfileSetup() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("flower");
  const [avatarFile, setAvatarFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/login");
        return;
      }
      setUser(auth.user);
      const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url, avatar_seed").eq("id", auth.user.id).maybeSingle();
      setFullName(profile?.full_name || auth.user.user_metadata?.full_name || "");
      setAvatarSeed(profile?.avatar_seed || "flower");
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave(e) {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) {
      setMessage("Please add your name first.");
      return;
    }
    setSaving(true);
    setMessage("");
    let avatarUrl = null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (uploadError) {
        setMessage(uploadError.message);
        setSaving(false);
        return;
      }
      avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: trimmed,
      avatar_url: avatarUrl,
      avatar_seed: avatarFile ? "" : avatarSeed,
    }, { onConflict: "id" });
    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }
    await supabase.auth.updateUser({ data: { full_name: trimmed } });
    router.replace("/");
  }

  if (loading) return null;

  return (
    <main className="setup-page">
      <form onSubmit={handleSave} className="setup-card">
        <div className="wordmark">thredori</div>
        <p className="eyebrow">ONE LITTLE STEP</p>
        <h1>Make your profile yours</h1>
        <p className="intro">Tell us what you'd like people to call you, then pick a little picture.</p>
        <label>Your name<input type="text" required autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" /></label>
        <div className="avatar-section">
          <span className="avatar-label">Profile picture</span>
          <div className="avatar-row">
            <div className="avatar-preview">{avatarFile ? <img src={URL.createObjectURL(avatarFile)} alt="" /> : avatarEmoji[avatarSeed]}</div>
            <div className="avatar-options">
              <div className="choices">{AVATARS.map((key) => <button type="button" key={key} className={avatarSeed === key && !avatarFile ? "choice active" : "choice"} onClick={() => { setAvatarSeed(key); setAvatarFile(null); }} aria-label={`Choose ${key} avatar`}>{avatarEmoji[key]}</button>)}</div>
              <label className="upload">Upload your photo<input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} /></label>
            </div>
          </div>
        </div>
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Continue to Thredori"}</button>
        {message && <p className="message">{message}</p>}
      </form>
      <style jsx>{`
        .setup-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:30px 16px; background:var(--blush); }
        .setup-card { background:rgba(255,253,252,.96); border:1px solid var(--cotton-line); border-radius:22px; padding:30px; width:100%; max-width:390px; display:flex; flex-direction:column; gap:12px; box-shadow:var(--shadow-soft); }
        .wordmark { font:italic 20px var(--font-voice); text-align:center; color:var(--ink); }
        .eyebrow { margin:5px 0 -5px; text-align:center; font:700 10px var(--font-sans); letter-spacing:.14em; color:var(--madder); }
        h1 { font:600 24px var(--font-voice); text-align:center; margin:0; color:var(--ink); }
        .intro { margin:-2px 0 8px; text-align:center; font:12px/1.5 var(--font-sans); color:var(--muted); }
        label, .avatar-label { font:600 12px var(--font-sans); color:var(--muted); display:flex; flex-direction:column; gap:6px; }
        input { padding:10px 12px; border-radius:12px; border:1px solid var(--cotton-line); background:#fff; font:13px var(--font-sans); color:var(--ink); }
        .avatar-section { padding:12px; border:1px solid var(--cotton-line); border-radius:16px; background:var(--blush-soft); }
        .avatar-row { display:flex; gap:12px; align-items:center; margin-top:8px; }
        .avatar-preview { width:64px; height:64px; flex:0 0 64px; display:grid; place-items:center; border-radius:50%; background:#fff; border:1px solid var(--cotton-line); font-size:31px; overflow:hidden; }
        .avatar-preview img { width:100%; height:100%; object-fit:cover; }
        .avatar-options { flex:1; min-width:0; }
        .choices { display:flex; gap:5px; flex-wrap:wrap; }
        .choice { width:29px; height:29px; border-radius:50%; border:1px solid transparent; background:#fff; font-size:15px; padding:0; cursor:pointer; }
        .choice.active { border-color:var(--madder); box-shadow:0 0 0 2px rgba(199,122,125,.15); }
        .upload { margin-top:7px; display:block; font:11px var(--font-sans); color:var(--indigo); cursor:pointer; }
        .upload input { display:none; }
        form > button { margin-top:5px; background:var(--indigo); color:var(--indigo-text); border:0; border-radius:20px; padding:10px; font:600 13px var(--font-sans); cursor:pointer; }
        button:disabled { opacity:.6; cursor:default; }
        .message { font:12px var(--font-sans); color:var(--madder); text-align:center; margin:0; }
      `}</style>
    </main>
  );
}
