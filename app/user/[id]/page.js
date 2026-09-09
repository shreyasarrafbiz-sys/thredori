"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

const avatarEmoji = { flower: "🌸", smiley: "😊", heart: "💗", sun: "🌞", cloud: "☁️", star: "⭐" };

function Avatar({ profile, size = 72 }) {
  const fallback = avatarEmoji[profile?.avatar_seed] || "🌸";
  return profile?.avatar_url ? (
    <img className="avatar" style={{ width: size, height: size }} src={profile.avatar_url} alt="" />
  ) : (
    <div className="avatar avatar-fallback" style={{ width: size, height: size }} aria-hidden="true">{fallback}</div>
  );
}

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user) router.push("/login");
    });
  }, [router]);

  useEffect(() => {
    if (!user || !id) return;
    if (user.id === id) {
      router.replace("/profile");
      return;
    }

    async function load() {
      setLoading(true);
      const [{ data: profileData, error: profileError }, { data: followData }, { data: postsData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, avatar_url, avatar_seed").eq("id", id).maybeSingle(),
        supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", id).maybeSingle(),
        supabase.from("posts").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      ]);

      if (profileError || !profileData) {
        setError("We couldn't find that Thredori profile.");
      } else {
        setProfile(profileData);
        const following = Boolean(followData);
        setIsFollowing(following);
        setPosts(following ? postsData || [] : []);
      }
      setLoading(false);
    }

    load();
  }, [user, id, router]);

  async function toggleFollow() {
    if (!user || !id || followLoading) return;
    setFollowLoading(true);

    if (isFollowing) {
      const { error: unfollowError } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", id);

      if (!unfollowError) {
        setIsFollowing(false);
        setPosts([]);
      }
    } else {
      const { error: followError } = await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: id,
      });

      if (!followError) {
        setIsFollowing(true);
        const { data: postsData } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false });
        setPosts(postsData || []);
      }
    }

    setFollowLoading(false);
  }

  if (!user || loading) return null;

  if (error) {
    return (
      <main className="page"><section className="empty"><p>{error}</p><Link href="/messages">Back to people</Link></section></main>
    );
  }

  return (
    <main className="page">
      <section className="shell page-rise">
        <div className="topbar">
          <Link href="/" className="wordmark">thredori</Link>
          <Link href="/messages" className="back">← People</Link>
        </div>

        <header className="profile-header">
          <div className="identity">
            <Avatar profile={profile} size={82} />
            <div>
              <p className="eyebrow">THREDORI MEMBER</p>
              <h1>{profile.full_name || "Thredori member"}</h1>
              {isFollowing && profile.username && <p className="username">@{profile.username}</p>}
              {isFollowing && <p className="subtitle">A little corner of their Thredori world.</p>}
            </div>
          </div>

          <div className="actions">
            <button className={isFollowing ? "follow-button following" : "follow-button"} onClick={toggleFollow} disabled={followLoading}>
              {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </button>
            {isFollowing && <Link href={`/messages?user=${profile.id}`} className="message-button">♡ Message</Link>}
          </div>
        </header>

        {isFollowing ? (
          <>
            <div className="section-heading">Their posts <span>{posts.length}</span></div>
            {posts.length === 0 ? <p className="status">No posts here yet.</p> : (
              <div className="grid">
                {posts.map((post, index) => (
                  <Link href={`/post/${post.id}`} key={post.id} className="card page-rise" style={{ "--delay": `${Math.min(index * 45, 360)}ms` }}>
                    <div className="card-image" style={{ backgroundImage: post.image_url ? `url(${post.image_url})` : undefined, backgroundColor: post.image_url ? undefined : "#c7a9a6" }} />
                    <div className="card-body">
                      <div className="card-name">{post.brand_name}</div>
                      <div className="card-note">{post.note}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <section className="private-profile">
            <div className="private-icon">🔒</div>
            <h2>Follow to see more</h2>
            <p>Follow {profile.full_name || "this member"} to see their posts and full Thredori profile.</p>
            <button className="large-follow" onClick={toggleFollow} disabled={followLoading}>
              {followLoading ? "Following..." : "Follow"}
            </button>
          </section>
        )}
      </section>

      <style jsx>{`
        .page { min-height:100vh; padding:28px 28px 80px; background:var(--blush); }
        .shell { width:min(1100px,100%); margin:0 auto; }
        .topbar { display:flex; align-items:center; justify-content:space-between; padding-bottom:15px; border-bottom:1px solid var(--cotton-line); }
        .wordmark { font:italic 20px/1 var(--font-voice); color:var(--ink); }
        .back { font:600 12px var(--font-sans); color:var(--muted); }
        .profile-header { display:flex; align-items:center; justify-content:space-between; gap:25px; padding:30px 0 32px; }
        .identity { display:flex; align-items:center; gap:16px; }
        .avatar { border-radius:50%; object-fit:cover; flex:0 0 auto; border:1px solid var(--cotton-line); box-shadow:var(--shadow-soft); }
        .avatar-fallback { display:grid; place-items:center; background:var(--blush-soft); font-size:38px; }
        .eyebrow { margin:0 0 6px; font:700 10px var(--font-sans); letter-spacing:.15em; color:var(--madder); }
        h1 { margin:0; font:600 31px/1.1 var(--font-voice); color:var(--ink); }
        .username { margin:5px 0 0; font:600 12px var(--font-sans); color:var(--muted); }
        .subtitle { margin:7px 0 0; font:12px/1.5 var(--font-sans); color:var(--muted); }
        .actions { display:flex; gap:8px; align-items:center; }
        .follow-button, .large-follow { border:0; border-radius:22px; background:var(--indigo); color:var(--indigo-text); font:600 12px var(--font-sans); cursor:pointer; }
        .follow-button { min-width:100px; padding:10px 16px; }
        .follow-button.following { background:var(--cotton); color:var(--ink); border:1px solid var(--cotton-line); }
        .follow-button:disabled, .large-follow:disabled { opacity:.6; cursor:default; }
        .message-button { display:inline-flex; align-items:center; justify-content:center; min-width:118px; padding:10px 16px; border-radius:22px; background:var(--indigo); color:var(--indigo-text); font:600 12px var(--font-sans); box-shadow:0 8px 18px rgba(43,58,85,.15); transition:transform 180ms ease,box-shadow 180ms ease; }
        .message-button:hover { transform:translateY(-2px); box-shadow:var(--shadow-lift); }
        .section-heading { display:flex; align-items:center; gap:7px; margin-bottom:13px; font:600 13px var(--font-sans); color:var(--ink); }
        .section-heading span { display:inline-grid; place-items:center; min-width:20px; height:20px; border-radius:50%; background:var(--blush-deep); font-size:10px; }
        .status { color:var(--muted); font:13px var(--font-sans); padding:20px 0; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:14px; padding-bottom:40px; }
        .card { overflow:hidden; background:var(--cotton); border:1px solid rgba(234,216,213,.72); border-radius:14px; box-shadow:var(--shadow-soft); animation-delay:var(--delay); transition:transform 220ms ease,box-shadow 220ms ease; }
        .card:hover { transform:translateY(-4px); box-shadow:var(--shadow-lift); }
        .card-image { height:180px; background-size:cover; background-position:center; }
        .card-body { padding:11px 12px 12px; }
        .card-name { font:15px var(--font-voice); color:var(--ink); }
        .card-note { margin-top:3px; font:11px/1.4 var(--font-sans); color:var(--muted); }
        .private-profile { max-width:430px; margin:30px auto 80px; padding:40px 28px; text-align:center; background:rgba(255,255,255,.58); border:1px solid var(--cotton-line); border-radius:18px; }
        .private-icon { font-size:24px; margin-bottom:8px; }
        .private-profile h2 { margin:0; font:600 20px var(--font-voice); color:var(--ink); }
        .private-profile p { margin:8px auto 18px; max-width:320px; font:12px/1.5 var(--font-sans); color:var(--muted); }
        .large-follow { padding:11px 24px; }
        .empty { width:min(520px,calc(100% - 40px)); margin:120px auto; text-align:center; color:var(--muted); font:14px var(--font-sans); }
        .empty a { display:inline-block; margin-top:12px; color:var(--ink); font-weight:600; }
        @media (max-width:620px) { .page { padding:20px 16px 90px; } .profile-header { align-items:flex-start; flex-direction:column; } .identity { align-items:flex-start; } h1 { font-size:27px; } .actions { width:100%; } .follow-button, .message-button { flex:1; } }
      `}</style>
    </main>
  );
}
