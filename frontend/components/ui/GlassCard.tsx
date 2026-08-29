import type { GlassCardProps } from "@/types";

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return <div className={`glass-card ${className}`}>{children}</div>;
}
