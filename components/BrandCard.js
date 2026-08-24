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
      >
        <div className="hover-scrim">
          <button aria-label={`Save ${brand.name}`} className="save-button">
            Save
          </button>
        </div>
      </div>
      <div className="brand-card-name">{brand.name}</div>
      <div className="brand-card-note">{brand.note}</div>
      <div className="brand-card-footer">
        <span className="brand-card-location">{brand.location}</span>
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
          position: relative;
          overflow: hidden;
        }
        .hover-scrim {
          position: absolute;
          inset: 0;
          background: rgba(35, 32, 25, 0);
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          padding: 8px;
          transition: background 0.15s ease;
        }
        .brand-card-image:hover .hover-scrim {
          background: rgba(35, 32, 25, 0.15);
        }
        .save-button {
          background: var(--madder);
          color: var(--madder-text);
          font-size: 12px;
          font-weight: 600;
          border: none;
          border-radius: 18px;
          padding: 7px 14px;
          opacity: 0;
          transform: translateY(-4px);
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .brand-card-image:hover .save-button {
          opacity: 1;
          transform: translateY(0);
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
      `}</style>
    </div>
  );
}
