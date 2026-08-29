import Link from "next/link";
import type { ButtonProps } from "@/types";

export function PrimaryButton({ children, href, onClick, className = "", type = "button" }: ButtonProps) {
  const content = <span>{children}<b aria-hidden="true">→</b></span>;
  return href ? <Link className={`primary-button ${className}`} href={href}>{content}</Link> : <button type={type} className={`primary-button ${className}`} onClick={onClick}>{content}</button>;
}
