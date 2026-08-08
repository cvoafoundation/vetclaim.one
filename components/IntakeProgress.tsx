const STEP_NAMES = [
  "Service history",
  "Deployments",
  "Conditions",
  "Ratings",
  "Denials",
  "Providers",
];

export default function IntakeProgress({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex gap-1 mb-2">
        {STEP_NAMES.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 ${
              i < step ? "bg-ink" : "bg-hairline"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted din uppercase tracking-wide">
          step {step} of {STEP_NAMES.length} &mdash; {STEP_NAMES[step - 1]}
        </p>
        <p className="text-xs text-muted">
          Only you and your representative can see this.
        </p>
      </div>
    </div>
  );
}
