import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-hairline">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-mono text-sm tracking-wide">VETCLAIM.ONE</span>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/security" className="text-muted hover:text-ink">
              Security &amp; trust
            </Link>
            <Link href="/demo" className="text-muted hover:text-ink">
              Request a demonstration
            </Link>
            <Link
              href="/sign-in"
              className="border border-ink px-3 py-1.5 text-sm"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        <p className="font-mono text-xs text-accent mb-4">
          for accredited representatives
        </p>
        <h1 className="font-serif text-4xl leading-tight mb-6">
          Every claim, organized and sourced before it reaches VetraSpec.
        </h1>
        <p className="text-muted text-lg leading-relaxed mb-10 max-w-xl">
          VetClaim.one turns veteran records and interviews into a
          claim-development plan &mdash; every fact traced to its source,
          every issue held for your review. It does not decide, submit, or
          replace your professional judgment.
        </p>
        <div className="flex gap-4">
          <Link
            href="/demo"
            className="bg-ink text-paper px-5 py-2.5 text-sm"
          >
            Request a demonstration
          </Link>
          <Link
            href="/sign-in"
            className="border border-hairline px-5 py-2.5 text-sm text-muted"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
