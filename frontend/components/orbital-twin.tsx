"use client";

import { useEffect, useRef } from "react";

const cards = [
  { className: "twin-card twin-card-back", label: "RESILIENCE", value: "82", suffix: "/100", meta: "STABLE STATE", tone: "muted" },
  { className: "twin-card twin-card-mid", label: "MONTHLY BURN", value: "$4,280", suffix: "", meta: "-6.2% VS LAST MONTH", tone: "olive" },
  { className: "twin-card twin-card-front", label: "NET WORTH", value: "$284,620", suffix: "", meta: "+12.4% PROJECTED", tone: "green" },
];

export function OrbitalTwin() {
  const visualRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = visualRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const handleMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      node.style.setProperty("--parallax-x", `${x * 7}px`);
      node.style.setProperty("--parallax-y", `${y * 5}px`);
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div ref={visualRef} className="twin-stack" role="img" aria-label="Financial digital twin showing net worth, monthly burn, and resilience">
      <div className="twin-connection connection-one" aria-hidden="true" />
      <div className="twin-connection connection-two" aria-hidden="true" />
      {cards.map((card) => <div className={`${card.className} ${card.tone}`} key={card.label}>
        <div className="twin-card-top"><span>{card.label}</span><i aria-hidden="true" /></div>
        <strong>{card.value}<small>{card.suffix}</small></strong>
        <span className="twin-card-meta">{card.meta}</span>
      </div>)}
      <span className="twin-node node-one" aria-hidden="true" /><span className="twin-node node-two" aria-hidden="true" />
    </div>
  );
}
