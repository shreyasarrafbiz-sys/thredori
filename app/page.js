"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Header from "../components/Header";
import BrandCard from "../components/BrandCard";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE = 12;
const CATEGORIES = ["All", "Fashion", "Home", "Beauty", "Accessories", "Lifestyle", "Shopping Finds"];

function mapPost(p) {
  return {
    id: p.id,
    name: p.brand_name,
    category: p.category || "Lifestyle",
    note: p.post_type === "thread" ? p.body : p.note,
    location: "",
    color: "#E8DFD3",
    image: p.image_url,
    mediaUrls: Array.isArray(p.media_urls) && p.media_urls.length ? p.media_urls : (p.image_url ? [p.image_url] : []),
    brandLink: p.brand_link,
    postType: p.post_type,
    isReal: true,
    createdAt: p.created_at,
  };
}

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
    if (error) {
      console.error("Could not load Thredori finds", error);
      return [];
    }
    return (data || []).map(mapPost);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoadingPosts(true);
      const first = await loadPage(0);
      if (cancelled) return;
      setPosts(first);
      setHasMore(first.length === PAGE_SIZE);
      setPage(0);
      setLoadingPosts(false);
    }
    init();
    return () => { cancelled = true; };
  }, [loadPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || loadingPosts || search.trim() || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      setLoadingMore(true);
      const nextPage = page + 1;
      loadPage(nextPage).then((more) => {
        setPosts((current) => [...current, ...more]);
        setHasMore(more.length === PAGE_SIZE);
        setPage(nextPage);
      }).finally(() => setLoadingMore(false));
    }, { rootMargin: "360px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, loadPage, loadingPosts, search]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  const query = search.trim().toLowerCase();
  const filtered = posts.filter((post) => {
    const categoryMatch = active === "All" || String(post.category).toLowerCase() === active.toLowerCase();
    const searchMatch = !query || [post.name, post.category, post.note, post.postType, post.brandLink]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
    return categoryMatch && searchMatch;
  });
  const heroPosts = posts.filter((post) => post.mediaUrls.length > 0).slice(0, 3);

  return (
    <main className="home-page">
      <Header user={user} onLogout={handleLogout} searchValue={search} onSearch={setSearch} />
      <div className="home-shell">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow">A VISUAL DISCOVERY COMMUNITY</span>
            <h1 id="hero-title">Good taste is<br /><em>meant to be shared.</em></h1>
            <p>Discover inspiring finds, beautiful spaces, personal style and little things worth sharing.</p>
            <div className="hero-actions">
              <a className="button-primary" href="#discover">Explore Thredori</a>
              <Link className="button-secondary" href={user ? "/new-post" : "/signup"}>Share your first find</Link>
            </div>
            <div className="hero-footnote"><span className="sparkle">✳</span> Fashion · Home · Beauty · Everyday finds</div>
          </div>
          <div className="hero-art" aria-label="A glimpse of community inspiration">
            {heroPosts.length > 0 ? heroPosts.map((post, index) => (
              <Link href={`/post/${post.id}`} className={`hero-photo hero-photo-${index + 1}`} key={post.id}>
                <img src={post.mediaUrls[0]} alt={post.name || "Community inspiration"} />
                <span>{post.category}</span>
              </Link>
            )) : (
              <div className="editorial-stack" aria-hidden="true">
                <div className="paper paper-back"><span>THE ART OF</span><strong>FINDING<br />YOUR STYLE</strong></div>
                <div className="paper paper-front"><i>THREDORI</i><strong>INSPIRATION<br />LIVES HERE.</strong><span>ISSUE Nº 01 · EVERYDAY EDIT</span></div>
                <span className="art-stamp">GOOD<br />FINDS<br />ONLY</span>
              </div>
            )}
            <span className="art-caption">A little inspiration, every day.</span>
          </div>
        </section>

        <section className="category-section" aria-label="Discover by category">
          <div className="section-kicker">FIND YOUR KIND OF INSPIRATION</div>
          <div className="category-list">
            {CATEGORIES.map((category) => (
              <button key={category} type="button" className={active === category ? "category-chip active" : "category-chip"} onClick={() => setActive(category)} aria-pressed={active === category}>
                {category === "All" ? "Everything" : category}
              </button>
            ))}
          </div>
        </section>

        <section className="discover-section" id="discover">
          <div className="section-heading">
            <div><span className="section-kicker">THE COMMUNITY BOARD</span><h2>Finds worth <em>keeping.</em></h2><p>Fresh inspiration, shared by people with an eye for the good stuff.</p></div>
            <span className="live-label"><i /> REAL COMMUNITY FINDS</span>
          </div>
          {loadingPosts ? <p className="status-message">Gathering the good finds…</p> :
            filtered.length === 0 ? (
              <div className="empty-state">
                <span className="empty-mark">✳</span>
                <h3>{posts.length === 0 ? "Your next favourite thing starts here." : "Nothing in this corner just yet."}</h3>
                <p>{posts.length === 0 ? "Be among the first to share something worth discovering." : "Try another category or search, or come back for fresh inspiration."}</p>
                {user && <Link className="button-primary" href="/new-post">Share a find</Link>}
              </div>
            ) : <div className="masonry-grid">{filtered.map((post) => <BrandCard key={post.id} brand={post} user={user} />)}</div>
          }
          <div ref={sentinelRef} className="feed-sentinel" />
          {loadingMore && <p className="status-message">More inspiration on its way…</p>}
        </section>
        <footer className="site-footer"><Link href="/">thredori</Link><span>Discover what inspires you. Share what you love.</span><Link href="/policies">Community guidelines</Link></footer>
      </div>

      <style jsx>{`
        .home-page{min-height:100vh;background:var(--paper)}.home-shell{max-width:1440px;margin:0 auto;padding:0 clamp(18px,4.4vw,68px)}
        .hero{display:grid;grid-template-columns:1.02fr .98fr;gap:clamp(28px,6vw,90px);align-items:center;padding:clamp(54px,8vw,108px) 0 72px;border-bottom:1px solid var(--line)}
        .hero-copy{max-width:600px}.eyebrow,.section-kicker{font-size:10px;letter-spacing:.18em;font-weight:700;color:var(--accent);text-transform:uppercase}
        h1{font-family:var(--font-editorial);font-weight:500;font-size:clamp(48px,6.2vw,82px);line-height:.99;letter-spacing:-.045em;color:var(--ink);margin:20px 0 22px}h1 em,h2 em{font-weight:500;color:var(--accent);font-style:italic}
        .hero-copy>p{max-width:430px;font-size:15px;line-height:1.8;color:var(--muted);margin:0}
        .hero-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:30px}.button-primary,.button-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 21px;border-radius:3px;font-size:12px;font-weight:700;letter-spacing:.02em;transition:transform .2s,background .2s}.button-primary{background:var(--accent);color:white}.button-primary:hover{background:#99543f;transform:translateY(-2px)}.button-secondary{border:1px solid var(--line-strong);color:var(--ink);background:transparent}.button-secondary:hover{transform:translateY(-2px);background:white}
        .hero-footnote{margin-top:34px;color:var(--muted);font-size:10px;letter-spacing:.08em;text-transform:uppercase}.sparkle{color:var(--accent);font-size:16px;margin-right:8px}
        .hero-art{min-height:390px;position:relative;display:flex;align-items:center;justify-content:center}.hero-photo{position:absolute;display:block;background:var(--sand);padding:8px 8px 28px;box-shadow:0 16px 45px rgba(42,34,27,.12);transition:transform .3s}.hero-photo img{width:100%;height:100%;object-fit:cover;display:block}.hero-photo span{position:absolute;bottom:8px;left:12px;font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}.hero-photo-1{width:48%;height:290px;left:7%;top:8%;transform:rotate(-7deg);z-index:2}.hero-photo-2{width:43%;height:255px;right:3%;top:16%;transform:rotate(6deg);z-index:1}.hero-photo-3{width:40%;height:220px;left:31%;bottom:0;transform:rotate(-1deg);z-index:3}.hero-photo:hover{z-index:5;transform:rotate(0) translateY(-5px)}
        .editorial-stack{width:min(88%,490px);height:360px;position:relative}.paper{position:absolute;box-shadow:0 18px 42px rgba(42,34,27,.12);display:flex;flex-direction:column;justify-content:space-between}.paper-back{width:64%;height:82%;right:3%;top:2%;background:#d9c6ae;color:#4b4036;padding:28px;transform:rotate(7deg)}.paper-back span{font-size:10px;letter-spacing:.2em}.paper-back strong{font:italic 42px/1 var(--font-editorial)}.paper-front{width:65%;height:91%;left:5%;top:0;background:#e9e0d4;color:#2d2924;padding:25px;transform:rotate(-5deg);border:9px solid #f8f5ef}.paper-front i{font:italic 14px var(--font-editorial);letter-spacing:.08em}.paper-front strong{font:500 34px/.98 var(--font-editorial);letter-spacing:-.04em}.paper-front span{font-size:8px;letter-spacing:.17em}.art-stamp{position:absolute;right:2%;bottom:6%;width:86px;height:86px;border:1px solid var(--accent);border-radius:50%;display:grid;place-content:center;text-align:center;font-size:10px;line-height:1.2;letter-spacing:.12em;color:var(--accent);transform:rotate(12deg);z-index:4}.art-caption{position:absolute;right:0;bottom:-23px;font:italic 13px var(--font-editorial);color:var(--muted)}
        .category-section{padding:31px 0 38px;border-bottom:1px solid var(--line)}.category-list{display:flex;gap:9px;flex-wrap:wrap;margin-top:17px}.category-chip{border:1px solid var(--line-strong);background:transparent;color:var(--muted);border-radius:30px;padding:10px 17px;font-size:11px;transition:all .18s}.category-chip:hover,.category-chip.active{background:var(--ink);border-color:var(--ink);color:white}
        .discover-section{padding:55px 0 75px;scroll-margin-top:20px}.section-heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:26px}.section-heading h2{font:500 clamp(32px,4vw,46px)/1.05 var(--font-editorial);letter-spacing:-.03em;margin:11px 0 7px;color:var(--ink)}.section-heading p{font-size:12px;color:var(--muted);margin:0}.live-label{font-size:9px;letter-spacing:.14em;color:var(--muted);white-space:nowrap}.live-label i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#7b936e;margin:0 7px 1px 0}
        .masonry-grid{columns:2;column-gap:18px}.masonry-grid :global(.brand-card){display:inline-block;width:100%;margin:0 0 18px;break-inside:avoid;background:white;border:1px solid var(--line);border-radius:5px;padding:9px;box-shadow:0 5px 22px rgba(40,34,28,.045)}.masonry-grid :global(.brand-card:hover){transform:translateY(-3px);box-shadow:0 12px 28px rgba(40,34,28,.1)}.masonry-grid :global(.polaroid){border:0;border-radius:2px;box-shadow:none;padding:0 0 8px;margin-bottom:5px}.masonry-grid :global(.brand-photo){width:100%;height:auto;object-fit:contain}.masonry-grid :global(.brand-card-name){font:500 17px var(--font-editorial);margin:8px 2px 3px;color:var(--ink)}.masonry-grid :global(.brand-card-note){font-size:11px;margin:0 2px 8px;color:var(--muted)}.masonry-grid :global(.action-row){padding:0 2px 3px}.masonry-grid :global(.action-btn),.masonry-grid :global(.comment-btn){border-radius:3px}.status-message{text-align:center;padding:42px 0;color:var(--muted);font:italic 16px var(--font-editorial)}.empty-state{text-align:center;padding:75px 20px;background:var(--sand-soft);border:1px solid var(--line);}.empty-mark{font-size:25px;color:var(--accent)}.empty-state h3{font:500 29px var(--font-editorial);margin:12px 0 7px;color:var(--ink)}.empty-state p{font-size:12px;color:var(--muted);margin:0 auto 20px;max-width:390px;line-height:1.7}.feed-sentinel{height:2px}.site-footer{border-top:1px solid var(--line);padding:24px 0 34px;display:flex;justify-content:space-between;gap:15px;align-items:center;color:var(--muted);font-size:10px}.site-footer a:first-child{font:italic 18px var(--font-editorial);color:var(--ink)}
        @media(min-width:640px){.masonry-grid{columns:3}}@media(min-width:960px){.masonry-grid{columns:4}}@media(min-width:1280px){.masonry-grid{columns:5}}
        @media(max-width:760px){.hero{grid-template-columns:1fr;padding:54px 0 48px;gap:20px}.hero-art{min-height:320px;max-width:540px;width:100%;margin:0 auto}.editorial-stack{height:300px}.paper-back strong{font-size:35px}.paper-front strong{font-size:29px}.hero-photo-1{height:240px}.hero-photo-2{height:220px}.hero-photo-3{height:185px}.section-heading{align-items:start;flex-direction:column}.live-label{margin-top:-9px}.site-footer{flex-wrap:wrap}.site-footer span{order:3;width:100%}}
        @media(max-width:430px){.hero{padding-top:42px}.hero-art{min-height:285px}.hero-photo-1{height:210px}.hero-photo-2{height:190px}.hero-photo-3{height:165px}.category-chip{padding:9px 13px}.masonry-grid{column-gap:10px}.masonry-grid :global(.brand-card){margin-bottom:10px;padding:6px}}
      `}
    </style>
    </main>
  );
}
