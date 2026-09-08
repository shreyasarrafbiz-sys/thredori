export default function Header({ active, onChange, user, onLogout, searchValue = "", onSearch }) {
  const tabs = ["All", "Fashion", "Home"];

  return (
    <header>
      <div className="topbar">
        <div className="wordmark page-rise">thredori</div>
        <div className="search-wrap page-rise">
          <span className="search-icon" aria-hidden="true">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" strokeLinecap="round" /></svg>
          </span>
          <input className="search" value={searchValue} onChange={(e) => onSearch?.(e.target.value)} placeholder="Search labels, styles, makers..." aria-label="Search labels, styles, makers" />
          {searchValue && <button className="clear-search" onClick={() => onSearch?.("")} aria-label="Clear search">×</button>}
          <button className="mic-icon" type="button" aria-label="Voice search" onClick={() => onSearch?.("")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="3" width="8" height="12" rx="4" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" strokeLinecap="round" /></svg>
          </button>
        </div>
        {user ? <><a className="new-post-link" href="/new-post">+ New post</a><a className="auth-link" href="/profile">Profile</a><button className="auth-link" onClick={onLogout}>Log out</button></> : <a className="auth-link" href="/login">Log in</a>}
      </div>
      <div className="tabs page-rise">{tabs.map((tab) => <button key={tab} className={`tab ${active === tab ? "tab-active" : ""}`} onClick={() => onChange(tab)}>{tab}</button>)}</div>
      <style jsx>{`
        header { border-bottom:1px solid var(--cotton-line); background:rgba(252,247,246,.9); backdrop-filter:blur(12px); position:relative; z-index:10; }
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; max-width:1100px; margin:0 auto; gap:10px; }
        .wordmark { font-family:var(--font-voice); font-style:italic; font-size:20px; color:var(--ink); white-space:nowrap; }
        .search-wrap { flex:1; max-width:360px; min-width:220px; margin:0 20px; display:flex; align-items:center; gap:8px; padding:3px 6px 3px 12px; border-radius:28px; background:linear-gradient(180deg,#ffe9e8 0%,#f4cccc 100%); border:1px solid #e7babc; box-shadow:0 9px 22px rgba(138,97,104,.15),inset 0 1px 0 rgba(255,255,255,.75); transition:transform 220ms ease,box-shadow 220ms ease; }
        .search-wrap:hover,.search-wrap:focus-within { transform:translateY(-2px); box-shadow:0 13px 28px rgba(138,97,104,.2),inset 0 1px 0 rgba(255,255,255,.82); }
        .search-icon,.mic-icon { width:34px; height:34px; flex:0 0 34px; display:inline-flex; align-items:center; justify-content:center; color:var(--ink); border-radius:50%; background:rgba(255,255,255,.6); box-shadow:inset 0 1px 0 rgba(255,255,255,.8); }
        .search { flex:1; min-width:0; border:0; outline:0; background:rgba(255,253,252,.96); border-radius:18px; padding:9px 10px; font:13px var(--font-sans); color:var(--ink); box-shadow:inset 0 0 0 1px rgba(234,216,213,.6); }
        .search::placeholder { color:var(--muted); opacity:1; }
        .clear-search,.mic-icon { border:0; cursor:pointer; }
        .clear-search { width:24px; height:24px; flex:0 0 24px; border-radius:50%; background:rgba(255,255,255,.5); color:var(--muted); font-size:18px; line-height:1; }
        .auth-link,.new-post-link { transition:transform 200ms ease,box-shadow 200ms ease,background 200ms ease; }
        .auth-link { color:var(--ink); font-size:13px; background:rgba(255,253,252,.8); border:1px solid var(--cotton-line); border-radius:20px; padding:7px 14px; white-space:nowrap; box-shadow:0 4px 12px rgba(106,82,88,.05); cursor:pointer; }
        .auth-link:hover,.new-post-link:hover { transform:translateY(-2px); box-shadow:0 8px 18px rgba(106,82,88,.12); }
        .new-post-link { color:var(--indigo-text); background:var(--indigo); font-size:13px; border-radius:20px; padding:8px 15px; white-space:nowrap; box-shadow:0 6px 15px rgba(43,58,85,.18); }
        .tabs { display:flex; gap:8px; padding:0 20px 14px; max-width:1100px; margin:0 auto; }
        .tab { background:rgba(255,253,252,.9); color:var(--muted); font-size:13px; padding:7px 17px; border-radius:20px; border:1px solid var(--cotton-line); box-shadow:0 4px 10px rgba(106,82,88,.04); transition:transform 200ms ease,box-shadow 200ms ease,background 200ms ease; cursor:pointer; }
        .tab:hover { transform:translateY(-2px); box-shadow:0 7px 15px rgba(106,82,88,.1); }
        .tab-active { background:var(--indigo); color:var(--indigo-text); border-color:var(--indigo); box-shadow:0 7px 16px rgba(43,58,85,.18); }
        @media (max-width:760px) { .topbar { flex-wrap:wrap; } .search-wrap { order:3; width:100%; max-width:none; margin:0; } }
      `}</style>
    </header>
  );
}
