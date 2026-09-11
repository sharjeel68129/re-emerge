"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "check-email" | "signed-up">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!agreed) {
      setError("You need to agree to the Terms and Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      // Email confirmation is off in this project — signed in immediately.
      window.location.href = "/";
    } else {
      setStatus("check-email");
    }
  }

  if (status === "check-email") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-serif text-2xl text-ink mb-2">Almost there</h1>
          <p className="text-ink2 text-sm">
            Check {email} for a confirmation link, then come back and log in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl text-ink mb-1">Create an account</h1>
        <p className="text-ink2 mb-8 text-sm">Registrar — a private four-year log.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-ink2 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-ring w-full border border-rule bg-white/40 px-3 py-2 text-ink outline-none"
              placeholder="you@university.edu"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-ink2 mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring w-full border border-rule bg-white/40 px-3 py-2 text-ink outline-none"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm text-ink2 mb-1">Confirm password</label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="focus-ring w-full border border-rule bg-white/40 px-3 py-2 text-ink outline-none"
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-ink2">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="focus-ring mt-0.5"
            />
            <span>
              I've read and agree to the{" "}
              <Link href="/terms" target="_blank" className="underline underline-offset-2 text-ink">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="underline underline-offset-2 text-ink">
                Privacy Policy
              </Link>.
            </span>
          </label>

          {error && <p className="text-rust text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !agreed}
            className="focus-ring w-full bg-ink text-paper py-2 hover:bg-ink2 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-ink2 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-ink underline underline-offset-2">Log in</Link>
        </p>
      </div>
    </main>
  );
}
