"use client";

import { useState } from "react";
import Header from "../components/Header";
import BrandCard from "../components/BrandCard";
import { brands } from "../data/brands";

const heights = [150, 110, 170, 95, 130, 115, 150, 100];

export default function Home() {
  const [active, setActive] = useState("All");

  const filtered =
    active === "All" ? brands : brands.filter((b) => b.category === active);

  return (
    <main>
      <Header active={active} onChange={setActive} />

      <section className="intro container">
        <p>Discover independent Indian fashion & home labels — before they’re everywhere.</p>
      </section>

      <section className="grid container">
        {filtered.map((brand, i) => (
          <BrandCard key={brand.id} brand={brand} height={heights[i % heights.length]} />
        ))}
      </section>

      <footer className="container">
        <p>Thredori · Curated, not algorithm-fed.</p>
      </footer>

      <style jsx>{`
        .intro {
          padding: 18px 20px 6px;
        }
        .intro p {
          font-size: 13px;
          color: var(--muted);
          margin: 0;
        }
        .grid {
          column-count: 1;
          column-gap: 14px;
          padding: 10px 20px 40px;
        }
        @media (min-width: 640px) {
          .grid {
            column-count: 2;
          }
        }
        @media (min-width: 960px) {
          .grid {
            column-count: 3;
          }
        }
        footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: var(--muted);
          border-top: 1px solid var(--cotton-line);
        }
      `}</style>
    </main>
  );
}
