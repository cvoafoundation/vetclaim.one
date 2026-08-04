export default function ConditionsStepPlaceholder() {
  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-lg mx-auto">
        <p className="text-xs text-muted mb-1 din uppercase tracking-wide">step 3 of 6</p>
        <h1 className="din text-3xl mb-2">Current conditions</h1>
        <p className="text-muted text-sm">
          Next in the build order &mdash; current diagnoses and symptoms,
          following the same pattern as the two steps before it.
        </p>
      </div>
    </main>
  );
}
