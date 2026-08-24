"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function BrandCard({ brand, height, user }) {
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkSaved() {
      if (!user || !brand.isReal) return;
      const { data } = await supabase
        .from("saved_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("post_id", brand.id)
        .maybeSingle();
      setSaved(!!data);
    }
    checkSaved();
  }, [user, brand.id, brand.isReal]);

  async function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!brand.isReal) return;

    if (saved) {
      await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", brand.id);
      setSaved(false);
    } else {
      await supabase.from("saved_posts").insert({ user_id: user.id, post_id: brand.id });
      setSaved(true);
    }
  }

  const image = (
    <div
      className="brand-card-image"
      style={{
        height: height || 130,
        background: brand.color,
        backgroundImage: brand.image ? `url(${brand.image})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="hover-scrim">
        <button
          aria-label={saved ? `Unsave ${brand.name}` : `Save ${brand.name}`}
          className={`save-button ${saved ? "saved" : ""}`}
          onClick={handleSave}
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="brand-card">
      <div className="brand-card-hole" />
      {brand.isReal ? <Link href={`/post/${brand.id}`}>{image}</Link> : image}
      <div className="brand-card-name">{brand.name}</div>
      <div className="brand-card-note">{brand.note}</div>
      <div className="brand-card-footer">
        <span className="brand-card-location">{brand.location}</span>
      </div>

      <style jsx>{`
        .brand-card {
          break-inside: avoid;
          background: #fff;
          border-radius: 6px;
          margin-bottom: 12px;
          padding: 10px 10px 12px;
        }
        .brand-card-hole {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--cotton);
          border: 1px solid var(--cotton-line);
          margin: 0 auto 6px;
        }
        .brand-card-name {
          font-family: var(--font-voice);
          font-size: 14px;
          color: var(--ink);
        }
        .brand-card-note {
          font-size: 11px;
          color: var(--muted);
          margin: 2px 0 6px;
        }
        .brand-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand-card-location {
          font-size: 10px;
          background: var(--cotton);
          color: #6b5f4e;
          padding: 2px 8px;
          border-radius: 10px;
        }
      `}</style>

      <style jsx global>{`
        .brand-card-image {
          border-radius: 4px;
          margin-bottom: 8px;
          position: relative;
          overflow: hidden;
          display: block;
        }
        .hover-scrim {
          position: absolute;
          inset: 0;
          background: rgba(35, 32, 25, 0);
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          padding: 8px;
          transition: background 0.15s ease;
        }
        .brand-card-image:hover .hover-scrim {
          background: rgba(35, 32, 25, 0.15);
        }
        .save-button {
          background: var(--madder);
          color: var(--madder-text);
          font-size: 12px;
          font-weight: 600;
          border: none;
          border-radius: 18px;
          padding: 7px 14px;
          opacity: 0;
          transform: translateY(-4px);
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .save-button.saved {
          opacity: 1;
          transform: translateY(0);
          background: var(--indigo);
          color: var(--indigo-text);
        }
        .brand-card-image:hover .save-button {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
