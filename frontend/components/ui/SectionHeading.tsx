import type { SectionHeadingProps } from "@/types";
import { MetricLabel } from "./MetricLabel";

export function SectionHeading({ eyebrow, title, detail }: SectionHeadingProps) {
  return <div className="section-heading"><MetricLabel>{eyebrow}</MetricLabel><h2>{title}</h2>{detail && <p>{detail}</p>}</div>;
}
