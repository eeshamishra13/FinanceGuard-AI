"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, MetricLabel, SectionHeading, PrimaryButton } from "@/components/ui/finance";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter an email and password to continue.");
      return;
    }
    router.push("/onboarding");
  };

  const handleDemoUser = () => {
    router.push("/onboarding");
  };

  return (
    <main
      className="dashboard"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <GlassCard className="p-8" style={{ maxWidth: "420px", width: "100%" }}>
        <SectionHeading
          eyebrow="FINANCEGUARD ACCESS"
          title="Sign in to your twin."
          detail="Enter any credentials to continue — this is a demo environment."
        />

        <form onSubmit={handleSignIn} style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <MetricLabel>EMAIL</MetricLabel>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                width: "100%",
                marginTop: "0.4rem",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                color: "var(--foreground)",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          <div>
            <MetricLabel>PASSWORD</MetricLabel>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                marginTop: "0.4rem",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                color: "var(--foreground)",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <p style={{ color: "var(--negative, #E28860)", fontSize: "0.8rem", margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
          >
            <span>SIGN IN</span>
          </button>
        </form>

        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--line)",
            textAlign: "center",
          }}
        >
          <MetricLabel>OR</MetricLabel>
          <div style={{ marginTop: "0.75rem" }}>
            <PrimaryButton onClick={handleDemoUser}>CONTINUE AS DEMO USER</PrimaryButton>
          </div>
        </div>
      </GlassCard>
    </main>
  );
}