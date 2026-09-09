"use client";

import { useState, useEffect } from "react";
import BrandCard from "../../components/BrandCard";
import { supabase } from "../../lib/supabaseClient";

export default function Trending() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    async function load() {
      const [{ data: postData, error: postError }, { data: voteData, error: voteError }] = await Promise.all([
        supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("votes")
          .select("post_id, value"),
      ]);

      if (postError || voteError) {
        console.error("Trending load error", { postError, voteError });
      }

      const upvotesByPost = new Map();
      (voteData || []).forEach((vote) => {
        if (Number(vote.value) === 1) {
          upvotesByPost.set(
            vote.post_id,
            (upvotesByPost.get(vote.post_id) || 0) + 1
          );
        }
      });

      const rankedPosts = (postData || [])
        .map((p) => ({
          id: p.id,
          name: p.brand_name,
          category: p.category,
          note: p.post_type === "thread" ? p.body : p.note,
          location: "",
          color: "#8A7F6B",
          image: p.image_url,
          postType: p.post_type,
          isReal: true,
          upvotes: upvotesByPost.get(p.id) || 0,
          createdAt: p.created_at,
        }))
        .sort((a, b) => {
          const upvoteDifference = b.upvotes - a.upvotes;
          if (upvoteDifference !== 0) return upvoteDifference;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      setPosts(rankedPosts);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="page">
      <div className="topbar container">
        <a href="/" className="wordmark">
          thredori
        </a>
        <h1>Trending</h1>
      </div>

      <p className="note container">
        The finds getting the most love from the Thredori community.
      </p>

      {loading ? (
        <p className="status container">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="status container">Nothing posted yet.</p>
      ) : (
        <section className="grid container">
          {posts.map((post) => (
            <BrandCard key={post.id} brand={post} user={user} />
          ))}
        </section>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: var(--cotton);
        }
        .topbar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--cotton-line);
        }
        .wordmark {
          font-family: var(--font-voice);
          font-style: italic;
          font-size: 19px;
          color: var(--ink);
        }
        h1 {
          font-family: var(--font-voice);
          font-size: 18px;
          margin: 0;
        }
        .note {
          padding: 14px 20px 0;
          font-size: 12px;
          color: var(--muted);
        }
        .status {
          padding: 30px 20px;
          color: var(--muted);
          font-size: 13px;
        }
        .grid {
          column-count: 1;
          column-gap: 14px;
          padding: 10px 20px 40px;
        }
        @media (min-width: 640px) {
          .grid {
            column-count: 2;
          }
        }
        @media (min-width: 960px) {
          .grid {
            column-count: 3;
          }
        }
      `}</style>
    </main>
  );
}
