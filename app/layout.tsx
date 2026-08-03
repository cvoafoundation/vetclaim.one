import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VetClaim.one",
  description:
    "Claims-development intelligence for accredited Veterans Service Officers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {/* Non-production banner — remove once real compliance work is
            in place. Required by the security boundary for this build. */}
        <div className="bg-accent-light border-b border-hairline text-center text-xs font-mono text-muted py-1.5">
          demo environment &mdash; synthetic data only, not for production use
        </div>
        {children}
      </body>
    </html>
  );
}
