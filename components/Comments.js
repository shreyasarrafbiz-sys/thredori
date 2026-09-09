"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function Comments({ postId, user }) {
  const [comments, setComments] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    const rows = data || [];
    setComments(rows);

    const ids = [...new Set(rows.map((comment) => comment.user_id).filter(Boolean))];
    if (ids.length) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, avatar_seed")
        .in("id", ids);

      const nextProfiles = {};
      (profileData || []).forEach((profile) => {
        nextProfiles[profile.id] = profile;
      });
      setProfiles(nextProfiles);
    } else {
      setProfiles({});
    }

    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!text.trim()) return;

    setPosting(true);

    const moderationResponse = await fetch("/api/moderate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text.trim() }),
    });
    const moderation = await moderationResponse.json().catch(() => ({}));

    if (!moderationResponse.ok || moderation.allowed !== true) {
      setPosting(false);
      window.alert(moderation.reason || "This comment contains content that is not allowed on Thredori.");
      return;
    }

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: text.trim(),
    });
    setPosting(false);

    if (!error) {
      setText("");
      loadComments();
    }
  }

  async function handleDelete(commentId) {
    if (!confirm("Delete this comment?")) return;
    await supabase.from("comments").delete().eq("id", commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div className="comments">
      <h3>Comments ({comments.length})</h3>

      <form onSubmit={handleSubmit} className="comment-form">
        <input
          type="text"
          placeholder={user ? "Add a comment..." : "Log in to comment"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!user || posting}
        />
        <button type="submit" disabled={posting || !text.trim()}>
          {posting ? "Checking..." : "Post"}
        </button>
      </form>

      {loading ? (
        <p className="empty">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="empty">No comments yet — be the first.</p>
      ) : (
        <div className="list">
          {comments.map((c) => {
            const profile = profiles[c.user_id];
            const displayName = profile?.username
              ? `@${profile.username}`
              : profile?.full_name || "Thredori member";
            const avatar = profile?.avatar_url;

            return (
              <div key={c.id} className="comment">
                <div className="comment-head">
                  <Link href={`/user/${c.user_id}`} className="comment-user">
                    {avatar ? (
                      <img src={avatar} alt="" className="comment-avatar" />
                    ) : (
                      <span className="comment-avatar emoji-avatar" aria-hidden="true">
                        {({ flower: "🌸", smiley: "😊", heart: "💗", sun: "🌞", cloud: "☁️", star: "⭐" })[profile?.avatar_seed] || "🌸"}
                      </span>
                    )}
                    <span>{displayName}</span>
                  </Link>
                </div>
                <p className="content">{c.content}</p>
                {user && user.id === c.user_id && (
                  <button className="delete" onClick={() => handleDelete(c.id)}>
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .comments { margin-top:20px; }
        h3 { font-family:var(--font-voice); font-size:16px; margin:0 0 10px; }
        .comment-form { display:flex; gap:8px; margin-bottom:14px; }
        input { flex:1; padding:8px 12px; border-radius:20px; border:1px solid var(--cotton-line); font-size:13px; font-family:var(--font-sans); }
        button[type="submit"] { background:var(--indigo); color:var(--indigo-text); border:none; border-radius:20px; padding:8px 16px; font-size:13px; }
        button[type="submit"]:disabled { opacity:.5; }
        .empty { font-size:13px; color:var(--muted); }
        .list { display:flex; flex-direction:column; gap:10px; }
        .comment { background:var(--cotton); border-radius:8px; padding:10px 12px; }
        .comment-head { margin-bottom:6px; }
        .comment-user { display:inline-flex; align-items:center; gap:8px; color:var(--ink); font:600 12px var(--font-sans); }
        .comment-avatar { width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid var(--cotton-line); flex:0 0 auto; }
        .emoji-avatar { display:grid; place-items:center; background:var(--blush-soft); font-size:17px; }
        .content { font-size:13px; margin:0; color:var(--ink); }
        .delete { background:none; border:none; font-size:11px; color:var(--madder); padding:0; margin-top:6px; }
      `}</style>
    </div>
  );
}
