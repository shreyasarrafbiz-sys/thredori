"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import VoteControl from "./VoteControl";

export default function BrandCard({ brand, user }) {
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkSaved() {
      if (!user || !brand.isReal) return;
      const { data } = await supabase.from("saved_posts").select("*").eq("user_id", user.id).eq("post_id", brand.id).maybeSingle();
      setSaved(!!data);
    }
    checkSaved();
  }, [user, brand.id, brand.isReal]);

  async function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push("/login"); return; }
    if (!brand.isReal) return;
    if (saved) {
      await supabase.from("saved_posts").delete().eq("user_id", user.id).eq("post_id", brand.id);
      setSaved(false);
    } else {
      await supabase.from("saved_posts").insert({ user_id: user.id, post_id: brand.id });
      setSaved(true);
    }
  }

  const isTextOnlyThread = brand.isReal && brand.postType === "thread" && !brand.image;
  const media = brand.image ? (
    <div className="polaroid">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={brand.image} alt={brand.name} className="brand-photo" />
    </div>
  ) : brand.isReal ? null : (
    <div className="media-placeholder" style={{ background: brand.color, height: 150 }} />
  );

  return (
    <div className="brand-card">
      {media && (brand.isReal ? <Link href={`/post/${brand.id}`} className="media-link">{media}</Link> : media)}
      {isTextOnlyThread ? (
        <Link href={`/post/${brand.id}`} className="thread-link">
          <div className="thread-title">{brand.name}</div>
          {brand.note && <div className="thread-body">{brand.note}</div>}
        </Link>
      ) : (
        <>
          <div className="brand-card-name">{brand.name}</div>
          <div className="brand-card-note">{brand.note}</div>
          <div className="brand-card-footer"><span className="brand-card-location">{brand.location}</span></div>
        </>
      )}
      {brand.isReal && (
        <div className="action-row">
          <VoteControl postId={brand.id} user={user} />
          <Link href={`/post/${brand.id}`} className="comment-btn" aria-label="Open comments" title="Comments">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5c-1.2 0-2.34-.28-3.35-.78L4 20l1.78-4.9A7.47 7.47 0 0 1 5 11.5 7.5 7.5 0 1 1 20 11.5Z" />
            </svg>
          </Link>
          <button className={`action-btn save ${saved ? "saved" : ""}`} onClick={handleSave}>{saved ? "★ Saved" : "☆ Save"}</button>
          {brand.brandLink && (
            <a href={brand.brandLink} target="_blank" rel="noopener noreferrer" className="action-btn visit-link">
              Visit brand ↗
            </a>
          )}
        </div>
      )}

      <style jsx>{`
        .brand-card { break-inside:avoid; background:rgba(255,253,252,.96); border:1px solid rgba(234,216,213,.9); border-radius:13px; margin-bottom:14px; padding:10px 10px 12px; box-shadow:var(--shadow-soft); animation:softRise 560ms ease-out both; transition:transform 240ms ease,box-shadow 240ms ease; }
        .brand-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-lift); }
        .brand-card-name,.thread-title { font-family:var(--font-voice); color:var(--ink); }
        .brand-card-name { font-size:14px; margin-top:4px; }
        .brand-card-note { font-size:11px; color:var(--muted); margin:2px 0 6px; }
        .brand-card-footer { display:flex; justify-content:space-between; align-items:center; }
        .brand-card-location { font-size:10px; background:var(--blush-soft); color:var(--muted); padding:3px 9px; border-radius:10px; }
        .thread-title { font-size:16px; margin:4px 0; }
        .thread-body { font-size:12px; color:var(--muted); margin-bottom:6px; line-height:1.4; }
        .action-row { display:flex; align-items:center; gap:6px; margin-top:8px; flex-wrap:wrap; }
        .comment-btn { width:28px; height:28px; flex:0 0 28px; display:inline-flex; align-items:center; justify-content:center; border:1px solid var(--cotton-line); border-radius:50%; background:#fffdfc; color:var(--ink); font-size:15px; text-decoration:none; transition:transform 180ms ease,box-shadow 180ms ease,color 180ms ease,background 180ms ease; }
        .comment-btn:hover { transform:translateY(-2px); box-shadow:0 6px 14px rgba(106,82,88,.1); background:var(--blush-soft); color:var(--madder); }
        .action-btn { background:#fffdfc; border:1px solid var(--cotton-line); border-radius:16px; padding:5px 10px; font-size:11px; color:var(--muted); white-space:nowrap; display:inline-flex; align-items:center; gap:4px; transition:transform 180ms ease,box-shadow 180ms ease,color 180ms ease,background 180ms ease; }
        .action-btn:hover { transform:translateY(-2px); box-shadow:0 6px 14px rgba(106,82,88,.1); background:var(--blush-soft); color:var(--ink); }
        .action-btn.save.saved { color:var(--madder); border-color:var(--blush-deep); background:var(--blush-soft); }
        .visit-link { color:var(--indigo); text-decoration:none; }
      `}</style>
      <style jsx global>{`
        .media-link,.thread-link { display:block; }
        .polaroid { background:#fff; padding:7px 7px 20px; border:1px solid var(--cotton-line); border-radius:9px; box-shadow:0 5px 15px rgba(35,32,25,.08); margin-bottom:8px; overflow:hidden; }
        .brand-photo { display:block; width:100%; height:auto; transition:transform 450ms ease; }
        .brand-card:hover .brand-photo { transform:scale(1.015); }
        .media-placeholder { width:100%; border-radius:8px; margin-bottom:8px; }
      `}</style>
    </div>
  );
}
