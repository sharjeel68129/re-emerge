"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";

type Status = { kind: "idle" | "success" | "error"; message: string };

export default function SettingsPanel({ userId, email }: { userId: string; email: string }) {
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // Change password
  const [currentPasswordForPw, setCurrentPasswordForPw] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<Status>({ kind: "idle", message: "" });
  const [pwSaving, setPwSaving] = useState(false);

  // Change email
  const [newEmail, setNewEmail] = useState("");
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<Status>({ kind: "idle", message: "" });
  const [emailSaving, setEmailSaving] = useState(false);

  // Delete account
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<Status>({ kind: "idle", message: "" });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwStatus({ kind: "idle", message: "" });

    if (newPassword.length < 8) {
      setPwStatus({ kind: "error", message: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwStatus({ kind: "error", message: "New passwords don't match." });
      return;
    }

    setPwSaving(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPasswordForPw,
    });
    if (verifyError) {
      setPwSaving(false);
      setPwStatus({ kind: "error", message: "Current password is incorrect." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (error) {
      setPwStatus({ kind: "error", message: error.message });
    } else {
      setPwStatus({ kind: "success", message: "Password updated." });
      setCurrentPasswordForPw("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailStatus({ kind: "idle", message: "" });

    setEmailSaving(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPasswordForEmail,
    });
    if (verifyError) {
      setEmailSaving(false);
      setEmailStatus({ kind: "error", message: "Password is incorrect." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailSaving(false);
    if (error) {
      setEmailStatus({ kind: "error", message: error.message });
    } else {
      setEmailStatus({
        kind: "success",
        message: `Confirmation links sent to both ${email} and ${newEmail}. The change only takes effect once both are confirmed.`,
      });
      setNewEmail("");
      setCurrentPasswordForEmail("");
    }
  }

  async function performDelete() {
    setDeleting(true);
    setDeleteStatus({ kind: "idle", message: "" });

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: deletePassword,
    });
    if (verifyError) {
      setDeleting(false);
      setConfirmingDelete(false);
      setDeleteStatus({ kind: "error", message: "Password is incorrect." });
      return;
    }

    const res = await fetch("/api/delete-account", { method: "POST" });
    if (!res.ok) {
      setDeleting(false);
      setConfirmingDelete(false);
      setDeleteStatus({ kind: "error", message: "Could not delete the account. Try again." });
      return;
    }

    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen max-w-lg mx-auto px-6 py-10">
      <Link href="/" className="focus-ring text-sm text-ink2 hover:text-ink underline underline-offset-2">
        ← Back to dashboard
      </Link>
      <h1 className="font-serif text-3xl text-ink mt-4 mb-1">Settings</h1>
      <div className="flex items-center justify-between mb-8">
        <p className="text-ink2 text-sm">{email}</p>
        <button
          onClick={signOut}
          className="focus-ring text-sm text-ink2 hover:text-ink border border-rule px-3 py-1.5 hover:bg-white/50 transition-colors"
        >
          Sign out
        </button>
      </div>

      <section className="mb-8">
        <p className="text-xs text-ink2">
          <Link href="/terms" className="underline underline-offset-2">Terms &amp; Conditions</Link>
          {" · "}
          <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>
        </p>
      </section>

      {/* Change password */}
      <section className="border border-rule bg-white/40 p-4 mb-6">
        <h2 className="font-serif text-lg text-ink mb-3">Change password</h2>
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className="block text-xs text-ink2 mb-1">Current password</label>
            <input
              type="password"
              required
              value={currentPasswordForPw}
              onChange={(e) => setCurrentPasswordForPw(e.target.value)}
              className="focus-ring w-full border border-rule bg-white/60 px-2 py-1.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-ink2 mb-1">New password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="focus-ring w-full border border-rule bg-white/60 px-2 py-1.5 text-sm outline-none"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-xs text-ink2 mb-1">Confirm new password</label>
            <input
              type="password"
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="focus-ring w-full border border-rule bg-white/60 px-2 py-1.5 text-sm outline-none"
            />
          </div>
          {pwStatus.kind !== "idle" && (
            <p className={pwStatus.kind === "error" ? "text-rust text-xs" : "text-moss text-xs"}>
              {pwStatus.message}
            </p>
          )}
          <button
            type="submit"
            disabled={pwSaving}
            className="focus-ring bg-ink text-paper text-sm px-4 py-1.5 hover:bg-ink2 disabled:opacity-50"
          >
            {pwSaving ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      {/* Change email */}
      <section className="border border-rule bg-white/40 p-4 mb-6">
        <h2 className="font-serif text-lg text-ink mb-1">Change email</h2>
        <p className="text-xs text-ink2 mb-3">
          Confirmation links go to both your current and new address — the
          change only applies once both are confirmed.
        </p>
        <form onSubmit={changeEmail} className="space-y-3">
          <div>
            <label className="block text-xs text-ink2 mb-1">New email</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="focus-ring w-full border border-rule bg-white/60 px-2 py-1.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-ink2 mb-1">Current password</label>
            <input
              type="password"
              required
              value={currentPasswordForEmail}
              onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
              className="focus-ring w-full border border-rule bg-white/60 px-2 py-1.5 text-sm outline-none"
            />
          </div>
          {emailStatus.kind !== "idle" && (
            <p className={emailStatus.kind === "error" ? "text-rust text-xs" : "text-moss text-xs"}>
              {emailStatus.message}
            </p>
          )}
          <button
            type="submit"
            disabled={emailSaving}
            className="focus-ring bg-ink text-paper text-sm px-4 py-1.5 hover:bg-ink2 disabled:opacity-50"
          >
            {emailSaving ? "Sending…" : "Change email"}
          </button>
        </form>
      </section>

      {/* Delete account */}
      <section className="border border-rust/50 bg-rust/5 p-4">
        <h2 className="font-serif text-lg text-rust mb-1">Delete account</h2>
        <p className="text-xs text-ink2 mb-3">
          Permanently deletes your account and every task, subtask, and
          semester you've logged. This can't be undone — there's no
          recovering it afterward.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-ink2 mb-1">Confirm your password</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="focus-ring w-full border border-rule bg-white/60 px-2 py-1.5 text-sm outline-none"
            />
          </div>
          {deleteStatus.kind === "error" && <p className="text-rust text-xs">{deleteStatus.message}</p>}
          <button
            onClick={() => setConfirmingDelete(true)}
            disabled={!deletePassword || deleting}
            className="focus-ring bg-rust text-paper text-sm px-4 py-1.5 hover:bg-rust/80 disabled:opacity-50"
          >
            Delete my account
          </button>
        </div>
      </section>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete your account permanently?"
          message="Everything you've logged will be gone for good, including anything you were saving for your graduation record."
          confirmLabel={deleting ? "Deleting…" : "Yes, delete everything"}
          danger
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={performDelete}
        />
      )}
    </main>
  );
}
