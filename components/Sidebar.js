"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = {
  home: <svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>,
  trending: <svg viewBox="0 0 24 24"><path d="M3 17 9 11l4 4 8-9M15 6h6v6"/></svg>,
  create: <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  messages: <svg viewBox="0 0 24 24"><path d="M4 4h16v12H8l-4 4z"/></svg>,
  profile: <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.5-4 5-6 7.5-6s6 2 7.5 6"/></svg>,
  policies: <svg viewBox="0 0 24 24"><path d="M7 3h10l3 3v15H4V3zM8 10h8M8 14h8M8 18h5"/></svg>,
};
const items = [
  {key:"home",label:"Home",href:"/"},{key:"trending",label:"Trending",href:"/trending"},
  {key:"create",label:"Create",href:"/new-post"},{key:"messages",label:"Messages",href:"/messages"},
  {key:"profile",label:"Profile",href:"/profile"},{key:"policies",label:"Guidelines",href:"/policies",desktopOnly:true},
];

export default function Sidebar(){
  const pathname=usePathname();
  return <nav className="sidebar" aria-label="Main navigation">
    <Link href="/" className="sidebar-mark" aria-label="Thredori home">t.</Link>
    <div className="sidebar-items">{items.map(item=>{
      const active=item.href==="/" ? pathname==="/" : pathname===item.href || pathname.startsWith(item.href+"/");
      return <Link key={item.key} href={item.href} className={`sidebar-item ${active?"active":""} ${item.desktopOnly?"desktop-only":""}`} aria-label={item.label} title={item.label}><span className="icon">{icons[item.key]}</span><span className="label">{item.label}</span></Link>;
    })}</div>
    <style jsx>{`
      .sidebar{position:fixed;inset:0 auto 0 0;width:76px;background:#fff;border-right:1px solid var(--line);display:flex;flex-direction:column;align-items:center;padding:16px 7px;z-index:40}.sidebar-mark{display:grid;place-items:center;width:38px;height:38px;border:1px solid var(--line-strong);border-radius:50%;font:italic 23px var(--font-editorial);color:var(--accent);margin-bottom:28px}.sidebar-items{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}.sidebar-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;width:60px;min-height:58px;border-radius:4px;color:var(--muted);transition:background .18s,color .18s}.sidebar-item:hover,.sidebar-item.active{background:var(--sand-soft);color:var(--ink)}.sidebar-item.active{box-shadow:inset 2px 0 var(--accent)}.icon{display:flex}.icon :global(svg){width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}.label{font-size:9px;font-weight:600}.desktop-only{margin-top:10px}
      @media(max-width:640px){.sidebar{inset:auto 0 0;width:100%;height:calc(62px + env(safe-area-inset-bottom));padding:4px 8px env(safe-area-inset-bottom);border-right:0;border-top:1px solid var(--line);flex-direction:row;justify-content:center}.sidebar-mark,.desktop-only{display:none}.sidebar-items{flex-direction:row;justify-content:space-around;gap:0}.sidebar-item{width:20%;max-width:86px;min-height:50px;gap:3px}.sidebar-item.active{box-shadow:inset 0 2px var(--accent)}.icon :global(svg){width:20px;height:20px}}
    `}
    </style>
  </nav>;
}
