"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function NewPost() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [brandName, setBrandName] = useState("");
  const [note, setNote] = useState("");
  const [brandLink, setBrandLink] = useState("");
  const [category, setCategory] = useState("Fashion");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
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

    let imageUrl = "";

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        setMessage(uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath);
      imageUrl = publicUrlData.publicUrl;
    }

    const { error: insertError } = await supabase.from("posts").insert({
      user_id: user.id,
      brand_name: brandName,
      note,
      brand_link: brandLink,
      category,
      image_url: imageUrl,
    });

    setLoading(false);

    if (insertError) {
      setMessage(insertError.message);
    } else {
      router.push("/");
    }
  }

  if (checkingAuth) return null;

  if (!user) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <p>You need to be logged in to post.</p>
          <a className="link-button" href="/login">
            Log in
          </a>
        </div>
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
            text-align: center;
          }
          .link-button {
            display: inline-block;
            margin-top: 12px;
            background: var(--indigo);
            color: var(--indigo-text);
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <form onSubmit={handleSubmit} className="form-card">
        <div className="wordmark">thredori</div>
        <h1>New post</h1>

        <label>
          Image
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </label>

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="preview" />
        )}

        <label>
          Brand name
          <input
            type="text"
            required
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
          />
        </label>

        <label>
          Note (one line, e.g. material or style)
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <label>
          Brand link
          <input
            type="url"
            placeholder="https://"
            value={brandLink}
            onChange={(e) => setBrandLink(e.target.value)}
          />
        </label>

        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Fashion">Fashion</option>
            <option value="Home">Home</option>
          </select>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post"}
        </button>

        {message && <p className="message">{message}</p>}
      </form>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cotton);
          padding: 24px 0;
        }
        .form-card {
          background: #fff;
          border-radius: 10px;
          padding: 32px;
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .wordmark {
          font-family: var(--font-voice);
          font-style: italic;
          font-size: 20px;
          text-align: center;
        }
        h1 {
          font-family: var(--font-voice);
          font-size: 18px;
          font-weight: 500;
          text-align: center;
          margin: 0 0 8px;
        }
        label {
          font-size: 13px;
          color: var(--muted);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        input,
        select {
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid var(--cotton-line);
          font-size: 14px;
          font-family: var(--font-sans);
        }
        .preview {
          width: 100%;
          height: 160px;
          object-fit: cover;
          border-radius: 6px;
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
      `}</style>
    </main>
  );
}
