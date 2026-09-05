"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import VoteControl from "../../../components/VoteControl";
import Comments from "../../../components/Comments";

export default function PostDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    async function loadPost() {
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();
      if (!error) setPost(data);
      setLoading(false);
    }
    if (id) loadPost();
  }, [id]);

  useEffect(() => {
    async function checkSaved() {
      if (!user || !id) return;
      const { data } = await supabase
        .from("saved_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("post_id", id)
        .maybeSingle();
      setSaved(!!data);
    }
    checkSaved();
  }, [user, id]);

  async function toggleSave() {
    if (!user) {
      router.push("/login");
      return;
    }
    setSaving(true);
    if (saved) {
      await supabase.from("saved_posts").delete().eq("user_id", user.id).eq("post_id", id);
      setSaved(false);
    } else {
      await supabase.from("saved_posts").insert({ user_id: user.id, post_id: id });
      setSaved(true);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    await supabase.from("posts").delete().eq("id", id);
    router.push("/profile");
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.brand_name, url });
        return;
      } catch (e) {
        // fall through to clipboard copy if share is cancelled/unsupported
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <main className="page">
        <p className="status">Loading...</p>
        <style jsx>{`
          .page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--cotton);
          }
          .status {
            color: var(--muted);
            font-size: 13px;
          }
        `}</style>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="page">
        <div className="not-found">
          <p>Post not found.</p>
          <a href="/">Back to feed</a>
        </div>
        <style jsx>{`
          .page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--cotton);
          }
          .not-found {
            text-align: center;
          }
          .not-found a {
            color: var(--indigo);
            font-size: 13px;
          }
        `}</style>
      </main>
    );
  }

  const isThread = post.post_type === "thread";

  return (
    <main className="page">
      <div className="top container">
        <a href="/" className="back">
          ← Back
        </a>
      </div>

      <div className="detail-card container">
        {!isThread && (
          <div
            className="detail-image"
            style={{
              backgroundImage: post.image_url ? `url(${post.image_url})` : undefined,
              backgroundColor: post.image_url ? undefined : "#8A7F6B",
            }}
          />
        )}

        <div className="detail-info">
          <div className="detail-name">{post.brand_name}</div>
          {post.note && <div className="detail-note">{post.note}</div>}
          {isThread && post.body && <p className="detail-body">{post.body}</p>}
          <span className="detail-category">{isThread ? "Discussion" : post.category}</span>

          <div className="action-row">
            <VoteControl postId={id} user={user} size="large" />

            <button
              className={`save-btn ${saved ? "saved" : ""}`}
              onClick={toggleSave}
              disabled={saving}
            >
              {saved ? "Saved" : "Save"}
            </button>

            <button className="share-btn" onClick={handleShare}>
              {copied ? "Link copied!" : "Share"}
            </button>
          </div>

          {post.brand_link && (
            <a href={post.brand_link} target="_blank" rel="noopener noreferrer" className="visit-link">
              Visit brand ↗
            </a>
          )}

          {user && user.id === post.user_id && (
            <button className="delete-btn" onClick={handleDelete}>
              Delete post
            </button>
          )}

          <Comments postId={id} user={user} />
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: var(--cotton);
          padding: 20px 0;
        }
        .top {
          margin-bottom: 16px;
        }
        .back {
          font-size: 13px;
          color: var(--muted);
        }
        .detail-card {
          max-width: 700px;
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .detail-image {
          width: 100%;
          height: 420px;
          background-size: cover;
          background-position: center;
        }
        .detail-info {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .detail-name {
          font-family: var(--font-voice);
          font-size: 22px;
          color: var(--ink);
        }
        .detail-note {
          font-size: 14px;
          color: var(--muted);
        }
        .detail-body {
          font-size: 14px;
          color: var(--ink);
          line-height: 1.6;
          white-space: pre-wrap;
          margin: 4px 0;
        }
        .detail-category {
          display: inline-block;
          width: fit-content;
          font-size: 11px;
          background: var(--cotton);
          color: #6b5f4e;
          padding: 3px 10px;
          border-radius: 10px;
          margin: 4px 0 4px;
        }
        .action-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 8px 0 4px;
          flex-wrap: wrap;
        }
        .save-btn {
          background: var(--madder);
          color: var(--madder-text);
          border: none;
          border-radius: 20px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
        }
        .save-btn.saved {
          background: var(--indigo);
          color: var(--indigo-text);
        }
        .share-btn {
          background: #fff;
          color: var(--ink);
          border: 1px solid var(--cotton-line);
          border-radius: 20px;
          padding: 10px 20px;
          font-size: 14px;
        }
        .visit-link {
          font-size: 13px;
          color: var(--indigo);
          margin-top: 4px;
        }
        .delete-btn {
          width: fit-content;
          font-size: 12px;
          color: var(--madder);
          background: none;
          border: 1px solid var(--madder);
          border-radius: 16px;
          padding: 6px 16px;
          margin-top: 8px;
        }
      `}</style>
    </main>
  );
}
