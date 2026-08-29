"use client";

import { useEffect, useState } from "react";
import type { RunwayGaugeProps } from "@/types";

export function RunwayGauge({ months, max = 12 }: RunwayGaugeProps) {
  const [progress, setProgress] = useState(0);
  useEffect(() => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setProgress(months); return; } const start = performance.now(); let frame = 0; const tick = (now: number) => { const p = Math.min((now - start) / 1200, 1); setProgress(months * (1 - Math.pow(1 - p, 3))); if (p < 1) frame = requestAnimationFrame(tick); }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame); }, [months]);
  const clamped = Math.min(progress / max, 1);
  return <div className="gauge" role="img" aria-label={`${months} months of runway`}><div className="gauge-readout"><strong>{progress.toFixed(1)}</strong><span>MONTHS</span></div><div className="gauge-track"><span style={{ width: `${clamped * 100}%` }} /></div><div className="gauge-scale"><span>0</span><span>3</span><span>6</span><span>9</span><span>12+</span></div></div>;
}
