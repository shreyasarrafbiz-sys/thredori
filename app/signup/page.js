"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email to confirm your account, then log in.");
    }
  }

  async function handleGoogleSignUp() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  }

  return (
    <main className="auth-page">
      <form onSubmit={handleSignUp} className="auth-card">
        <div className="wordmark">thredori</div>
        <h1>Create your account</h1>

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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>

        {message && <p className="message">{message}</p>}

        <div className="divider">
          <span>or</span>
        </div>

        <button type="button" className="google-btn" onClick={handleGoogleSignUp}>
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 6.1 29.5 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.4l-6.3-5.3C29.4 35 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.3C40.9 36.6 44 30.8 44 24c0-1.4-.1-2.7-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <p className="switch">
          Already have an account? <a href="/login">Log in</a>
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
        .divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 4px 0;
        }
        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--cotton-line);
        }
        .divider span {
          font-size: 12px;
          color: var(--muted);
        }
        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #fff;
          color: var(--ink);
          border: 1px solid var(--cotton-line);
          border-radius: 20px;
          padding: 10px;
          font-size: 14px;
        }
      `}</style>
    </main>
  );
}
