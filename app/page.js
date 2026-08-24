"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import BrandCard from "../components/BrandCard";
import { brands as seedBrands } from "../data/brands";
import { supabase } from "../lib/supabaseClient";

const heights = [150, 110, 170, 95, 130, 115, 150, 100];

export default function Home() {
  const [active, setActive] = useState("All");
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadPosts() {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Map database rows to the same shape BrandCard expects
        const mapped = data.map((p) => ({
          id: p.id,
          name: p.brand_name,
          category: p.category,
          note: p.note,
          location: "",
          link: p.brand_link,
          color: "#8A7F6B",
          image: p.image_url,
        }));
        setPosts(mapped);
      }
      setLoadingPosts(false);
    }
    loadPosts();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  // Real posts first, seed content fills the rest so the feed isn't empty on day one
  const combined = [...posts, ...seedBrands];
  const filtered =
    active === "All" ? combined : combined.filter((b) => b.category === active);

  return (
    <main>
      <Header active={active} onChange={setActive} user={user} onLogout={handleLogout} />

      <section className="intro container">
        <p>Discover independent Indian fashion & home labels — before they’re everywhere.</p>
      </section>

      {loadingPosts ? (
        <p className="loading container">Loading...</p>
      ) : (
        <section className="grid container">
          {filtered.map((brand, i) => (
            <BrandCard key={brand.id} brand={brand} height={heights[i % heights.length]} />
          ))}
        </section>
      )}

      <footer className="container">
        <p>Thredori · Curated, not algorithm-fed.</p>
      </footer>

      <style jsx>{`
        .intro {
          padding: 18px 20px 6px;
        }
        .intro p {
          font-size: 13px;
          color: var(--muted);
          margin: 0;
        }
        .loading {
          padding: 20px;
          font-size: 13px;
          color: var(--muted);
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
        footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: var(--muted);
          border-top: 1px solid var(--cotton-line);
        }
      `}</style>
    </main>
  );
}
