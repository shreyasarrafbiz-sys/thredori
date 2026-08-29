"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  trending: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  create: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
  messages: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M4 4h16v12H8l-4 4V4z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 5-6 7.5-6s6 2 7.5 6" strokeLinecap="round" />
    </svg>
  ),
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
    <nav className="sidebar">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`sidebar-item ${active ? "active" : ""}`}
            aria-label={item.label}
          >
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
          background: #fff;
          border-right: 1px solid var(--cotton-line);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 20px;
          gap: 6px;
          z-index: 20;
        }
        .sidebar-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 6px;
          border-radius: 10px;
          color: var(--muted);
          width: 60px;
        }
        .sidebar-item.active {
          color: var(--indigo);
          background: var(--cotton);
        }
        .icon {
          display: flex;
        }
        .label {
          font-size: 10px;
        }
        @media (max-width: 640px) {
          .sidebar {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
