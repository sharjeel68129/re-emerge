"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-serif text-2xl text-ink mb-2">Check your email</h1>
          <p className="text-ink2 text-sm">
            A link was sent to {email}. Open it to set a password — this
            works the same way whether you already had a password or your
            account was only ever signed into with a magic link before.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-2xl text-ink mb-1">Set or reset your password</h1>
        <p className="text-ink2 mb-6 text-sm">
          Enter your account email and we'll send a link to set a password.
        </p>
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
          {error && <p className="text-rust text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full bg-ink text-paper py-2 hover:bg-ink2 transition-colors disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send link"}
          </button>
        </form>
        <p className="text-sm text-ink2 mt-6">
          <Link href="/login" className="underline underline-offset-2">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
