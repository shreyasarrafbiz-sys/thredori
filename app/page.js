"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../components/Header";
import BrandCard from "../components/BrandCard";
import PaperPlane from "../components/PaperPlane";
import { brands as seedBrands } from "../data/brands";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE = 9;

export default function Home() {
  const [active, setActive] = useState("All");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadPage = useCallback(async (pageIndex) => {
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).range(from, to);
    if (error || !data) return [];
    return data.map((p) => ({
      id: p.id,
      name: p.brand_name,
      category: p.category,
      note: p.post_type === "thread" ? p.body : p.note,
      location: "",
      color: "#8A7F6B",
      image: p.image_url,
      brandLink: p.brand_link,
      postType: p.post_type,
      isReal: true
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
    if (!sentinelRef.current || loadingPosts || search.trim()) return;
    const observer = new IntersectionObserver((entries) => {
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
    }, { rootMargin: "300px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, loadPage, loadingPosts, search]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  const seedWithFlag = seedBrands.map((b) => ({ ...b, isReal: false }));
  const combined = hasMore ? posts : [...posts, ...seedWithFlag];
  const query = search.trim().toLowerCase();
  const searched = query
    ? combined.filter((b) => [b.name, b.category, b.note, b.location, b.postType, b.brandLink].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
    : combined;
  const filtered = active === "All" ? searched : searched.filter((b) => b.category === active);

  return (
    <main>
      <div className="floating-decor" aria-hidden="true">
        <span className="decor decor-flower">✿</span>
        <span className="decor decor-heart">♡</span>
        <span className="decor decor-smile">☺</span>
        <span className="decor decor-sparkle">✦</span>
        <span className="decor decor-flower-two">✽</span>
        <span className="decor decor-heart-two">♥</span>
      </div>
      <Header active={active} onChange={setActive} user={user} onLogout={handleLogout} searchValue={search} onSearch={setSearch} />
      <section className="intro container">
        <PaperPlane />
        <div className="intro-copy page-rise">
          <span className="eyebrow">a little corner for good finds</span>
          <p>Found something good? Share it before everyone else does.</p>
        </div>
      </section>
      {loadingPosts ? (
        <p className="loading container">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="loading container">No finds match “{search.trim()}”. Try a label, style, maker, or category.</p>
      ) : (
        <>
          <section className="grid container">{filtered.map((brand) => <BrandCard key={brand.id} brand={brand} user={user} />)}</section>
          <div ref={sentinelRef} className="sentinel" />
          {loadingMore && <p className="loading container">Loading more...</p>}
        </>
      )}
      <footer className="container"><p>Thredori · Curated, not algorithm-fed.</p></footer>
      <style jsx>{`
        .floating-decor { position:fixed; inset:0; pointer-events:none; z-index:1; overflow:hidden; }
        .decor { position:absolute; display:block; font-family:Georgia,serif; color:var(--madder); opacity:.62; animation:floatSoft 6s ease-in-out infinite; }
        .decor-flower { top:18%; left:8%; font-size:25px; }
        .decor-heart { top:30%; right:5%; font-size:31px; animation-delay:-1.8s; }
        .decor-smile { top:67%; left:8%; font-size:24px; animation-delay:-3.2s; }
        .decor-sparkle { top:47%; right:8%; font-size:20px; animation-delay:-4.1s; }
        .decor-flower-two { bottom:12%; right:18%; font-size:21px; animation-delay:-2.4s; }
        .decor-heart-two { bottom:25%; left:18%; font-size:17px; animation-delay:-4.8s; }
        .intro { padding:20px 20px 8px; position:relative; overflow:hidden; }
        .intro-copy { position:relative; z-index:2; }
        .eyebrow { display:inline-block; margin-bottom:5px; font-family:var(--font-voice); font-style:italic; font-size:12px; color:var(--madder); }
        .intro p { font-size:13px; color:var(--muted); margin:0; }
        .loading { padding:20px; font-size:13px; color:var(--muted); text-align:center; }
        .sentinel { height:1px; }
        .grid { display:grid; grid-template-columns:1fr; gap:14px; padding:10px 20px 40px; position:relative; z-index:2; align-items:start; }
        @media (min-width:640px) { .grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (min-width:960px) { .grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
        footer { padding:20px; text-align:center; font-size:12px; color:var(--muted); border-top:1px solid var(--cotton-line); position:relative; z-index:2; }
        @media (max-width:640px) { .decor-flower,.decor-smile { left:3%; } .decor-heart,.decor-sparkle { right:3%; } }
      `}</style>
    </main>
  );
}
