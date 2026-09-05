"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../components/Header";
import BrandCard from "../components/BrandCard";
import { brands as seedBrands } from "../data/brands";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE = 9;

export default function Home() {
  const [active, setActive] = useState("All");
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadPage = useCallback(async (pageIndex) => {
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error || !data) return [];

    return data.map((p) => ({
      id: p.id,
      name: p.brand_name,
      category: p.category,
      note: p.note,
      location: "",
      color: "#8A7F6B",
      image: p.image_url,
      isReal: true,
    }));
  }, []);

  useEffect(() => {
    async function init() {
      const first = await loadPage(0);
      setPosts(first);
      setHasMore(first.length === PAGE_SIZE);
      setLoadingPosts(false);
    }
    init();
  }, [loadPage]);

  useEffect(() => {
    if (!sentinelRef.current || loadingPosts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          const nextPage = page + 1;
          loadPage(nextPage).then((more) => {
            setPosts((prev) => [...prev, ...more]);
            setHasMore(more.length === PAGE_SIZE);
            setPage(nextPage);
            setLoadingMore(false);
          });
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, loadPage, loadingPosts]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  const seedWithFlag = seedBrands.map((b) => ({ ...b, isReal: false }));
  const combined = hasMore ? posts : [...posts, ...seedWithFlag];
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
        <>
          <section className="grid container">
            {filtered.map((brand) => (
              <BrandCard key={brand.id} brand={brand} user={user} />
            ))}
          </section>
          <div ref={sentinelRef} className="sentinel" />
          {loadingMore && <p className="loading container">Loading more...</p>}
        </>
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
          text-align: center;
        }
        .sentinel {
          height: 1px;
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
