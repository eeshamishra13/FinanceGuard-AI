"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AnimatedNumberProps, ButtonProps, GlassCardProps, MetricLabelProps, ResilienceRingProps, RunwayGaugeProps, SectionHeadingProps } from "@/types";

export function GlassCard({ children, className = "", as: Tag = "div" }: GlassCardProps) {
  return <Tag className={`instrument-card ${className}`}>{children}</Tag>;
}

export function MetricLabel({ children, className = "" }: MetricLabelProps) {
  return <div className={`metric-label ${className}`}>{children}</div>;
}

export function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0, className = "" }: AnimatedNumberProps) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setCurrent(value); return; }
    const start = performance.now();
    const duration = 1200;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className={className}>{prefix}{current.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>;
}

export function ResilienceRing({ score, band }: ResilienceRingProps) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setProgress(score); return; }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => { const p = Math.min((now - start) / 1300, 1); setProgress(score * (1 - Math.pow(1 - p, 3))); if (p < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  return <div className="ring-wrap" aria-label={`${score} out of 100 resilience score`}>
    <svg viewBox="0 0 132 132" role="img"><circle className="ring-track" cx="66" cy="66" r={radius} /><circle className="ring-progress" cx="66" cy="66" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference - circumference * progress / 100} /></svg>
    <div className="ring-value"><strong>{Math.round(progress)}</strong><span>RESILIENT</span></div>
    <span className={`band band-${band}`}>{band.toUpperCase()}</span>
  </div>;
}

export function RunwayGauge({ months, max = 12 }: RunwayGaugeProps) {
  return <div className="gauge" aria-label={`${months} months of runway`}>
    <div className="gauge-readout"><strong><AnimatedNumber value={months} decimals={1} /></strong><span>MONTHS</span></div>
    <div className="gauge-track"><span style={{ width: `${Math.min(months / max * 100, 100)}%` }} /></div>
    <div className="gauge-scale"><span>0</span><span>3</span><span>6</span><span>9</span><span>12+</span></div>
  </div>;
}

export function PrimaryButton({ children, href, onClick, className = "" }: ButtonProps) {
  const content = <span>{children}<b aria-hidden="true">→</b></span>;
  return href ? <Link className={`primary-button ${className}`} href={href}>{content}</Link> : <button className={`primary-button ${className}`} onClick={onClick}>{content}</button>;
}

export function SectionHeading({ eyebrow, title, detail }: SectionHeadingProps) {
  return <div className="section-heading"><MetricLabel>{eyebrow}</MetricLabel><h2>{title}</h2>{detail && <p>{detail}</p>}</div>;
}
