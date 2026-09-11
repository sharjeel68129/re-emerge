import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen max-w-2xl mx-auto px-6 py-12">
      <Link href="/" className="focus-ring text-sm text-ink2 hover:text-ink underline underline-offset-2">
        ← Back
      </Link>
      <h1 className="font-serif text-3xl text-ink mt-4 mb-2">Privacy Policy</h1>
      <p className="text-xs text-ink2 font-mono mb-8">Last updated: edit this date when you change this page</p>

      <div className="prose-like text-sm text-ink space-y-5">
        <p className="text-ink2 border border-rule bg-gold/5 p-3">
          This is a starting template, not a lawyer-reviewed document.
          Replace the bracketed placeholders with your own details, and
          have someone qualified review it if this app will ever be used
          by anyone besides you.
        </p>

        <section>
          <h2 className="font-serif text-lg mb-1">What this is</h2>
          <p>
            This is a personal task-tracking application ("the App"),
            operated by [your name / "me"], for the purpose of logging
            university tasks and goals across daily, weekly, monthly,
            semester, yearly, and pre-graduation categories.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg mb-1">What data is collected</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your email address and a hashed password, for authentication.</li>
            <li>The tasks, subtasks, notes, deadlines, and outcomes you enter.</li>
            <li>Your program name and start/graduation dates, if you provide them.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg mb-1">How it's stored</h2>
          <p>
            All data is stored in a Supabase (PostgreSQL) database with
            row-level security enabled, meaning each account can only
            read or write its own rows. No data is sold, shared with
            advertisers, or used to train any model.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg mb-1">Data retention and deletion</h2>
          <p>
            Data is kept until you delete it yourself, or until you
            request account deletion by contacting [your contact email].
            Deleting your account removes your tasks, subtasks, and
            profile from the database.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg mb-1">Third parties</h2>
          <p>
            Authentication and data storage are provided by Supabase.
            Hosting is provided by Vercel. Neither is used for
            advertising or analytics in this App.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg mb-1">Contact</h2>
          <p>Questions about this policy: [your contact email].</p>
        </section>
      </div>
    </main>
  );
}
