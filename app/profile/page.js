"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import ProfileFilterIcon from "../../components/ProfileFilterIcon";

const avatarEmoji = { flower: "🌸", smiley: "😊", heart: "💗", sun: "🌞", cloud: "☁️", star: "⭐" };

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState("all");
  const [myPosts, setMyPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
      if (!data.user) {
        router.push("/login");
        return;
      }
      const { data: profileData } = await supabase.from("profiles").select("full_name, avatar_url, avatar_seed").eq("id", data.user.id).maybeSingle();
      setProfile(profileData);
    });
  }, [router]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const { data: mine } = await supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setMyPosts(mine || []);
      const { data: saved } = await supabase.from("saved_posts").select("post_id, posts(*)").eq("user_id", user.id).order("created_at", { ascending: false });
      setSavedPosts((saved || []).map((s) => s.posts).filter(Boolean));
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleDelete(postId) {
    if (!confirm("Delete this post? This can't be undone.")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (!error) {
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));
      setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  }

  async function handleUnsave(postId) {
    await supabase.from("saved_posts").delete().eq("user_id", user.id).eq("post_id", postId);
    setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  if (checkingAuth || !user) return null;

  const savedIds = new Set(savedPosts.map((post) => post.id));
  const allPosts = Array.from(new Map([...myPosts, ...savedPosts].map((post) => [post.id, post])).values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const list = tab === "posts" ? myPosts : tab === "saved" ? savedPosts : allPosts;
  const filters = [
    { id: "all", label: "All", count: allPosts.length },
    { id: "posts", label: "Posted", count: myPosts.length },
    { id: "saved", label: "Saved", count: savedPosts.length },
  ];
  const displayName = profile?.full_name?.trim() || user.user_metadata?.full_name?.trim() || "Your profile";
  const avatar = profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : (avatarEmoji[profile?.avatar_seed] || "🌸");

  return (
    <main className="page">
      <div className="profile-topbar container">
        <Link href="/" className="wordmark page-rise">thredori</Link>
        <div className="identity page-rise">
          <div className="top-avatar">{avatar}</div>
          <span>{displayName}</span>
        </div>
      </div>

      <div className="profile-header container">
        <div className="profile-title-wrap">
          <div className="large-avatar page-rise">{avatar}</div>
          <div>
            <p className="eyebrow page-rise">YOUR SPACE</p>
            <h1 className="page-rise">{displayName}</h1>
          </div>
        </div>
        <div className="filter-bar page-rise" aria-label="Profile content filters">
          {filters.map((filter) => (
            <button key={filter.id} className={`filter ${tab === filter.id ? "filter-active" : ""}`} onClick={() => setTab(filter.id)} aria-pressed={tab === filter.id}>
              <ProfileFilterIcon type={filter.id} />
              <span>{filter.label}</span>
              <span className="count">{filter.count}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="status container">Loading...</p> : list.length === 0 ? <p className="status container">{tab === "all" ? "Nothing here yet. Save something lovely or make your first post." : tab === "posts" ? "You haven't posted anything yet." : "Nothing saved yet."}</p> : (
        <div className="grid container">
          {list.map((post, index) => {
            const isMine = post.user_id === user.id;
            const isSaved = savedIds.has(post.id);
            return (
              <div key={post.id} className="card page-rise" style={{ "--delay": `${Math.min(index * 45, 360)}ms` }}>
                <Link href={`/post/${post.id}`} className="card-image-link"><div className="card-image" style={{ backgroundImage: post.image_url ? `url(${post.image_url})` : undefined, backgroundColor: post.image_url ? undefined : "#c7a9a6" }} /></Link>
                <div className="card-body">
                  <div className="card-name">{post.brand_name}</div>
                  <div className="card-note">{post.note}</div>
                  <div className="card-actions">
                    {isMine && <button className="delete-btn" onClick={() => handleDelete(post.id)}>Delete</button>}
                    {isSaved && <button className="save-btn" onClick={() => handleUnsave(post.id)}>Unsave</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .page { min-height:100vh; background:var(--blush); }
        .container { width:min(1100px, calc(100% - 40px)); margin-left:auto; margin-right:auto; }
        .profile-topbar { display:flex; align-items:center; justify-content:space-between; padding:16px 0; border-bottom:1px solid var(--cotton-line); }
        .wordmark { font-family:var(--font-voice); font-style:italic; font-size:20px; line-height:1; letter-spacing:-.02em; color:var(--ink); white-space:nowrap; }
        .identity { display:flex; align-items:center; gap:8px; font:600 13px var(--font-sans); color:var(--ink); }
        .top-avatar { width:30px; height:30px; display:grid; place-items:center; overflow:hidden; border-radius:50%; background:#fff; border:1px solid var(--cotton-line); font-size:17px; }
        .top-avatar img, .large-avatar img { width:100%; height:100%; object-fit:cover; }
        .profile-header { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; padding:28px 0 18px; }
        .profile-title-wrap { display:flex; align-items:center; gap:13px; }
        .large-avatar { width:54px; height:54px; display:grid; place-items:center; overflow:hidden; flex:0 0 54px; border-radius:50%; background:#fff; border:1px solid var(--cotton-line); box-shadow:var(--shadow-soft); font-size:27px; }
        .eyebrow { margin:0 0 5px; font:700 10px var(--font-sans); letter-spacing:.14em; color:var(--madder); }
        h1 { font:600 28px/1.1 var(--font-voice); margin:0; color:var(--ink); }
        .filter-bar { display:flex; align-items:center; gap:7px; padding:5px; border:1px solid var(--cotton-line); border-radius:24px; background:rgba(255,253,252,.82); box-shadow:var(--shadow-soft); }
        .filter { display:inline-flex; align-items:center; gap:7px; border:0; border-radius:19px; padding:8px 12px; background:transparent; color:var(--muted); font:600 12px var(--font-sans); cursor:pointer; transition:transform 180ms ease, background 180ms ease, color 180ms ease, box-shadow 180ms ease; }
        .filter:hover { transform:translateY(-1px); color:var(--ink); }
        .filter-active { background:var(--indigo); color:var(--indigo-text); box-shadow:0 6px 14px rgba(43,58,85,.16); }
        .count { opacity:.68; font-size:10px; }
        .filter-active .count { opacity:.82; }
        .status { padding:30px 0 50px; color:var(--muted); font:13px var(--font-sans); }
        .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:14px; padding-bottom:50px; }
        .card { background:var(--cotton); border:1px solid rgba(234,216,213,.72); border-radius:14px; overflow:hidden; box-shadow:var(--shadow-soft); animation-delay:var(--delay); transition:transform 220ms ease, box-shadow 220ms ease; }
        .card:hover { transform:translateY(-4px); box-shadow:var(--shadow-lift); }
        .card-image-link { display:block; }
        .card-image { height:170px; background-size:cover; background-position:center; }
        .card-body { padding:11px 12px 12px; }
        .card-name { font:15px var(--font-voice); color:var(--ink); }
        .card-note { font:11px/1.4 var(--font-sans); color:var(--muted); margin:3px 0 9px; }
        .card-actions { display:flex; gap:6px; }
        .delete-btn,.save-btn { font:11px var(--font-sans); background:rgba(255,255,255,.7); border-radius:16px; padding:5px 11px; cursor:pointer; transition:transform 180ms ease, background 180ms ease; }
        .delete-btn { color:var(--madder); border:1px solid var(--madder); }
        .save-btn { color:var(--ink); border:1px solid var(--cotton-line); }
        .delete-btn:hover,.save-btn:hover { transform:translateY(-1px); background:#fff; }
        @media (max-width:700px) { .profile-header { align-items:flex-start; flex-direction:column; } .filter-bar { width:100%; justify-content:space-between; } .filter { flex:1; justify-content:center; padding-left:8px; padding-right:8px; } }
        @media (prefers-reduced-motion:reduce) { .filter,.card,.delete-btn,.save-btn { transition:none; } .card { animation:none; } }
      `}</style>
    </main>
  );
}
