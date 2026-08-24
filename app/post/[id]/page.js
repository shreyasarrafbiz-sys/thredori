"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function PostDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    async function loadPost() {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

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
      await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", id);
      setSaved(false);
    } else {
      await supabase.from("saved_posts").insert({ user_id: user.id, post_id: id });
      setSaved(true);
    }
    setSaving(false);
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

  return (
    <main className="page">
      <div className="top">
        <a href="/" className="back">
          ← Back
        </a>
      </div>

      <div className="detail-card">
        <div
          className="detail-image"
          style={{
            backgroundImage: post.image_url ? `url(${post.image_url})` : undefined,
            backgroundColor: post.image_url ? undefined : "#8A7F6B",
          }}
        />
        <div className="detail-info">
          <div className="detail-name">{post.brand_name}</div>
          {post.note && <div className="detail-note">{post.note}</div>}
          <span className="detail-category">{post.category}</span>

          <button
            className={`save-btn ${saved ? "saved" : ""}`}
            onClick={toggleSave}
            disabled={saving}
          >
            {saved ? "Saved" : "Save"}
          </button>

          {post.brand_link && (
            <a
              href={post.brand_link}
              target="_blank"
              rel="noopener noreferrer"
              className="visit-link"
            >
              Visit brand ↗
            </a>
          )}
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: var(--cotton);
          padding: 20px;
        }
        .top {
          max-width: 700px;
          margin: 0 auto 16px;
        }
        .back {
          font-size: 13px;
          color: var(--muted);
        }
        .detail-card {
          max-width: 700px;
          margin: 0 auto;
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
        .detail-category {
          display: inline-block;
          width: fit-content;
          font-size: 11px;
          background: var(--cotton);
          color: #6b5f4e;
          padding: 3px 10px;
          border-radius: 10px;
          margin: 4px 0 8px;
        }
        .save-btn {
          width: fit-content;
          background: var(--madder);
          color: var(--madder-text);
          border: none;
          border-radius: 20px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
        }
        .save-btn.saved {
          background: var(--indigo);
          color: var(--indigo-text);
        }
        .visit-link {
          font-size: 13px;
          color: var(--indigo);
          margin-top: 4px;
        }
      `}</style>
    </main>
  );
}
