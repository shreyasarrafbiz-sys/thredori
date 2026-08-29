"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Messages() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
      if (!data.user) router.push("/login");
    });
  }, [router]);

  if (checkingAuth || !user) return null;

  return (
    <main className="page">
      <div className="card">
        <div className="wordmark">thredori</div>
        <h1>Messages</h1>
        <p>
          Chat isn't built yet — this is a placeholder so the icon has somewhere
          to go. Real messaging is coming in a future update.
        </p>
        <a href="/" className="back">
          ← Back to feed
        </a>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cotton);
        }
        .card {
          background: #fff;
          border-radius: 10px;
          padding: 32px;
          max-width: 340px;
          text-align: center;
        }
        .wordmark {
          font-family: var(--font-voice);
          font-style: italic;
          font-size: 19px;
          margin-bottom: 8px;
        }
        h1 {
          font-family: var(--font-voice);
          font-size: 20px;
          margin: 0 0 10px;
        }
        p {
          font-size: 13px;
          color: var(--muted);
          margin: 0 0 16px;
        }
        .back {
          font-size: 13px;
          color: var(--indigo);
        }
      `}</style>
    </main>
  );
}
