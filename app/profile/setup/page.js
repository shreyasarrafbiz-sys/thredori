"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

const AVATARS = ["flower", "smiley", "heart", "sun", "cloud", "star"];
const avatarEmoji = { flower: "🌸", smiley: "😊", heart: "💗", sun: "🌞", cloud: "☁️", star: "⭐" };

export default function ProfileSetup() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("flower");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const localPreview = useMemo(() => avatarFile ? URL.createObjectURL(avatarFile) : null, [avatarFile]);

  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview); }, [localPreview]);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace("/login"); return; }
      setUser(auth.user);
      const { data: profile, error } = await supabase.from("profiles").select("full_name, username, description, avatar_url, avatar_seed").eq("id", auth.user.id).maybeSingle();
      if (error) { setMessage(error.message); setLoading(false); return; }
      setFullName(profile?.full_name || auth.user.user_metadata?.full_name || "");
      setUsername(profile?.username || "");
      setDescription(profile?.description || "");
      setAvatarSeed(profile?.avatar_seed || "flower");
      setAvatarUrl(profile?.avatar_url || null);
      setLoading(false);
    }
    load();
  }, [router]);

  function cleanUsername(value) { return value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24); }

  function chooseDefault(key) { setAvatarSeed(key); setAvatarFile(null); setAvatarUrl(null); }

  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;
    const trimmed = fullName.trim();
    const clean = cleanUsername(username);
    const trimmedDescription = description.trim();
    if (!trimmed) { setMessage("Please add your name first."); return; }
    if (clean.length < 3) { setMessage("Your username needs at least 3 letters or numbers."); return; }
    if (trimmedDescription.length > 180) { setMessage("Keep your description under 180 characters."); return; }
    setSaving(true); setMessage("");

    const { data: existing, error: lookupError } = await supabase.from("profiles").select("id").ilike("username", clean).neq("id", user.id).limit(1);
    if (lookupError) { setMessage(`Couldn't check username: ${lookupError.message}`); setSaving(false); return; }
    if (existing?.length) { setMessage("That username is already taken. Try another one."); setSaving(false); return; }

    let nextAvatarUrl = avatarUrl;
    let nextAvatarSeed = avatarSeed;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: false, contentType: avatarFile.type });
      if (uploadError) { setMessage(`Profile picture upload failed: ${uploadError.message}`); setSaving(false); return; }
      nextAvatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      nextAvatarSeed = "";
    }

    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: trimmed, username: clean, description: trimmedDescription, avatar_url: nextAvatarUrl, avatar_seed: nextAvatarSeed }, { onConflict: "id" });
    if (error) {
      setMessage(error.code === "23505" ? "That username was just taken. Please choose another one." : `Couldn't save profile: ${error.message}`);
      setSaving(false); return;
    }
    const { error: authError } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
    if (authError) { setMessage(`Profile saved, but account name sync failed: ${authError.message}`); setSaving(false); return; }
    router.replace("/profile");
    router.refresh();
  }

  if (loading) return null;

  return (
    <main className="setup-page">
      <form onSubmit={handleSave} className="setup-card">
        <div className="wordmark">thredori</div>
        <p className="eyebrow">YOUR PROFILE</p>
        <h1>Edit your profile</h1>
        <p className="intro">Change your name, username, little picture, and the words that introduce you.</p>
        <label>Full name<input type="text" required autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" /></label>
        <label>Username<div className="username-input"><span>@</span><input type="text" required value={username} onChange={(e) => setUsername(cleanUsername(e.target.value))} placeholder="yourname" /></div><small>Letters, numbers and underscores only.</small></label>
        <label>About you<textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={180} placeholder="A little about you..." rows={3} /><small className="counter">{description.length}/180</small></label>
        <div className="avatar-section">
          <span className="avatar-label">Profile picture</span>
          <div className="avatar-row">
            <div className="avatar-preview">{localPreview ? <img src={localPreview} alt="Preview" /> : avatarUrl ? <img src={avatarUrl} alt="Current profile" /> : avatarEmoji[avatarSeed]}</div>
            <div className="avatar-options">
              <div className="choices">{AVATARS.map((key) => <button type="button" key={key} className={avatarSeed === key && !avatarFile && !avatarUrl ? "choice active" : "choice"} onClick={() => chooseDefault(key)} aria-label={`Choose ${key} avatar`}>{avatarEmoji[key]}</button>)}</div>
              <label className="upload">Upload your photo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} /></label>
              {(avatarUrl || avatarFile) && <button type="button" className="remove-photo" onClick={() => { setAvatarFile(null); setAvatarUrl(null); setAvatarSeed("flower"); }}>Use a cute default instead</button>}
            </div>
          </div>
        </div>
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
        <button type="button" className="cancel" onClick={() => router.push("/profile")} disabled={saving}>Cancel</button>
        {message && <p className="message">{message}</p>}
      </form>
      <style jsx>{`
        .setup-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:30px 16px;background:var(--blush)}
        .setup-card{background:rgba(255,253,252,.96);border:1px solid var(--cotton-line);border-radius:22px;padding:30px;width:100%;max-width:390px;display:flex;flex-direction:column;gap:12px;box-shadow:var(--shadow-soft)}
        .wordmark{font:italic 20px var(--font-voice);text-align:center;color:var(--ink)}.eyebrow{margin:5px 0 -5px;text-align:center;font:700 10px var(--font-sans);letter-spacing:.14em;color:var(--madder)}h1{font:600 24px var(--font-voice);text-align:center;margin:0;color:var(--ink)}.intro{margin:-2px 0 8px;text-align:center;font:12px/1.5 var(--font-sans);color:var(--muted)}
        label,.avatar-label{font:600 12px var(--font-sans);color:var(--muted);display:flex;flex-direction:column;gap:6px}input,textarea{padding:10px 12px;border-radius:12px;border:1px solid var(--cotton-line);background:#fff;font:13px var(--font-sans);color:var(--ink);resize:vertical}.username-input{display:flex;align-items:center;border:1px solid var(--cotton-line);border-radius:12px;background:#fff;overflow:hidden}.username-input span{padding-left:12px;color:var(--muted);font:13px var(--font-sans)}.username-input input{border:0;border-radius:0;flex:1;outline:0}label small{font:10px var(--font-sans);color:var(--muted);font-weight:400}.counter{align-self:flex-end;margin-top:-2px}
        .avatar-section{padding:12px;border:1px solid var(--cotton-line);border-radius:16px;background:var(--blush-soft)}.avatar-row{display:flex;gap:12px;align-items:center;margin-top:8px}.avatar-preview{width:64px;height:64px;flex:0 0 64px;display:grid;place-items:center;border-radius:50%;background:#fff;border:1px solid var(--cotton-line);font-size:31px;overflow:hidden}.avatar-preview img{width:100%;height:100%;object-fit:cover}.avatar-options{flex:1;min-width:0}.choices{display:flex;gap:5px;flex-wrap:wrap}.choice{width:29px;height:29px;border-radius:50%;border:1px solid transparent;background:#fff;font-size:15px;padding:0;cursor:pointer}.choice.active{border-color:var(--madder);box-shadow:0 0 0 2px rgba(199,122,125,.15)}.upload{margin-top:7px;display:block;font:11px var(--font-sans);color:var(--indigo);cursor:pointer}.upload input{display:none}.remove-photo{margin-top:7px;padding:0;border:0;background:transparent;color:var(--muted);font:10px var(--font-sans);cursor:pointer}
        form>button{margin-top:5px;background:var(--indigo);color:var(--indigo-text);border:0;border-radius:20px;padding:10px;font:600 13px var(--font-sans);cursor:pointer}form>.cancel{margin-top:0;background:transparent;color:var(--muted);border:1px solid var(--cotton-line)}button:disabled{opacity:.6;cursor:default}.message{font:12px var(--font-sans);color:var(--madder);text-align:center;margin:0}
      `}</style>
    </main>
  );
}
