import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { MetricLabel } from "@/components/ui/finance";
export default function Simulator() { return <main className="placeholder-page"><SiteNav /><div><MetricLabel>FINANCEGUARD / SIMULATOR</MetricLabel><h1>Stress-test the life you&apos;re building.</h1><p>The scenario engine is being tuned. Soon you&apos;ll be able to model the decisions, shocks, and pivots that shape your financial future.</p><Link href="/dashboard">← RETURN TO YOUR TWIN</Link></div></main> }
