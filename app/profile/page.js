"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState("posts");
  const [myPosts, setMyPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
      if (!data.user) router.push("/login");
    });
  }, [router]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);

      const { data: mine } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMyPosts(mine || []);

      const { data: saved } = await supabase
        .from("saved_posts")
        .select("post_id, posts(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
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
    }
  }

  async function handleUnsave(postId) {
    await supabase
      .from("saved_posts")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  if (checkingAuth || !user) return null;

  const list = tab === "posts" ? myPosts : savedPosts;

  return (
    <main className="page">
      <div className="topbar container">
        <Link href="/" className="wordmark">
          thredori
        </Link>
        <span className="email">{user.email}</span>
      </div>

      <div className="header container">
        <h1>Your profile</h1>
        <div className="tabs">
          <button
            className={tab === "posts" ? "tab active" : "tab"}
            onClick={() => setTab("posts")}
          >
            My posts ({myPosts.length})
          </button>
          <button
            className={tab === "saved" ? "tab active" : "tab"}
            onClick={() => setTab("saved")}
          >
            Saved ({savedPosts.length})
          </button>
        </div>
      </div>

      {loading ? (
        <p className="status container">Loading...</p>
      ) : list.length === 0 ? (
        <p className="status container">
          {tab === "posts" ? "You haven't posted anything yet." : "Nothing saved yet."}
        </p>
      ) : (
        <div className="grid container">
          {list.map((post) => (
            <div key={post.id} className="card">
              <Link href={`/post/${post.id}`} className="card-image-link">
                <div
                  className="card-image"
                  style={{
                    backgroundImage: post.image_url ? `url(${post.image_url})` : undefined,
                    backgroundColor: post.image_url ? undefined : "#8A7F6B",
                  }}
                />
              </Link>
              <div className="card-body">
                <div className="card-name">{post.brand_name}</div>
                <div className="card-note">{post.note}</div>
                {tab === "posts" ? (
                  <button className="delete-btn" onClick={() => handleDelete(post.id)}>
                    Delete
                  </button>
                ) : (
                  <button className="delete-btn" onClick={() => handleUnsave(post.id)}>
                    Unsave
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: var(--cotton);
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--cotton-line);
        }
        .wordmark {
          font-family: var(--font-voice);
          font-style: italic;
          font-size: 19px;
          color: var(--ink);
        }
        .email {
          font-size: 13px;
          color: var(--muted);
        }
        .header {
          padding: 20px 20px 0;
        }
        h1 {
          font-family: var(--font-voice);
          font-size: 22px;
          margin: 0 0 14px;
        }
        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }
        .tab {
          background: #fff;
          color: #6b5f4e;
          font-size: 13px;
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid var(--cotton-line);
        }
        .tab.active {
          background: var(--indigo);
          color: var(--indigo-text);
          border-color: var(--indigo);
        }
        .status {
          padding: 30px 20px;
          color: var(--muted);
          font-size: 13px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 14px;
          padding: 10px 20px 40px;
        }
        .card {
          background: #fff;
          border-radius: 6px;
          overflow: hidden;
        }
        .card-image-link {
          display: block;
        }
        .card-image {
          height: 140px;
          background-size: cover;
          background-position: center;
        }
        .card-body {
          padding: 10px;
        }
        .card-name {
          font-family: var(--font-voice);
          font-size: 14px;
          color: var(--ink);
        }
        .card-note {
          font-size: 11px;
          color: var(--muted);
          margin: 2px 0 8px;
        }
        .delete-btn {
          font-size: 12px;
          color: var(--madder);
          background: none;
          border: 1px solid var(--madder);
          border-radius: 16px;
          padding: 4px 12px;
        }
      `}</style>
    </main>
  );
}
