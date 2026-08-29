export default function Header({ active, onChange, user, onLogout }) {
  const tabs = ["All", "Fashion", "Home"];

  return (
    <header>
      <div className="topbar">
        <div className="wordmark">thredori</div>
        <div className="search">Search labels, styles, makers...</div>
        {user ? (
          <button className="auth-link" onClick={onLogout}>
            Log out
          </button>
        ) : (
          <a className="auth-link" href="/login">
            Log in
          </a>
        )}
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab ${active === tab ? "tab-active" : ""}`}
            onClick={() => onChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <style jsx>{`
        header {
          border-bottom: 1px solid var(--cotton-line);
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .wordmark {
          font-family: var(--font-voice);
          font-style: italic;
          font-size: 20px;
        }
        .search {
          flex: 1;
          max-width: 320px;
          margin: 0 20px;
          background: #fff;
          border: 1px solid var(--cotton-line);
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 13px;
          color: var(--muted);
        }
        .auth-link {
          color: var(--ink);
          font-size: 13px;
          background: none;
          border: 1px solid var(--cotton-line);
          border-radius: 20px;
          padding: 6px 14px;
          white-space: nowrap;
        }
        .new-post-link {
          color: var(--indigo-text);
          background: var(--indigo);
          font-size: 13px;
          border-radius: 20px;
          padding: 6px 14px;
          white-space: nowrap;
        }
        .topbar {
          gap: 10px;
        }
        .tabs {
          display: flex;
          gap: 8px;
          padding: 0 20px 14px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .tab {
          background: #fff;
          color: #6b5f4e;
          font-size: 13px;
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid var(--cotton-line);
        }
        .tab-active {
          background: var(--indigo);
          color: var(--indigo-text);
          border-color: var(--indigo);
        }
      `}</style>
    </header>
  );
}
