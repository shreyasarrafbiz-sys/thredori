"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const avatarEmoji = { flower: "🌸", smiley: "😊", heart: "💗", sun: "🌞", cloud: "☁️", star: "⭐" };

function Avatar({ profile, size = 48 }) {
  const fallback = avatarEmoji[profile?.avatar_seed] || "🌸";
  return profile?.avatar_url ? <img className="avatar" style={{ width: size, height: size }} src={profile.avatar_url} alt="" /> : <div className="avatar avatar-fallback" style={{ width: size, height: size }}>{fallback}</div>;
}

export default function Messages() {
  const [user, setUser] = useState(null), [checkingAuth, setCheckingAuth] = useState(true), [query, setQuery] = useState(""), [profiles, setProfiles] = useState([]), [requests, setRequests] = useState([]), [selectedId, setSelectedId] = useState(null), [selectedProfile, setSelectedProfile] = useState(null), [messages, setMessages] = useState([]), [draft, setDraft] = useState(""), [loading, setLoading] = useState(false), [chatLoading, setChatLoading] = useState(false), [sending, setSending] = useState(false), [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => { supabase.auth.getUser().then(({ data }) => { setUser(data.user); setCheckingAuth(false); if (!data.user) router.push("/login"); }); }, [router]);

  useEffect(() => { const read = () => setSelectedId(new URLSearchParams(window.location.search).get("user")); read(); window.addEventListener("popstate", read); return () => window.removeEventListener("popstate", read); }, []);

  useEffect(() => { if (!user) return; supabase.from("connection_requests").select("id, sender_id, receiver_id, status").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).then(({ data }) => setRequests(data || [])); }, [user]);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      const term = query.trim();
      let request = supabase.from("profiles").select("id, full_name, avatar_url, avatar_seed").neq("id", user.id).not("full_name", "is", null).order("full_name").limit(50);
      if (term) request = request.ilike("full_name", `%${term}%`);
      const { data, error } = await request;
      setProfiles(error ? [] : (data || []).filter((p) => p.full_name?.trim()));
      if (error) setMessage("People search needs the latest profiles setup in Supabase.");
      setLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [query, user]);

  useEffect(() => {
    if (!user || !selectedId || selectedId === user.id) return;
    async function loadChat() {
      setChatLoading(true); setMessage("");
      const [{ data: profileData, error: profileError }, { data: messageData, error: messageError }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, avatar_seed").eq("id", selectedId).maybeSingle(),
        supabase.from("direct_messages").select("id, sender_id, receiver_id, body, created_at").or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedId}),and(sender_id.eq.${selectedId},receiver_id.eq.${user.id})`).order("created_at", { ascending: true })
      ]);
      setSelectedProfile(profileData || null); setMessages(messageError ? [] : (messageData || []));
      if (profileError || !profileData) setMessage("We couldn't find that profile."); else if (messageError) setMessage("We couldn't load this conversation yet. Check the direct_messages policies in Supabase.");
      setChatLoading(false);
    }
    loadChat();
  }, [user, selectedId]);

  useEffect(() => {
    if (!user || !selectedId) return;
    const channel = supabase.channel(`dm-${user.id}-${selectedId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, ({ new: row }) => {
      if ((row.sender_id === user.id && row.receiver_id === selectedId) || (row.sender_id === selectedId && row.receiver_id === user.id)) setMessages((prev) => prev.some((m) => m.id === row.id) ? prev : [...prev, row]);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedId]);

  const requestByPerson = useMemo(() => { const map = new Map(); requests.forEach((r) => map.set(r.sender_id === user?.id ? r.receiver_id : r.sender_id, r)); return map; }, [requests, user]);

  async function sendRequest(receiverId) {
    const existing = requestByPerson.get(receiverId); if (existing?.status === "pending" || existing?.status === "accepted") return;
    const { error } = await supabase.from("connection_requests").insert({ sender_id: user.id, receiver_id: receiverId });
    if (error) setMessage(error.code === "23505" ? "A connection request already exists." : "Couldn't send the request yet."); else setRequests((prev) => [...prev, { sender_id: user.id, receiver_id: receiverId, status: "pending" }]);
  }

  async function respondToRequest(request, status) {
    const { error } = await supabase.from("connection_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", request.id).eq("receiver_id", user.id);
    if (!error) setRequests((prev) => prev.map((r) => r.id === request.id ? { ...r, status } : r));
  }

  async function sendMessage(e) {
    e.preventDefault(); const body = draft.trim(); if (!body || !selectedProfile || sending) return;
    setSending(true); const optimisticId = `local-${Date.now()}`;
    setMessages((prev) => [...prev, { id: optimisticId, sender_id: user.id, receiver_id: selectedProfile.id, body, created_at: new Date().toISOString() }]); setDraft("");
    const { data, error } = await supabase.from("direct_messages").insert({ sender_id: user.id, receiver_id: selectedProfile.id, body }).select("id, sender_id, receiver_id, body, created_at").single();
    if (error) { setMessages((prev) => prev.filter((m) => m.id !== optimisticId)); setDraft(body); setMessage("Your message couldn't be sent. Please check the direct_messages policies in Supabase."); } else setMessages((prev) => prev.map((m) => m.id === optimisticId ? data : m));
    setSending(false);
  }

  if (checkingAuth || !user) return null;
  const incoming = requests.filter((r) => r.receiver_id === user.id && r.status === "pending");

  if (selectedId && selectedProfile) return (
    <main className="page"><section className="chat-shell">
      <header className="chat-header"><a href="/messages" className="back">← People</a><a href={`/user/${selectedProfile.id}`} className="chat-person"><Avatar profile={selectedProfile} size={44}/><div><strong>{selectedProfile.full_name || "Thredori member"}</strong><small>Thredori circle</small></div></a><span/></header>
      <div className="conversation">{chatLoading ? <p className="status">Opening your conversation...</p> : messages.length === 0 ? <div className="empty-chat"><div>♡</div><strong>Start the conversation</strong><span>Say hello to {selectedProfile.full_name?.split(" ")[0] || "your friend"}.</span></div> : messages.map((m) => { const mine = m.sender_id === user.id; return <div key={m.id} className={`bubble-row ${mine ? "mine" : "theirs"}`}><div className="bubble">{m.body}<small>{new Date(m.created_at).toLocaleTimeString([], { hour:"numeric", minute:"2-digit" })}</small></div></div>; })}</div>
      {message && <p className="message">{message}</p>}
      <form className="composer" onSubmit={sendMessage}><input value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder={`Message ${selectedProfile.full_name?.split(" ")[0] || "your friend"}...`} autoComplete="off"/><button disabled={!draft.trim() || sending}>{sending ? "…" : "↑"}</button></form>
    </section>
    <style jsx>{` .page{min-height:100vh;padding:24px 20px 88px;background:var(--blush)} .chat-shell{width:min(760px,100%);height:calc(100vh - 112px);min-height:520px;margin:auto;display:flex;flex-direction:column;overflow:hidden;background:rgba(255,253,252,.9);border:1px solid var(--cotton-line);border-radius:22px;box-shadow:var(--shadow-soft)} .chat-header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:13px 16px;border-bottom:1px solid var(--cotton-line);background:rgba(255,253,252,.96)} .back{font:600 11px var(--font-sans);color:var(--muted)} .chat-person{display:flex;align-items:center;gap:10px;color:var(--ink)} .chat-person strong{display:block;font:600 14px var(--font-voice)} .chat-person small{display:block;font:10px var(--font-sans);color:var(--muted)} .avatar{border-radius:50%;object-fit:cover}.avatar-fallback{display:grid;place-items:center;background:var(--blush-soft);border:1px solid var(--cotton-line);font-size:22px}.conversation{flex:1;overflow-y:auto;padding:22px 18px}.status{text-align:center;color:var(--muted);font:12px var(--font-sans)}.empty-chat{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--muted);text-align:center;font:11px var(--font-sans)}.empty-chat div{font:32px var(--font-voice);color:var(--madder);margin-bottom:10px}.empty-chat strong{font:600 17px var(--font-voice);color:var(--ink)}.bubble-row{display:flex;margin:7px 0}.mine{justify-content:flex-end}.theirs{justify-content:flex-start}.bubble{max-width:74%;padding:9px 12px;border-radius:17px;background:#fff;border:1px solid var(--cotton-line);color:var(--ink);font:13px/1.45 var(--font-sans);white-space:pre-wrap;overflow-wrap:anywhere}.mine .bubble{background:var(--indigo);color:var(--indigo-text);border-color:var(--indigo);border-bottom-right-radius:5px}.theirs .bubble{border-bottom-left-radius:5px}.bubble small{display:block;margin-top:4px;opacity:.58;font:9px var(--font-sans);text-align:right}.message{margin:6px 14px;color:var(--madder);font:11px var(--font-sans)}.composer{display:flex;gap:8px;padding:11px;border-top:1px solid var(--cotton-line);background:rgba(255,253,252,.96)}.composer input{flex:1;border:1px solid var(--cotton-line);outline:0;border-radius:22px;padding:11px 14px;font:13px var(--font-sans)}.composer button{width:42px;height:42px;border:0;border-radius:50%;background:var(--indigo);color:var(--indigo-text);font-size:19px}.composer button:disabled{opacity:.45}@media(max-width:620px){.page{padding:0 0 64px}.chat-shell{height:calc(100vh - 64px);min-height:0;border:0;border-radius:0}.chat-header{grid-template-columns:auto 1fr auto}.chat-person{justify-self:center}.bubble{max-width:82%}} `}</style>
    </main>
  );

  return (
    <main className="page"><section className="shell">
      <header className="header"><p className="eyebrow">THREDORI CIRCLE</p><h1>Find your people <span>♡</span></h1><p className="subtitle">Search by a fellow Thredori member's full name, connect, and start a conversation.</p></header>
      {incoming.length > 0 && <div className="requests-card"><div className="section-title">Connection requests <span>{incoming.length}</span></div>{incoming.map((r)=><div className="request-row" key={r.id}><div>Someone in your circle wants to connect with you</div><div className="request-actions"><button onClick={()=>respondToRequest(r,"accepted")}>Accept</button><button onClick={()=>respondToRequest(r,"declined")}>Decline</button></div></div>)}</div>}
      <div className="search-box"><span>⌕</span><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search a fellow user's name..."/>{query&&<button onClick={()=>setQuery("")}>×</button>}</div>
      {message&&<p className="message">{message}</p>}{loading?<p className="status">Finding lovely humans...</p>:profiles.length===0?<p className="status">{query?"No one found with that name yet.":"Search for a friend to get started."}</p>:<div className="people-grid">{profiles.map((p)=>{const r=requestByPerson.get(p.id);const state=r?.status;return <article className="person-card" key={p.id}><a href={`/user/${p.id}`} className="profile-link"><Avatar profile={p} size={62}/><div className="person-name">{p.full_name}</div><div className="handle">Thredori member</div></a>{state==="accepted"?<a className="message-link" href={`/messages?user=${p.id}`}>♡ Message</a>:state==="pending"?<span className="connected">Requested</span>:<button className="connect" onClick={()=>sendRequest(p.id)}>♡ Connect</button>}</article>})}</div>}
    </section><style jsx>{` .page{min-height:100vh;padding:54px 28px 80px;background:var(--blush)}.shell{width:min(920px,100%);margin:auto}.header{margin-bottom:24px}.eyebrow{font:600 10px var(--font-sans);letter-spacing:.16em;color:var(--madder)}h1{margin:0;font:600 34px/1.08 var(--font-voice);color:var(--ink)}h1 span{color:var(--madder)}.subtitle{max-width:540px;font:13px/1.55 var(--font-sans);color:var(--muted)}.search-box{display:flex;align-items:center;gap:10px;background:rgba(255,253,252,.94);border:1px solid var(--cotton-line);border-radius:28px;padding:8px 14px;box-shadow:var(--shadow-soft);margin-bottom:18px}.search-box input{flex:1;border:0;outline:0;background:transparent;font:13px var(--font-sans)}.search-box button{border:0;background:var(--blush-soft);border-radius:50%;width:28px;height:28px}.requests-card{padding:14px;margin-bottom:16px;background:#fff;border:1px solid var(--cotton-line);border-radius:18px}.section-title{font:600 12px var(--font-sans);margin-bottom:8px}.section-title span{margin-left:5px}.request-row{display:flex;justify-content:space-between;gap:12px;padding:10px;border-radius:12px;background:var(--blush-soft);font:11px var(--font-sans)}.request-actions{display:flex;gap:6px}.request-actions button,.connect,.message-link{border:0;border-radius:18px;padding:7px 12px;background:var(--indigo);color:var(--indigo-text);font:600 11px var(--font-sans);text-decoration:none}.request-actions button+button{background:#fff;color:var(--ink)}.message{color:var(--madder);font:12px var(--font-sans)}.status{padding:30px 0;color:var(--muted);font:13px var(--font-sans)}.people-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}.person-card{display:flex;flex-direction:column;align-items:center;text-align:center;padding:22px 14px 17px;background:rgba(255,253,252,.9);border:1px solid var(--cotton-line);border-radius:18px;box-shadow:var(--shadow-soft)}.profile-link{display:flex;flex-direction:column;align-items:center;color:inherit}.avatar{border-radius:50%;object-fit:cover}.avatar-fallback{display:grid;place-items:center;background:var(--blush-soft);border:1px solid var(--cotton-line);font-size:30px}.person-name{margin-top:10px;font:600 14px var(--font-voice);color:var(--ink)}.handle{margin:3px 0 12px;font:10px var(--font-sans);color:var(--muted)}.connected{padding:7px 12px;border-radius:18px;background:var(--blush-soft);font:600 11px var(--font-sans);color:var(--muted)}@media(max-width:620px){.page{padding:30px 16px 90px}h1{font-size:28px}.request-row{flex-direction:column}} `}</style></main>
  );
}
