"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

async function imageToModerationDataUrl(file) {
  if (!file) return "";
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxDimension = 1280;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      image.onerror = () => resolve("");
      image.src = reader.result;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export default function NewPost() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [postType, setPostType] = useState("post");
  const [brandName, setBrandName] = useState("");
  const [note, setNote] = useState("");
  const [body, setBody] = useState("");
  const [brandLink, setBrandLink] = useState("");
  const [category, setCategory] = useState("Fashion");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPolicies, setShowPolicies] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
    });
  }, []);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage("");

    const moderationImage = await imageToModerationDataUrl(imageFile);
    if (imageFile && !moderationImage) {
      setMessage("We could not read this image. Please choose another image.");
      setLoading(false);
      return;
    }

    const moderationResponse = await fetch("/api/moderate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: postType === "post" ? brandName : "",
        note: postType === "post" ? note : "",
        title: postType === "thread" ? brandName : "",
        body: postType === "thread" ? body : "",
        imageDataUrl: moderationImage,
      }),
    });

    const moderation = await moderationResponse.json().catch(() => ({}));
    if (!moderationResponse.ok || moderation.allowed !== true) {
      setMessage(moderation.reason || "This post could not be approved.");
      setLoading(false);
      return;
    }

    let imageUrl = "";
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("post-images").upload(filePath, imageFile);
      if (uploadError) {
        setMessage(uploadError.message);
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from("post-images").getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;
    }

    const { error: insertError } = await supabase.from("posts").insert({
      user_id: user.id,
      brand_name: brandName,
      note: postType === "post" ? note : null,
      body: postType === "thread" ? body : null,
      brand_link: postType === "post" ? brandLink : null,
      category: postType === "post" ? category : "Discussion",
      image_url: imageUrl,
      post_type: postType,
    });

    setLoading(false);
    if (insertError) setMessage(insertError.message);
    else router.push("/");
  }

  if (checkingAuth) return null;

  if (!user) {
    return (
      <main className="auth-page">
        <div className="auth-card"><p>You need to be logged in to post.</p><a className="link-button" href="/login">Log in</a></div>
        <style jsx>{`.auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--cotton)}.auth-card{background:#fff;border-radius:10px;padding:32px;text-align:center}.link-button{display:inline-block;margin-top:12px;background:var(--indigo);color:var(--indigo-text);padding:10px 20px;border-radius:20px;font-size:14px}`}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <form onSubmit={handleSubmit} className="form-card">
        <div className="wordmark">thredori</div>
        <h1>New post</h1>

        {showPolicies && (
          <div className="policy-popover" role="note">
            <button type="button" className="close-policy" aria-label="Close posting policies" onClick={() => setShowPolicies(false)}>×</button>
            <div className="policy-title">Before you post ✦</div>
            <p><strong>Keep it original.</strong> Please upload photos you took yourself or content you have permission to share.</p>
            <p>Do <strong>not</strong> copy, screenshot or download a product image directly from a brand website, app, catalogue or social account and repost it here.</p>
            <p>You can wear the item, style it, photograph it in your own home or setting, show it in use, or otherwise create your own original image.</p>
            <p>No nudity, sexual, harmful, hateful, violent, self-harm, illegal, spam or unrelated content.</p>
            <Link href="/policies" className="read-more">Read all posting policies →</Link>
          </div>
        )}

        <div className="type-toggle">
          <button type="button" className={postType === "post" ? "active" : ""} onClick={() => setPostType("post")}>Brand find</button>
          <button type="button" className={postType === "thread" ? "active" : ""} onClick={() => setPostType("thread")}>Start a discussion</button>
        </div>

        {postType === "post" ? (
          <>
            <label>Image<input type="file" accept="image/*" onChange={handleFileChange} /></label>
            {preview && <img src={preview} alt="Preview" className="preview" />}
            <label>Brand name<input type="text" required value={brandName} onChange={(e) => setBrandName(e.target.value)} /></label>
            <label>Note (one line, e.g. material or style)<input type="text" value={note} onChange={(e) => setNote(e.target.value)} /></label>
            <label>Brand link<input type="url" placeholder="https://" value={brandLink} onChange={(e) => setBrandLink(e.target.value)} /></label>
            <label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="Fashion">Fashion</option><option value="Home">Home</option></select></label>
          </>
        ) : (
          <>
            <label>Title<input type="text" required placeholder="What do you want to ask or discuss?" value={brandName} onChange={(e) => setBrandName(e.target.value)} /></label>
            <label>Details<textarea rows={6} placeholder="Add context, ask a question, start a conversation..." value={body} onChange={(e) => setBody(e.target.value)} /></label>
            <label>Image (optional)<input type="file" accept="image/*" onChange={handleFileChange} /></label>
            {preview && <img src={preview} alt="Preview" className="preview" />}
          </>
        )}

        <button type="submit" disabled={loading}>{loading ? "Checking..." : "Post"}</button>
        <p className="moderation-note">Posts are checked for unsafe content before publishing.</p>
        {message && <p className="message">{message}</p>}
      </form>

      <style jsx>{`
        .page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--cotton);padding:24px 0}.form-card{background:#fff;border-radius:10px;padding:32px;width:100%;max-width:400px;display:flex;flex-direction:column;gap:12px}.wordmark{font-family:var(--font-voice);font-style:italic;font-size:20px;text-align:center}h1{font-family:var(--font-voice);font-size:18px;font-weight:500;text-align:center;margin:0 0 4px}.type-toggle{display:flex;gap:8px;margin-bottom:8px}.type-toggle button{flex:1;background:var(--cotton);color:var(--muted);border:1px solid var(--cotton-line);border-radius:20px;padding:8px;font-size:12px}.type-toggle button.active{background:var(--indigo);color:var(--indigo-text);border-color:var(--indigo)}label{font-size:13px;color:var(--muted);display:flex;flex-direction:column;gap:6px}input,select,textarea{padding:10px 12px;border-radius:6px;border:1px solid var(--cotton-line);font-size:14px;font-family:var(--font-sans);resize:vertical}.preview{width:100%;max-height:220px;object-fit:contain;border-radius:6px;background:var(--cotton)}button[type=submit]{margin-top:8px;background:var(--indigo);color:var(--indigo-text);border:none;border-radius:20px;padding:10px;font-size:14px}button[type=submit]:disabled{opacity:.6}.moderation-note{font-size:11px;color:var(--muted);line-height:1.45;text-align:center;margin:0}.message{font-size:13px;color:var(--madder);text-align:center;margin:0}.policy-popover{position:relative;padding:15px 38px 15px 16px;margin-bottom:4px;border:1px solid var(--blush-deep);border-radius:15px;background:linear-gradient(180deg,#fffafa 0%,#fff2f1 100%);box-shadow:0 10px 24px rgba(106,82,88,.1)}.policy-title{font:600 15px var(--font-voice);color:var(--ink);margin-bottom:7px}.policy-popover p{font:11px/1.55 var(--font-sans);color:var(--muted);margin:5px 0}.policy-popover strong{color:var(--ink)}.close-policy{position:absolute;right:10px;top:8px;width:24px;height:24px;border:0;background:transparent;color:var(--muted);font-size:20px;cursor:pointer}.read-more{display:inline-block;margin-top:6px;color:var(--indigo);font:600 11px var(--font-sans)}
      `}</style>
    </main>
  );
}
