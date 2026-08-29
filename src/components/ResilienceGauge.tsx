import React, { useEffect, useState } from 'react';

interface ResilienceGaugeProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showGrade?: boolean;
}

export const ResilienceGauge: React.FC<ResilienceGaugeProps> = ({
  score,
  size = 240,
  strokeWidth = 14,
  label = 'Resilience Score',
  showGrade = true,
}) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200; // ms
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = score / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // 240 degree arc gauge
  const arcLength = circumference * 0.75;
  const progressOffset = arcLength - (displayScore / 100) * arcLength;

  const getGrade = (s: number) => {
    if (s >= 80) return { label: 'Prime Solvent Tier', color: 'text-[#C6B39A]' };
    if (s >= 65) return { label: 'Moderate Buffer', color: 'text-[#9E8A6D]' };
    return { label: 'Defensive State', color: 'text-[#B85558]' };
  };

  const grade = getGrade(score);

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-[135deg] overflow-visible"
      >
        <defs>
          {/* Signature Palette Gradient: Rubine -> Boho -> Camel */}
          <linearGradient id="resilienceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8D3A3C" />
            <stop offset="45%" stopColor="#7B694E" />
            <stop offset="85%" stopColor="#C6B39A" />
            <stop offset="100%" stopColor="#DFD5C6" />
          </linearGradient>

          {/* Background Track Gradient */}
          <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B1319" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#280B0F" stopOpacity="0.8" />
          </linearGradient>

          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base Track Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#trackGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          className="opacity-70"
        />

        {/* Animated Fill Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#resilienceGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          filter="url(#gaugeGlow)"
          className="transition-all duration-300 ease-out"
        />
      </svg>

      {/* Center Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pt-2">
        <span className="font-mono text-xs uppercase tracking-widest text-[#7B694E] font-medium mb-0.5">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-[#DFD5C6]">
            {displayScore}
          </span>
          <span className="font-mono text-xs text-[#7B694E]">/100</span>
        </div>
        {showGrade && (
          <span className={`text-[11px] font-serif italic tracking-wide mt-1.5 px-2.5 py-0.5 rounded-full bg-[#3B1319] border border-[#7B694E]/30 ${grade.color}`}>
            {grade.label}
          </span>
        )}
      </div>
    </div>
  );
};