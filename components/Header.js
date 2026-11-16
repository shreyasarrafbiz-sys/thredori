"use client";

import Link from "next/link";

export default function Header({ user, onLogout, searchValue = "", onSearch }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="Thredori home">thredori<span>✳</span></Link>
        <div className="search-wrap">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5" strokeLinecap="round"/></svg>
          <input value={searchValue} onChange={(event) => onSearch?.(event.target.value)} placeholder="Search finds, styles, ideas…" aria-label="Search finds, styles and ideas"/>
          {searchValue && <button type="button" onClick={() => onSearch?.("")} aria-label="Clear search">×</button>}
        </div>
        <nav className="header-links" aria-label="Quick links">
          <Link href="/trending">Trending</Link>
          {user ? <><Link href="/new-post" className="create-link">＋ Share a find</Link><Link href="/profile">Profile</Link><button type="button" onClick={onLogout}>Log out</button></> : <><Link href="/login">Log in</Link><Link href="/signup" className="create-link">Join Thredori</Link></>}
        </nav>
      </div>
      <style jsx>{`
        .site-header{position:sticky;top:0;z-index:30;background:rgba(250,248,244,.94);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}.header-inner{max-width:1440px;margin:0 auto;padding:13px clamp(18px,4.4vw,68px);display:flex;align-items:center;gap:clamp(16px,3vw,42px)}.wordmark{font:italic 27px var(--font-editorial);letter-spacing:-.06em;color:var(--ink);white-space:nowrap}.wordmark span{font:12px var(--font-sans);color:var(--accent);vertical-align:top;margin-left:3px}.search-wrap{display:flex;align-items:center;gap:10px;max-width:390px;flex:1;border:1px solid var(--line-strong);background:#fff;padding:0 13px;height:40px;color:var(--muted)}.search-wrap input{border:0;outline:0;background:transparent;min-width:0;flex:1;font:12px var(--font-sans);color:var(--ink)}.search-wrap button{border:0;background:none;color:var(--muted);font-size:20px}.header-links{display:flex;align-items:center;gap:clamp(10px,2vw,25px);margin-left:auto;white-space:nowrap}.header-links a,.header-links button{font:600 11px var(--font-sans);color:var(--ink);background:none;border:0;padding:8px 0}.header-links a:hover,.header-links button:hover{color:var(--accent)}.header-links .create-link{background:var(--accent);color:#fff;padding:11px 16px;border-radius:3px}.header-links .create-link:hover{background:#99543f;color:#fff}
        @media(max-width:760px){.header-inner{flex-wrap:wrap;gap:10px 16px}.wordmark{font-size:25px}.search-wrap{order:3;max-width:none;flex-basis:100%}.header-links{gap:12px}.header-links a,.header-links button{font-size:10px}.header-links .create-link{padding:9px 11px}}
      `}
      </style>
    </header>
  );
}
