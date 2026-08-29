"use client";

import { useEffect, useState } from "react";
import type { ResilienceRingProps } from "@/types";

export function ResilienceRing({ score, band, label = "RESILIENT" }: ResilienceRingProps) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setProgress(score); return; }
    const started = performance.now(); let frame = 0;
    const tick = (now: number) => { const p = Math.min((now - started) / 1300, 1); setProgress(score * (1 - Math.pow(1 - p, 3))); if (p < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [score]);
  const radius = 54; const circumference = 2 * Math.PI * radius;
  return <div className="ring-wrap" role="img" aria-label={`${score} out of 100 resilience score`}><svg viewBox="0 0 132 132" aria-hidden="true"><circle className="ring-track" cx="66" cy="66" r={radius} /><circle className="ring-progress" cx="66" cy="66" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference - circumference * progress / 100} /></svg><div className="ring-value"><strong>{Math.round(progress)}</strong><span>{label}</span></div>{band && <span className={`band band-${band}`}>{band.toUpperCase()}</span>}</div>;
}
