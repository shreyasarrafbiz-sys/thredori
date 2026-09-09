"use client";

import Link from "next/link";

const sections = [
  {
    title: "What Thredori is",
    body: "Thredori is a community where users share fashion, home, beauty, lifestyle and related finds. Content shown on Thredori is uploaded by Thredori users, not by the brands featured in a post unless explicitly stated.",
  },
  {
    title: "Post only content you have the right to share",
    body: "You are responsible for every image, video, text and link you upload. Do not copy, screenshot, download or repost product images, campaign photos, catalogue images or other creative assets directly from a brand website, app, catalogue or social account unless you have permission or another valid right to use them.",
  },
  {
    title: "Show your own experience",
    body: "We encourage original content. You can wear an item, style it, photograph it in your own setting, show your own home or product in use, or otherwise create your own image. Your post should add your own perspective rather than reproduce a brand's official creative material.",
  },
  {
    title: "What cannot be posted",
    body: "Do not post nudity or sexual content, graphic or harmful material, threats, hateful or harassing content, self-harm content, illegal or illicit material, or content that encourages wrongdoing. Do not post personal information that you do not have permission to share.",
  },
  {
    title: "Keep discussions relevant",
    body: "Posts and discussions should be relevant to the Thredori community and its categories. Spam, scams, misleading promotions, impersonation and unrelated content may be removed.",
  },
  {
    title: "Moderation",
    body: "Thredori may automatically check images and text for unsafe content before publication and may remove or restrict content that violates these policies. Automated checks are not perfect, so Thredori may also review reports or take additional action when needed.",
  },
  {
    title: "Your responsibility",
    body: "By posting, you confirm that you have the necessary rights to share the content and that it follows these policies. Thredori does not endorse every user submission and is not the source of user-uploaded content.",
  },
];

export default function PoliciesPage() {
  return (
    <main className="page">
      <section className="shell page-rise">
        <div className="topbar">
          <Link href="/" className="wordmark">thredori</Link>
          <Link href="/" className="back">← Home</Link>
        </div>

        <header className="hero">
          <p className="eyebrow">THREDORI COMMUNITY</p>
          <h1>Posting policies</h1>
          <p className="intro">A few simple rules keep Thredori useful, original and safe.</p>
        </header>

        <div className="notice">
          <span className="notice-icon">✦</span>
          <div>
            <strong>Important</strong>
            <p>Thredori is a user-generated community. When you see a post, assume it was uploaded by a user unless the post clearly says otherwise.</p>
          </div>
        </div>

        <div className="sections">
          {sections.map((section) => (
            <article key={section.title} className="policy-card">
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>

        <p className="footer-note">These community rules are intended to explain how Thredori operates and do not replace legal advice. If you are unsure whether you have the right to upload something, do not upload it.</p>
      </section>

      <style jsx>{`
        .page { min-height:100vh; padding:28px 28px 90px; background:var(--blush); }
        .shell { width:min(850px,100%); margin:0 auto; }
        .topbar { display:flex; align-items:center; justify-content:space-between; padding-bottom:15px; border-bottom:1px solid var(--cotton-line); }
        .wordmark { font:italic 20px/1 var(--font-voice); color:var(--ink); }
        .back { font:600 12px var(--font-sans); color:var(--muted); }
        .hero { padding:42px 0 25px; text-align:center; }
        .eyebrow { margin:0 0 7px; font:700 10px var(--font-sans); letter-spacing:.16em; color:var(--madder); }
        h1 { margin:0; font:600 34px/1.1 var(--font-voice); color:var(--ink); }
        .intro { margin:10px auto 0; max-width:520px; font:13px/1.6 var(--font-sans); color:var(--muted); }
        .notice { display:flex; gap:12px; align-items:flex-start; padding:16px 18px; margin-bottom:16px; border:1px solid var(--cotton-line); border-radius:16px; background:rgba(255,255,255,.7); box-shadow:var(--shadow-soft); }
        .notice-icon { width:30px; height:30px; display:grid; place-items:center; flex:0 0 auto; border-radius:50%; background:var(--blush-soft); color:var(--madder); }
        .notice strong { font:600 13px var(--font-sans); color:var(--ink); }
        .notice p { margin:4px 0 0; font:12px/1.55 var(--font-sans); color:var(--muted); }
        .sections { display:flex; flex-direction:column; gap:10px; }
        .policy-card { padding:18px 20px; border:1px solid rgba(234,216,213,.85); border-radius:15px; background:var(--cotton); box-shadow:var(--shadow-soft); }
        h2 { margin:0 0 7px; font:600 17px var(--font-voice); color:var(--ink); }
        .policy-card p { margin:0; font:12px/1.65 var(--font-sans); color:var(--muted); }
        .footer-note { margin:18px 5px 0; font:11px/1.55 var(--font-sans); color:var(--muted); text-align:center; }
        @media (max-width:620px) { .page { padding:20px 16px 90px; } .hero { padding:32px 0 20px; } h1 { font-size:29px; } }
      `}</style>
    </main>
  );
}
