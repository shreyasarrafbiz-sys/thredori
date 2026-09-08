"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("user");

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

      if (term) request = request.ilike("full_name", `%${term}%`);

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

  useEffect(() => {
    if (!user || !selectedId || selectedId === user.id) {
      if (selectedId === user?.id) router.replace("/messages");
      setSelectedProfile(null);
      setMessages([]);
      return;
    }

    async function loadChat() {
      setChatLoading(true);
      setMessage("");
      const [{ data: profileData, error: profileError }, { data: messageData, error: messageError }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, avatar_seed").eq("id", selectedId).maybeSingle(),
        supabase
          .from("direct_messages")
          .select("id, sender_id, receiver_id, body, created_at")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedId}),and(sender_id.eq.${selectedId},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true }),
      ]);

      if (profileError || !profileData) {
        setSelectedProfile(null);
        setMessage("We couldn't find that profile.");
      } else if (messageError) {
        setSelectedProfile(profileData);
        setMessages([]);
        setMessage("We couldn't load this conversation yet. Please check the direct_messages table and policies in Supabase.");
      } else {
        setSelectedProfile(profileData);
        setMessages(messageData || []);
      }
      setChatLoading(false);
    }

    loadChat();
  }, [user, selectedId, router]);

  useEffect(() => {
    if (!user || !selectedId) return;
    const channel = supabase
      .channel(`direct-messages-${user.id}-${selectedId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const row = payload.new;
          const belongsToChat =
            (row.sender_id === user.id && row.receiver_id === selectedId) ||
            (row.sender_id === selectedId && row.receiver_id === user.id);
          if (belongsToChat) setMessages((prev) => prev.some((item) => item.id === row.id) ? prev : [...prev, row]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedId]);

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
      setMessage(error.code === "23505" ? "A connection request already exists." : "Couldn't send the request yet. Check your Supabase setup.");
      return;
    }
    setRequests((prev) => [...prev, { sender_id: user.id, receiver_id: receiverId, status: "pending" }]);
  }

  async function respondToRequest(request, status) {
    const { error } = await supabase.from("connection_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", request.id).eq("receiver_id", user.id);
    if (!error) setRequests((prev) => prev.map((item) => item.id === request.id ? { ...item, status } : item));
  }

  async function sendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedProfile || sending) return;

    setSending(true);
    setMessage("");
    const optimisticId = `local-${Date.now()}`;
    const optimistic = { id: optimisticId, sender_id: user.id, receiver_id: selectedProfile.id, body, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({ sender_id: user.id, receiver_id: selectedProfile.id, body })
      .select("id, sender_id, receiver_id, body, created_at")
      .single();

    if (error) {
      setMessages((prev) => prev.filter((item) => item.id !== optimisticId));
      setDraft(body);
      setMessage("Your message couldn't be sent. Please check that the direct_messages policies are active in Supabase.");
    } else {
      setMessages((prev) => prev.map((item) => item.id === optimisticId ? data : item));
    }
    setSending(false);
  }

  if (checkingAuth || !user) return null;

  const incoming = requests.filter((r) => r.receiver_id === user.id && r.status === "pending");

  if (selectedId && selectedProfile) {
    return (
      <main className="page">
        <section className="chat-shell page-rise">
          <header className="chat-header">
            <Link href="/messages" className="back">← People</Link>
            <Link href={`/user/${selectedProfile.id}`} className="chat-person">
              <Avatar profile={selectedProfile} size={44} />
              <div><strong>{selectedProfile.full_name || "Thredori member"}</strong><small>Thredori circle</small></div>
            </Link>
            <span className="header-spacer" />
          </header>

          <div className="conversation">
            {chatLoading ? <p className="chat-status">Opening your little conversation...</p> : messages.length === 0 ? (
              <div className="empty-chat"><div className="empty-heart">♡</div><strong>Start the conversation</strong><span>Say hello to {selectedProfile.full_name?.split(" ")[0] || "your friend"}.</span></div>
            ) : (
              messages.map((item) => {
                const mine = item.sender_id === user.id;
                return <div key={item.id} className={`bubble-row ${mine ? "mine" : "theirs"}`}><div className="bubble">{item.body}<small>{new Date(item.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></div></div>;
              })
            )}
            <div className="bottom-anchor" />
          </div>

          {message && <p className="message chat-error">{message}</p>}
          <form className="composer" onSubmit={sendMessage}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${selectedProfile.full_name?.split(" ")[0] || "your friend"}...`} aria-label="Message" autoComplete="off" />
            <button type="submit" disabled={!draft.trim() || sending} aria-label="Send message">{sending ? "…" : "↑"}</button>
          </form>
        </section>

        <style jsx>{`
          .page { min-height:100vh; padding:24px 20px 88px; background:var(--blush); }
          .chat-shell { width:min(760px,100%); height:calc(100vh - 112px); min-height:520px; margin:0 auto; display:flex; flex-direction:column; overflow:hidden; background:rgba(255,253,252,.82); border:1px solid var(--cotton-line); border-radius:22px; box-shadow:var(--shadow-soft); }
          .chat-header { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:14px; padding:13px 16px; border-bottom:1px solid var(--cotton-line); background:rgba(255,253,252,.94); }
          .back { justify-self:start; font:600 11px var(--font-sans); color:var(--muted); }
          .chat-person { display:flex; align-items:center; gap:10px; color:var(--ink); }
          .chat-person strong { display:block; font:600 14px var(--font-voice); white-space:nowrap; }
          .chat-person small { display:block; margin-top:2px; font:10px var(--font-sans); color:var(--muted); }
          .header-spacer { min-width:45px; }
          .avatar { border-radius:50%; object-fit:cover; flex:0 0 auto; }
          .avatar-fallback { display:grid; place-items:center; background:var(--blush-soft); border:1px solid var(--cotton-line); font-size:22px; }
          .conversation { flex:1; overflow-y:auto; padding:22px 18px; scroll-behavior:smooth; }
          .chat-status { text-align:center; color:var(--muted); font:12px var(--font-sans); padding:30px; }
          .empty-chat { min-height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--muted); text-align:center; font-family:var(--font-sans); }
          .empty-chat strong { color:var(--ink); font:600 17px var(--font-voice); }
          .empty-chat span { margin-top:5px; font:11px var(--font-sans); }
          .empty-heart { width:52px; height:52px; display:grid; place-items:center; margin-bottom:10px; border-radius:50%; background:var(--blush-soft); color:var(--madder); font:32px var(--font-voice); }
          .bubble-row { display:flex; margin:7px 0; }
          .bubble-row.mine { justify-content:flex-end; }
          .bubble-row.theirs { justify-content:flex-start; }
          .bubble { max-width:min(74%,480px); padding:9px 12px 7px; border-radius:17px; background:#fff; border:1px solid var(--cotton-line); color:var(--ink); font:13px/1.45 var(--font-sans); box-shadow:0 4px 12px rgba(106,82,88,.06); white-space:pre-wrap; overflow-wrap:anywhere; }
          .mine .bubble { background:var(--indigo); color:var(--indigo-text); border-color:var(--indigo); border-bottom-right-radius:5px; }
          .theirs .bubble { border-bottom-left-radius:5px; }
          .bubble small { display:block; margin-top:4px; opacity:.58; font:9px var(--font-sans); text-align:right; }
          .chat-error { margin:0 16px 7px; }
          .message { color:var(--madder); font:11px var(--font-sans); }
          .composer { display:flex; gap:8px; padding:11px; border-top:1px solid var(--cotton-line); background:rgba(255,253,252,.96); }
          .composer input { flex:1; min-width:0; border:1px solid var(--cotton-line); outline:0; border-radius:22px; padding:11px 14px; background:#fff; color:var(--ink); font:13px var(--font-sans); }
          .composer input:focus { border-color:var(--blush-deep); box-shadow:0 0 0 3px rgba(242,201,202,.22); }
          .composer button { width:42px; height:42px; border:0; border-radius:50%; background:var(--indigo); color:var(--indigo-text); font:700 19px var(--font-sans); cursor:pointer; }
          .composer button:disabled { opacity:.45; cursor:not-allowed; }
          @media (max-width:620px) { .page { padding:0 0 64px; } .chat-shell { height:calc(100vh - 64px); min-height:0; border:0; border-radius:0; } .chat-header { grid-template-columns:auto 1fr auto; } .chat-person { justify-self:center; } .bubble { max-width:82%; } }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="shell page-rise">
        <header className="header">
          <div><p className="eyebrow">THREDORI CIRCLE</p><h1>Find your people <span>♡</span></h1><p className="subtitle">Search by a fellow Thredori member's full name, connect, and start a conversation.</p></div>
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

        <div className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a fellow user's name..." aria-label="Search people by name" />{query && <button onClick={() => setQuery("")} aria-label="Clear search">×</button>}</div>
        {message && <p className="message">{message}</p>}
        {loading ? <p className="status">Finding lovely humans...</p> : profiles.length === 0 ? <p className="status">{query ? "No one found with that name yet." : "Search for a friend to get started."}</p> : (
          <div className="people-grid">
            {profiles.map((profile) => {
              const request = requestByPerson.get(profile.id);
              const state = request?.status === "accepted" ? "Connected" : request?.status === "pending" ? (request.sender_id === user.id ? "Requested" : "Respond") : null;
              return (
                <article className="person-card" key={profile.id}>
                  <Link href={`/user/${profile.id}`} className="profile-link"><Avatar profile={profile} size={62} /><div className="person-name">{profile.full_name}</div><div className="handle">View profile</div></Link>
                  <div className="person-actions">
                    {state === "Respond" ? <button className="connect" onClick={() => respondToRequest(request, "accepted")}>Accept request</button> : state ? <Link className="message-link" href={`/messages?user=${profile.id}`}>♡ Message</Link> : <button className="connect" onClick={() => sendRequest(profile.id)}>♡ Connect</button>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <style jsx>{`
        .page { min-height:100vh; padding:54px 28px 80px; background:var(--blush); }
        .shell { width:min(920px,100%); margin:0 auto; }
        .header { margin-bottom:24px; }
        .eyebrow { margin:0 0 7px; font:600 10px/1 var(--font-sans); letter-spacing:.16em; color:var(--madder); }
        h1 { margin:0; font:600 34px/1.08 var(--font-voice); color:var(--ink); }
        h1 span { color:var(--madder); font-size:.8em; }
        .subtitle { max-width:540px; margin:9px 0 0; font:13px/1.55 var(--font-sans); color:var(--muted); }
        .search-box { display:flex; align-items:center; gap:10px; background:rgba(255,253,252,.94); border:1px solid var(--cotton-line); border-radius:28px; padding:8px 14px; box-shadow:var(--shadow-soft); margin-bottom:18px; }
        .search-box > span { font-size:23px; line-height:1; color:var(--ink); }
        .search-box input { flex:1; min-width:0; border:0; outline:0; background:transparent; color:var(--ink); font:13px var(--font-sans); }
        .search-box input::placeholder { color:#a79ba0; }
        .search-box button { border:0; background:var(--blush-soft); color:var(--ink); width:28px; height:28px; border-radius:50%; font-size:18px; }
        .requests-card { background:rgba(255,253,252,.86); border:1px solid var(--cotton-line); border-radius:18px; padding:14px; margin-bottom:16px; box-shadow:var(--shadow-soft); }
        .section-title { font:600 12px var(--font-sans); color:var(--ink); margin-bottom:8px; }
        .section-title span { display:inline-grid; place-items:center; min-width:20px; height:20px; margin-left:5px; border-radius:50%; background:var(--blush-deep); font-size:10px; }
        .request-row { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:9px; background:#fff; border-radius:13px; }
        .request-copy { display:flex; align-items:center; gap:10px; }
        .request-copy strong { display:block; font:600 12px var(--font-sans); color:var(--ink); }
        .request-copy small { display:block; margin-top:2px; font:11px var(--font-sans); color:var(--muted); }
        .request-actions { display:flex; gap:6px; }
        .request-actions button,.connect { border:0; border-radius:18px; padding:7px 12px; background:var(--indigo); color:var(--indigo-text); font:600 11px var(--font-sans); cursor:pointer; }
        .request-actions .quiet { background:var(--blush-soft); color:var(--ink); }
        .message { color:var(--madder); font:12px var(--font-sans); }
        .status { padding:30px 0; color:var(--muted); font:13px var(--font-sans); }
        .people-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:14px; }
        .person-card { display:flex; flex-direction:column; align-items:center; text-align:center; padding:22px 14px 17px; background:rgba(255,253,252,.9); border:1px solid var(--cotton-line); border-radius:18px; box-shadow:var(--shadow-soft); transition:transform 180ms ease,box-shadow 180ms ease; }
        .person-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-lift); }
        .avatar { border-radius:50%; object-fit:cover; flex:0 0 auto; }
        .avatar-fallback { display:grid; place-items:center; background:var(--blush-soft); border:1px solid var(--cotton-line); font-size:30px; }
        .avatar-fallback.small { width:38px; height:38px; font-size:18px; }
        .profile-link { display:flex; flex-direction:column; align-items:center; color:inherit; }
        .person-name { margin-top:10px; font:600 14px var(--font-voice); color:var(--ink); }
        .handle { margin:3px 0 12px; font:10px var(--font-sans); color:var(--muted); }
        .person-actions { min-height:30px; display:flex; align-items:center; justify-content:center; }
        .message-link { border-radius:18px; padding:7px 12px; background:var(--indigo); color:var(--indigo-text); font:600 11px var(--font-sans); }
        @media (max-width:620px) { .page { padding:30px 16px 90px; } h1 { font-size:28px; } .request-row { align-items:flex-start; flex-direction:column; } }
      `}</style>
    </main>
  );
}
