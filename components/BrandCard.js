export default function BrandCard({ brand, height }) {
  return (
    <div className="brand-card">
      <div className="brand-card-hole" />
      <div
        className="brand-card-image"
        style={{
          height: height || 130,
          background: brand.color,
          backgroundImage: brand.image ? `url(${brand.image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="brand-card-name">{brand.name}</div>
      <div className="brand-card-note">{brand.note}</div>
      <div className="brand-card-footer">
        <span className="brand-card-location">{brand.location}</span>
        <button aria-label={`Save ${brand.name}`} className="brand-card-heart">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.5C11 6 12.5 5 14.4 5c3.3 0 5.1 3.4 3.6 6.9C19.5 16.4 12 21 12 21z"
              fill="#a13d2e"
            />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .brand-card {
          break-inside: avoid;
          background: #fff;
          border-radius: 6px;
          margin-bottom: 12px;
          padding: 10px 10px 12px;
        }
        .brand-card-hole {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--cotton);
          border: 1px solid var(--cotton-line);
          margin: 0 auto 6px;
        }
        .brand-card-image {
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .brand-card-name {
          font-family: var(--font-voice);
          font-size: 14px;
          color: var(--ink);
        }
        .brand-card-note {
          font-size: 11px;
          color: var(--muted);
          margin: 2px 0 6px;
        }
        .brand-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand-card-location {
          font-size: 10px;
          background: var(--cotton);
          color: #6b5f4e;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .brand-card-heart {
          background: none;
          border: none;
          padding: 4px;
          display: flex;
        }
      `}</style>
    </div>
  );
}
