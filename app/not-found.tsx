import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="font-mono text-sm text-gold mb-2">404</p>
        <h1 className="font-serif text-3xl text-ink mb-3">Nothing on record here.</h1>
        <p className="text-ink2 text-sm mb-6">
          Whatever you were looking for doesn't exist at this address —
          maybe a stale bookmark or a typo in the URL.
        </p>
        <Link
          href="/"
          className="focus-ring inline-block bg-ink text-paper text-sm px-4 py-2 hover:bg-ink2 transition-colors"
        >
          Back to your dashboard
        </Link>
      </div>
    </main>
  );
}
