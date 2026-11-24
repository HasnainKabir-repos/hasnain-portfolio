"use client";

import { useEffect, useState } from "react";

const PAGES = [
  { id: "boot", addr: "0x0000", name: "boot" },
  { id: "sim", addr: "0x1000", name: "scheduler" },
  { id: "data", addr: "0x2000", name: ".data" },
  { id: "text", addr: "0x3000", name: ".text" },
  { id: "stack", addr: "0x4000", name: "stack" },
  { id: "heap", addr: "0x5000", name: "heap" },
];

export default function PageTableNav() {
  const [current, setCurrent] = useState("boot");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const p of PAGES) {
      const el = document.getElementById(p.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return (
    <nav className="pt" aria-label="Page table">
      <h2>Page table</h2>
      <ol>
        {PAGES.map((p) => (
          <li key={p.id}>
            <a href={`#${p.id}`} className={current === p.id ? "on" : undefined}>
              <span className="ad">{p.addr}</span>
              <span>{p.name}</span>
            </a>
          </li>
        ))}
      </ol>
      <p className="tlb">Virtual pages mapped to sections. The lit entry is the one you’re reading.</p>
    </nav>
  );
}
