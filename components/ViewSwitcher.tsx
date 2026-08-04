"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Demo-only convenience — lets one signed-in reviewer flip between the
// representative, veteran, and state-admin surfaces without separate
// logins. Remove once real role-based routing and separate accounts
// are in place; this is not an access control mechanism.
const VIEWS = [
  { label: "representative", href: "/rep" },
  { label: "veteran", href: "/veteran" },
  { label: "state admin", href: "/state" },
];

export default function ViewSwitcher() {
  const pathname = usePathname();

  return (
    <div className="border-b border-hairline bg-paper px-6 py-1.5 flex items-center gap-1 text-[11px] din uppercase tracking-wide">
      <span className="text-muted mr-2">view as</span>
      {VIEWS.map((v) => {
        const active = pathname?.startsWith(v.href);
        return (
          <Link
            key={v.href}
            href={v.href}
            className={
              active
                ? "px-3 py-1 bg-ink text-paper"
                : "px-3 py-1 text-muted hover:text-ink border border-transparent hover:border-hairline"
            }
          >
            {v.label}
          </Link>
        );
      })}
    </div>
  );
}
