"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = {
  home: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  trending: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 7h6v6" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  create: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>),
  messages: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16v12H8l-4 4V4z" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  profile: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c1.5-4 5-6 7.5-6s6 2 7.5 6" strokeLinecap="round" /></svg>),
};

const items = [
  { key: "home", label: "Home", href: "/" },
  { key: "trending", label: "Trending", href: "/trending" },
  { key: "create", label: "Create", href: "/new-post" },
  { key: "messages", label: "Messages", href: "/messages" },
  { key: "profile", label: "Profile", href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar-bloom" aria-hidden="true">✿</div>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.key} href={item.href} className={`sidebar-item ${active ? "active" : ""}`} aria-label={item.label}>
            <span className="icon">{icons[item.key]}</span>
            <span className="label">{item.label}</span>
          </Link>
        );
      })}

      <style jsx>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 76px;
          background: rgba(255, 250, 249, 0.88);
          backdrop-filter: blur(12px);
          border-right: 1px solid var(--cotton-line);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 14px;
          gap: 6px;
          z-index: 20;
          box-shadow: 4px 0 22px rgba(106, 82, 88, 0.05);
        }
        .sidebar-bloom {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          margin-bottom: 5px;
          color: var(--madder);
          background: var(--blush-soft);
          box-shadow: var(--shadow-soft);
          animation: floatSoft 5s ease-in-out infinite;
          font-size: 19px;
        }
        .sidebar-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 9px 6px;
          border-radius: 14px;
          color: var(--muted);
          width: 62px;
          transition: transform 200ms ease, color 200ms ease, background 200ms ease, box-shadow 200ms ease;
        }
        .sidebar-item:hover {
          transform: translateY(-3px);
          color: var(--ink);
          background: var(--blush-soft);
          box-shadow: 0 8px 18px rgba(106, 82, 88, 0.09);
        }
        .sidebar-item.active {
          color: var(--indigo);
          background: var(--blush);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 6px 15px rgba(106,82,88,.08);
        }
        .icon { display: flex; }
        .label { font-size: 10px; }

        @media (max-width: 640px) {
          .sidebar {
            top: auto;
            bottom: 0;
            left: 0;
            width: 100%;
            height: calc(64px + env(safe-area-inset-bottom));
            padding: 5px 8px env(safe-area-inset-bottom);
            flex-direction: row;
            justify-content: space-around;
            align-items: stretch;
            gap: 2px;
            background: rgba(255, 253, 252, 0.94);
            border-right: 0;
            border-top: 1px solid var(--cotton-line);
            box-shadow: 0 -8px 24px rgba(106, 82, 88, 0.08);
          }
          .sidebar-bloom { display: none; }
          .sidebar-item {
            width: 20%;
            max-width: 82px;
            padding: 5px 3px;
            gap: 2px;
            border-radius: 12px;
            justify-content: center;
          }
          .sidebar-item:hover { transform: none; }
          .sidebar-item.active { box-shadow: none; }
          .icon svg { width: 21px; height: 21px; }
          .label { font-size: 9px; }
        }
      `}</style>
    </nav>
  );
}
