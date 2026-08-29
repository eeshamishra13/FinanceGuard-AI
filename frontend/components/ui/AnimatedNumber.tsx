"use client";

import { useEffect, useState } from "react";
import type { AnimatedNumberProps } from "@/types";

export function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0, format, className = "" }: AnimatedNumberProps) {
  const [current, setCurrent] = useState(0);
  const finalValue = format ? format(value) : `${prefix}${value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setCurrent(value); return; }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => { const progress = Math.min((now - started) / 1200, 1); setCurrent(value * (1 - Math.pow(1 - progress, 3))); if (progress < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const output = format ? format(current) : `${prefix}${current.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  return <span className={className} aria-label={finalValue}>{output}</span>;
}
