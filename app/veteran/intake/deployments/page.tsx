export default function DeploymentsStepPlaceholder() {
  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-lg mx-auto">
        <p className="font-mono text-xs text-muted mb-1">step 2 of 6</p>
        <h1 className="font-serif text-2xl mb-2">Deployments and exposures</h1>
        <p className="text-muted text-sm">
          Next step in the build order &mdash; deployment locations, dates,
          and exposure screening, following the same pattern as the
          service history step.
        </p>
      </div>
    </main>
  );
}
