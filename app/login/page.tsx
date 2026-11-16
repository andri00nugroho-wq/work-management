"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReiLogo from "@/components/rei-logo";
import { THEMES, applyTheme } from "@/lib/theme";
import { useTheme } from "@/lib/use-theme";
import { loginStyles } from "./login.styles";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message ?? "Login gagal.");
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tidak dapat menghubungi server.");
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-themes" role="group" aria-label="Pilih tema tampilan">
          {THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`login-theme ${theme === item.id ? "active" : ""}`}
              aria-pressed={theme === item.id}
              title={`Mode ${item.label}`}
              onClick={() => applyTheme(item.id)}
            >
              <span className={`theme-dot theme-dot-${item.id}`} aria-hidden="true" />
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="login-logo">
          <ReiLogo compact />
        </div>
        <h1>Masuk</h1>
        <p>REI Work Management</p>

        {error && <div className="login-error" role="alert">{error}</div>}

        <label>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
          />
        </label>

        <label>
          Kata sandi
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <button className="login-submit" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </button>

        <span className="login-footnote">Raja Emas Indonesia · Work Management</span>
      </form>

      <style jsx>{loginStyles}</style>
    </div>
  );
}
