"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      router.push("/");
    }
  }

  return (
    <main className="auth-page">
      <form onSubmit={handleLogin} className="auth-card">
        <div className="wordmark">thredori</div>
        <h1>Log in</h1>

        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        {message && <p className="message">{message}</p>}

        <p className="switch">
          No account yet? <a href="/signup">Sign up</a>
        </p>
      </form>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cotton);
        }
        .auth-card {
          background: #fff;
          border-radius: 10px;
          padding: 32px;
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .wordmark {
          font-family: var(--font-voice);
          font-style: italic;
          font-size: 20px;
          text-align: center;
          margin-bottom: 4px;
        }
        h1 {
          font-family: var(--font-voice);
          font-size: 18px;
          font-weight: 500;
          text-align: center;
          margin: 0 0 12px;
        }
        label {
          font-size: 13px;
          color: var(--muted);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        input {
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid var(--cotton-line);
          font-size: 14px;
          font-family: var(--font-sans);
        }
        button {
          margin-top: 8px;
          background: var(--indigo);
          color: var(--indigo-text);
          border: none;
          border-radius: 20px;
          padding: 10px;
          font-size: 14px;
        }
        button:disabled {
          opacity: 0.6;
        }
        .message {
          font-size: 13px;
          color: var(--madder);
          text-align: center;
          margin: 0;
        }
        .switch {
          font-size: 13px;
          text-align: center;
          color: var(--muted);
          margin: 8px 0 0;
        }
        .switch a {
          color: var(--indigo);
        }
      `}</style>
    </main>
  );
}
