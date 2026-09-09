"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPolicies, setShowPolicies] = useState(true);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
    });
  }, []);

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const nextFiles = files.slice(0, 10);
    setImageFiles(nextFiles);
    setPreviews(nextFiles.map((file) => URL.createObjectURL(file)));
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user || !rightsConfirmed || imageFiles.length === 0) return;
    setLoading(true);
    setMessage("");

    const moderationImages = [];
    for (const file of imageFiles) {
      const dataUrl = await imageToModerationDataUrl(file);
      if (!dataUrl) {
        setMessage("We could not read one of these images. Please choose another image.");
        setLoading(false);
        return;
      }
      moderationImages.push(dataUrl);
    }

    for (const imageDataUrl of moderationImages) {
      const moderationResponse = await fetch("/api/moderate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: postType === "post" ? brandName : "",
          note: postType === "post" ? note : "",
          title: postType === "thread" ? brandName : "",
          body: postType === "thread" ? body : "",
          imageDataUrl,
        }),
      });
      const moderation = await moderationResponse.json().catch(() => ({}));
      if (!moderationResponse.ok || moderation.allowed !== true) {
        setMessage(moderation.reason || "This post could not be approved.");
        setLoading(false);
        return;
      }
    }

    const mediaUrls = [];
    for (const imageFile of imageFiles) {
      const fileExt = imageFile.name.split(".").pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("post-images").upload(filePath, imageFile);
      if (uploadError) {
        setMessage(uploadError.message);
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from("post-images").getPublicUrl(filePath);
      mediaUrls.push(publicUrlData.publicUrl);
    }

    const { error: insertError } = await supabase.from("posts").insert({
      user_id: user.id,
      brand_name: brandName,
      note: postType === "post" ? note : null,
      body: postType === "thread" ? body : null,
      brand_link: postType === "post" ? brandLink : null,
      category: postType === "post" ? category : "Discussion",
      image_url: mediaUrls[0] || "",
      media_urls: mediaUrls,
      post_type: postType,
    });

    setLoading(false);
    if (insertError) setMessage(insertError.message);
    else router.push("/");
  }

  if (checkingAuth) return null;

  if (!user) {
    return (
      <main className="auth-page"><div className="auth-card"><p>You need to be logged in to post.</p><a className="link-button" href="/login">Log in</a></div></main>
    );
  }

  const submitDisabled = loading || !rightsConfirmed || imageFiles.length === 0;

  return (
    <main className="page">
      <form onSubmit={handleSubmit} className="form-card">
        <div className="wordmark">thredori</div>
        <h1>New post</h1>

        {showPolicies && (
          <div className="policy-pop" role="note">
            <button type="button" className="close-policy" onClick={() => setShowPolicies(false)} aria-label="Close posting policies">×</button>
            <div className="policy-title">Before you post ✦</div>
            <p>Thredori is a user-generated community. Please upload content you have the right to share.</p>
            <ul>
              <li>Use your own photos or content you have permission to share.</li>
              <li>Do not copy product photos, campaign images or catalogue images directly from a brand website, app or social account.</li>
              <li>You can photograph yourself wearing, styling or using the product, or photograph it in your own setting.</li>
              <li>No nude, sexual, harmful, hateful, violent, self-harm or illegal content.</li>
            </ul>
            <Link href="/policies" className="policy-link">Read all posting policies →</Link>
          </div>
        )}

        <div className="type-toggle">
          <button type="button" className={postType === "post" ? "active" : ""} onClick={() => setPostType("post")}>Brand find</button>
          <button type="button" className={postType === "thread" ? "active" : ""} onClick={() => setPostType("thread")}>Start a discussion</button>
        </div>

        {postType === "post" ? (
          <>
            <label>Photos / videos<input type="file" accept="image/*,video/*" multiple required onChange={handleFileChange} /><small>Add up to 10 items. Multiple images become a carousel.</small></label>
            {previews.length > 0 && <div className="preview-grid">{previews.map((src, index) => <img key={src} src={src} alt={`Preview ${index + 1}`} className="preview" />)}</div>}
            <label>Brand name<input type="text" required value={brandName} onChange={(e) => setBrandName(e.target.value)} /></label>
            <label>Note (one line, e.g. material or style)<input type="text" value={note} onChange={(e) => setNote(e.target.value)} /></label>
            <label>Brand link<input type="url" placeholder="https://" value={brandLink} onChange={(e) => setBrandLink(e.target.value)} /></label>
            <label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="Fashion">Fashion</option><option value="Home">Home</option></select></label>
          </>
        ) : (
          <>
            <label>Title<input type="text" required placeholder="What do you want to ask or discuss?" value={brandName} onChange={(e) => setBrandName(e.target.value)} /></label>
            <label>Details<textarea rows={6} placeholder="Add context, ask a question, start a conversation..." value={body} onChange={(e) => setBody(e.target.value)} /></label>
            <label>Photos / videos<input type="file" accept="image/*,video/*" multiple required onChange={handleFileChange} /><small>Add up to 10 items. Multiple items become a carousel.</small></label>
            {previews.length > 0 && <div className="preview-grid">{previews.map((src, index) => <img key={src} src={src} alt={`Preview ${index + 1}`} className="preview" />)}</div>}
          </>
        )}

        <label className="rights-check">
          <input type="checkbox" checked={rightsConfirmed} onChange={(e) => setRightsConfirmed(e.target.checked)} />
          <span>I confirm that this is my own content or that I have permission/right to share it.</span>
        </label>

        <button type="submit" disabled={submitDisabled}>{loading ? "Checking..." : "Post"}</button>
        {!imageFiles.length && <p className="required-note">An image or video is required to create a post.</p>}
        <p className="moderation-note">Every item is checked for unsafe, sexual, harmful, hateful, violent, self-harm, and illegal content before publication.</p>
        {message && <p className="message">{message}</p>}
      </form>

      <style jsx>{`
        .page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--cotton); padding:24px 0; }
        .form-card { background:#fff; border-radius:10px; padding:32px; width:100%; max-width:430px; display:flex; flex-direction:column; gap:12px; }
        .wordmark { font-family:var(--font-voice); font-style:italic; font-size:20px; text-align:center; }
        h1 { font-family:var(--font-voice); font-size:18px; font-weight:500; text-align:center; margin:0 0 4px; }
        .policy-pop { position:relative; padding:16px 38px 15px 16px; border:1px solid var(--blush-deep); border-radius:15px; background:var(--blush-soft); box-shadow:var(--shadow-soft); }
        .close-policy { position:absolute; right:10px; top:8px; border:0; background:transparent; color:var(--muted); font-size:20px; cursor:pointer; line-height:1; }
        .policy-title { font:600 15px var(--font-voice); color:var(--ink); }
        .policy-pop p, .policy-pop li { font:11px/1.5 var(--font-sans); color:var(--muted); }
        .policy-pop p { margin:5px 0; }.policy-pop ul { margin:0 0 7px; padding-left:17px; }.policy-link { font:600 11px var(--font-sans); color:var(--ink); }
        .type-toggle { display:flex; gap:8px; margin-bottom:8px; }.type-toggle button { flex:1; background:var(--cotton); color:var(--muted); border:1px solid var(--cotton-line); border-radius:20px; padding:8px; font-size:12px; }.type-toggle button.active { background:var(--indigo); color:var(--indigo-text); border-color:var(--indigo); }
        label { font-size:13px; color:var(--muted); display:flex; flex-direction:column; gap:6px; } label small { font-size:10px; color:var(--muted); }
        input,select,textarea { padding:10px 12px; border-radius:6px; border:1px solid var(--cotton-line); font-size:14px; font-family:var(--font-sans); resize:vertical; }
        .preview-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }.preview { width:100%; aspect-ratio:1; object-fit:cover; border-radius:7px; background:var(--cotton); }
        .rights-check { flex-direction:row; align-items:flex-start; gap:9px; padding:10px 11px; border:1px solid var(--cotton-line); border-radius:10px; background:var(--cotton); cursor:pointer; }.rights-check input { width:17px; height:17px; margin:0; flex:0 0 auto; accent-color:var(--indigo); }.rights-check span { font:11px/1.45 var(--font-sans); color:var(--ink); }
        button[type="submit"] { margin-top:2px; background:var(--indigo); color:var(--indigo-text); border:none; border-radius:20px; padding:10px; font-size:14px; } button[type="submit"]:disabled { opacity:.45; cursor:not-allowed; }
        .moderation-note,.required-note { font-size:11px; line-height:1.45; text-align:center; margin:0; }.moderation-note { color:var(--muted); }.required-note { color:var(--madder); }.message { font-size:13px; color:var(--madder); text-align:center; margin:0; }
        .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--cotton); }.auth-card { background:#fff; border-radius:10px; padding:32px; text-align:center; }.link-button { display:inline-block; margin-top:12px; background:var(--indigo); color:var(--indigo-text); padding:10px 20px; border-radius:20px; font-size:14px; }
      `}</style>
    </main>
  );
}
