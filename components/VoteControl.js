"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function VoteControl({ postId, user, size = "normal" }) {
  const [score, setScore] = useState(0);
  const [myVote, setMyVote] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("votes").select("value").eq("post_id", postId);
      const total = (data || []).reduce((sum, v) => sum + v.value, 0);
      setScore(total);
    }
    load();
  }, [postId]);

  useEffect(() => {
    async function loadMine() {
      if (!user) {
        setMyVote(0);
        return;
      }
      const { data } = await supabase
        .from("votes")
        .select("value")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();
      setMyVote(data?.value || 0);
    }
    loadMine();
  }, [postId, user]);

  async function vote(direction, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }

    const newValue = myVote === direction ? 0 : direction;

    if (newValue === 0) {
      await supabase.from("votes").delete().eq("post_id", postId).eq("user_id", user.id);
      setScore((s) => s - direction);
    } else if (myVote === 0) {
      await supabase.from("votes").insert({ post_id: postId, user_id: user.id, value: newValue });
      setScore((s) => s + newValue);
    } else {
      await supabase
        .from("votes")
        .update({ value: newValue })
        .eq("post_id", postId)
        .eq("user_id", user.id);
      setScore((s) => s - myVote + newValue);
    }
    setMyVote(newValue);
  }

  return (
    <div className={`vote-control ${size}`}>
      <button
        aria-label="Upvote"
        className={myVote === 1 ? "arrow up active" : "arrow up"}
        onClick={(e) => vote(1, e)}
      >
        ▲
      </button>
      <span className="score">{score}</span>
      <button
        aria-label="Downvote"
        className={myVote === -1 ? "arrow down active" : "arrow down"}
        onClick={(e) => vote(-1, e)}
      >
        ▼
      </button>

      <style jsx>{`
        .vote-control {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #fff;
          border: 1px solid var(--cotton-line);
          border-radius: 16px;
          padding: 2px 8px;
          width: fit-content;
        }
        .vote-control.large {
          padding: 4px 10px;
          gap: 6px;
        }
        .arrow {
          background: none;
          border: none;
          font-size: 11px;
          color: var(--muted);
          padding: 2px;
          line-height: 1;
        }
        .vote-control.large .arrow {
          font-size: 14px;
        }
        .arrow.up.active {
          color: var(--madder);
        }
        .arrow.down.active {
          color: var(--indigo);
        }
        .score {
          font-size: 12px;
          font-weight: 600;
          color: var(--ink);
          min-width: 14px;
          text-align: center;
        }
        .vote-control.large .score {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
