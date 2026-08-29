import type { MetricLabelProps } from "@/types";

export function MetricLabel({ children, className = "" }: MetricLabelProps) {
  return <div className={`metric-label ${className}`}>{children}</div>;
}
