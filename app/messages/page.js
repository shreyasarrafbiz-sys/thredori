"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const avatarEmoji = { flower: "🌸", smiley: "😊", heart: "💗", sun: "🌞", cloud: "☁️", star: "⭐" };

function Avatar({ profile, size = 48 }) {
  const fallback = avatarEmoji[profile?.avatar_seed] || "🌸";
  return profile?.avatar_url ? (
    <img className="avatar" style={{ width: size, height: size }} src={profile.avatar_url} alt="" />
  ) : (
    <div className="avatar avatar-fallback" style={{ width: size, height: size }} aria-hidden="true">{fallback}</div>
  );
}

export default function Messages() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
      if (!data.user) router.push("/login");
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    async function loadRequests() {
      const { data } = await supabase.from("connection_requests").select("id, sender_id, receiver_id, status").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      setRequests(data || []);
    }
    loadRequests();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      setMessage("");
      const term = query.trim();
      let request = supabase
        .from("profiles")
        .select("id, full_name, avatar_url, avatar_seed")
        .neq("id", user.id)
        .not("full_name", "is", null)
        .order("full_name", { ascending: true })
        .limit(50);

      if (term) {
        request = request.ilike("full_name", `%${term}%`);
      }

      const { data, error } = await request;
      if (error) {
        setProfiles([]);
        setMessage("People search needs the latest profiles setup in Supabase.");
      } else {
        setProfiles((data || []).filter((profile) => profile.full_name?.trim()));
      }
      setLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [query, user]);

  const requestByPerson = useMemo(() => {
    const map = new Map();
    requests.forEach((request) => {
      const other = request.sender_id === user?.id ? request.receiver_id : request.sender_id;
      map.set(other, request);
    });
    return map;
  }, [requests, user]);

  async function sendRequest(receiverId) {
    setMessage("");
    const existing = requestByPerson.get(receiverId);
    if (existing?.status === "pending" || existing?.status === "accepted") return;
    const { error } = await supabase.from("connection_requests").insert({ sender_id: user.id, receiver_id: receiverId });
    if (error) {
      if (error.code === "23505") setMessage("A connection request already exists.");
      else setMessage("Couldn't send the request yet. Check your Supabase setup.");
      return;
    }
    setRequests((prev) => [...prev, { sender_id: user.id, receiver_id: receiverId, status: "pending" }]);
  }

  async function respondToRequest(request, status) {
    const { error } = await supabase.from("connection_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", request.id).eq("receiver_id", user.id);
    if (!error) setRequests((prev) => prev.map((item) => item.id === request.id ? { ...item, status } : item));
  }

  if (checkingAuth || !user) return null;

  const incoming = requests.filter((r) => r.receiver_id === user.id && r.status === "pending");

  return (
    <main className="page">
      <section className="shell page-rise">
        <header className="header">
          <div>
            <p className="eyebrow">THREDORI CIRCLE</p>
            <h1>Find your people <span>♡</span></h1>
            <p className="subtitle">Search by a fellow Thredori member's full name and send a connection request.</p>
          </div>
        </header>

        {incoming.length > 0 && (
          <div className="requests-card">
            <div className="section-title">Connection requests <span>{incoming.length}</span></div>
            {incoming.map((request) => (
              <div className="request-row" key={request.id}>
                <div className="request-copy"><div className="avatar avatar-fallback small">♡</div><div><strong>Someone in your circle</strong><small>wants to connect with you</small></div></div>
                <div className="request-actions"><button onClick={() => respondToRequest(request, "accepted")}>Accept</button><button className="quiet" onClick={() => respondToRequest(request, "declined")}>Decline</button></div>
              </div>
            ))}
          </div>
        )}

        <div className="search-box">
          <span>⌕</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a fellow user's name..." aria-label="Search people by name" />
          {query && <button onClick={() => setQuery("")} aria-label="Clear search">×</button>}
        </div>

        {message && <p className="message">{message}</p>}
        {loading ? <p className="status">Finding lovely humans...</p> : profiles.length === 0 ? <p className="status">{query ? "No one found with that name yet." : "Search for a friend to get started."}</p> : (
          <div className="people-grid">
            {profiles.map((profile) => {
              const request = requestByPerson.get(profile.id);
              const state = request?.status === "accepted" ? "Connected" : request?.status === "pending" ? (request.sender_id === user.id ? "Requested" : "Respond") : null;
              return (
                <article className="person-card" key={profile.id}>
                  <Avatar profile={profile} size={62} />
                  <div className="person-name">{profile.full_name}</div>
                  <div className="handle">Thredori member</div>
                  {state === "Respond" ? <button className="connect" onClick={() => respondToRequest(request, "accepted")}>Accept request</button> : state ? <span className="connected">{state}</span> : <button className="connect" onClick={() => sendRequest(profile.id)}>♡ Connect</button>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <style jsx>{`
        .page { min-height: 100vh; padding: 54px 28px 80px; background: var(--blush); }
        .shell { width: min(920px, 100%); margin: 0 auto; }
        .header { margin-bottom: 24px; }
        .eyebrow { margin: 0 0 7px; font: 600 10px/1 var(--font-sans); letter-spacing: .16em; color: var(--madder); }
        h1 { margin: 0; font: 600 34px/1.08 var(--font-voice); color: var(--ink); }
        h1 span { color: var(--madder); font-size: .8em; }
        .subtitle { max-width: 540px; margin: 9px 0 0; font: 13px/1.55 var(--font-sans); color: var(--muted); }
        .search-box { display: flex; align-items: center; gap: 10px; background: rgba(255,253,252,.94); border: 1px solid var(--cotton-line); border-radius: 28px; padding: 8px 14px; box-shadow: var(--shadow-soft); margin-bottom: 18px; }
        .search-box > span { font-size: 23px; line-height: 1; color: var(--ink); }
        .search-box input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--ink); font: 13px var(--font-sans); }
        .search-box input::placeholder { color: #a79ba0; }
        .search-box button { border: 0; background: var(--blush-soft); color: var(--ink); width: 28px; height: 28px; border-radius: 50%; font-size: 18px; }
        .requests-card { background: rgba(255,253,252,.86); border: 1px solid var(--cotton-line); border-radius: 18px; padding: 14px; margin-bottom: 16px; box-shadow: var(--shadow-soft); }
        .section-title { font: 600 12px var(--font-sans); color: var(--ink); margin-bottom: 8px; }
        .section-title span { display: inline-grid; place-items: center; min-width: 20px; height: 20px; margin-left: 5px; border-radius: 50%; background: var(--blush-deep); font-size: 10px; }
        .request-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 9px; background: #fff; border-radius: 13px; }
        .request-copy { display: flex; align-items: center; gap: 10px; }
        .request-copy strong { display: block; font: 600 12px var(--font-sans); color: var(--ink); }
        .request-copy small { display: block; margin-top: 2px; font: 11px var(--font-sans); color: var(--muted); }
        .request-actions { display: flex; gap: 6px; }
        .request-actions button, .connect { border: 0; border-radius: 18px; padding: 7px 12px; background: var(--indigo); color: var(--indigo-text); font: 600 11px var(--font-sans); }
        .request-actions .quiet { background: var(--blush-soft); color: var(--ink); }
        .message { color: var(--madder); font: 12px var(--font-sans); }
        .status { padding: 30px 0; color: var(--muted); font: 13px var(--font-sans); }
        .people-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 14px; }
        .person-card { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 22px 14px 17px; background: rgba(255,253,252,.9); border: 1px solid var(--cotton-line); border-radius: 18px; box-shadow: var(--shadow-soft); transition: transform 180ms ease, box-shadow 180ms ease; }
        .person-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lift); }
        .avatar { border-radius: 50%; object-fit: cover; flex: 0 0 auto; }
        .avatar-fallback { display: grid; place-items: center; background: var(--blush-soft); border: 1px solid var(--cotton-line); font-size: 30px; }
        .avatar-fallback.small { width: 38px; height: 38px; font-size: 18px; }
        .person-name { margin-top: 10px; font: 600 14px var(--font-voice); color: var(--ink); }
        .handle { margin: 3px 0 12px; font: 10px var(--font-sans); color: var(--muted); }
        .connected { padding: 7px 12px; border-radius: 18px; background: var(--blush-soft); color: var(--muted); font: 600 11px var(--font-sans); }
        @media (max-width: 620px) { .page { padding: 30px 16px 90px; } h1 { font-size: 28px; } .request-row { align-items: flex-start; flex-direction: column; } }
      `}</style>
    </main>
  );
}
