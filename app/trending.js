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
      // Sorted by newest for now — swap this order/query once a real
      // trending signal (views, saves, comments) exists to rank by.
      const { data } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      setPosts(
        (data || []).map((p) => ({
          id: p.id,
          name: p.brand_name,
          category: p.category,
          note: p.note,
          location: "",
          color: "#8A7F6B",
          image: p.image_url,
          isReal: true,
        }))
      );
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
        Showing recent posts for now — ranking by views and saves is coming soon.
      </p>

      {loading ? (
        <p className="status container">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="status container">Nothing posted yet.</p>
      ) : (
        <section className="grid container">
          {posts.map((post) => (
            <BrandCard key={post.id} brand={post} height={150} user={user} />
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
