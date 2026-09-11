"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl text-ink mb-1">Registrar</h1>
        <p className="text-ink2 mb-8 text-sm">
          A private log of four years, kept one term at a time.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-ink2 mb-1">
              Email
            </label>
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
            <label htmlFor="password" className="block text-sm text-ink2 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring w-full border border-rule bg-white/40 px-3 py-2 text-ink outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-rust text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full bg-ink text-paper py-2 hover:bg-ink2 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-ink2 mt-4">
          <Link href="/forgot-password" className="underline underline-offset-2">
            Forgot your password? (or setting one for the first time)
          </Link>
        </p>

        <p className="text-sm text-ink2 mt-6">
          New here?{" "}
          <Link href="/signup" className="text-ink underline underline-offset-2">
            Create an account
          </Link>
        </p>
        <p className="text-xs text-ink2 mt-8">
          <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>
          {" · "}
          <Link href="/terms" className="underline underline-offset-2">Terms &amp; Conditions</Link>
        </p>
      </div>
    </main>
  );
}
