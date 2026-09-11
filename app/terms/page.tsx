import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen max-w-2xl mx-auto px-6 py-12">
      <Link href="/" className="focus-ring text-sm text-ink2 hover:text-ink underline underline-offset-2">
        ← Back
      </Link>
      <h1 className="font-serif text-3xl text-ink mt-4 mb-2">Terms &amp; Conditions</h1>
      <p className="text-xs text-ink2 font-mono mb-8">Last updated: edit this date when you change this page</p>

      <div className="prose-like text-sm text-ink space-y-5">
        <p className="text-ink2 border border-rule bg-gold/5 p-3">
          This is a starting template, not a lawyer-reviewed document.
          Replace the bracketed placeholders with your own details, and
          have someone qualified review it if this app will ever be used
          by anyone besides you.
        </p>

        <section>
          <h2 className="font-serif text-lg mb-1">Acceptance</h2>
          <p>
            By creating an account you agree to these terms and to the{" "}
            <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
            If you don't agree, don't create an account.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg mb-1">What the App does</h2>
          <p>
            The App lets you record tasks and goals, mark them
            completed, failed, or excused, and generate a PDF summary of
            your history at the end of your program. It is provided
            as-is, for personal record-keeping, with no guarantee of
            uptime, accuracy, or fitness for any particular purpose.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg mb-1">Your account</h2>
          <p>
            You're responsible for keeping your password confidential and
            for anything entered under your account. You may delete your
            account at any time by contacting [your contact email].
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg mb-1">Your content</h2>
          <p>
            Everything you enter (tasks, notes, results) belongs to you.
            It's used only to display it back to you and to generate
            your own PDF record — never shared, sold, or used for any
            other purpose.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg mb-1">Limitation of liability</h2>
          <p>
            The App is not a substitute for your institution's official
            academic records. To the fullest extent permitted by law,
            [your name] is not liable for any loss of data or missed
            deadline resulting from use of the App.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg mb-1">Changes</h2>
          <p>
            These terms may be updated as the App changes. Continued use
            after an update means you accept the revised terms.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg mb-1">Contact</h2>
          <p>Questions about these terms: [your contact email].</p>
        </section>
      </div>
    </main>
  );
}
