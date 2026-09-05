"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function Comments({ postId, user }) {
  const [comments, setComments] = useState([]);
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
    setComments(data || []);
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
          disabled={!user}
        />
        <button type="submit" disabled={posting || !text.trim()}>
          Post
        </button>
      </form>

      {loading ? (
        <p className="empty">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="empty">No comments yet — be the first.</p>
      ) : (
        <div className="list">
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <p className="content">{c.content}</p>
              {user && user.id === c.user_id && (
                <button className="delete" onClick={() => handleDelete(c.id)}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .comments {
          margin-top: 20px;
        }
        h3 {
          font-family: var(--font-voice);
          font-size: 16px;
          margin: 0 0 10px;
        }
        .comment-form {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }
        input {
          flex: 1;
          padding: 8px 12px;
          border-radius: 20px;
          border: 1px solid var(--cotton-line);
          font-size: 13px;
          font-family: var(--font-sans);
        }
        button[type="submit"] {
          background: var(--indigo);
          color: var(--indigo-text);
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 13px;
        }
        button[type="submit"]:disabled {
          opacity: 0.5;
        }
        .empty {
          font-size: 13px;
          color: var(--muted);
        }
        .list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .comment {
          background: var(--cotton);
          border-radius: 8px;
          padding: 10px 12px;
        }
        .content {
          font-size: 13px;
          margin: 0;
          color: var(--ink);
        }
        .delete {
          background: none;
          border: none;
          font-size: 11px;
          color: var(--madder);
          padding: 0;
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
}
