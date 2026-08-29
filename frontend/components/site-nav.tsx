"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [{ href: "/dashboard", label: "TWIN" }, { href: "/simulator", label: "SIMULATOR" }, { href: "/copilot", label: "COPILOT" }];

export function SiteNav() {
  const pathname = usePathname();
  return <header className="site-nav"><Link href="/" className="wordmark">FINANCE<span>GUARD</span></Link><nav aria-label="Primary navigation">{links.map((link) => <Link key={link.href} href={link.href} className={pathname.startsWith(link.href) ? "active" : ""} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>{link.label}</Link>)}</nav><span className="demo-label"><i /> DEMO MODE</span></header>;
}
