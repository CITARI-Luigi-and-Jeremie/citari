import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = { title: "GEO Sprint — Admin" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={fontVariables}>
      <body>
        {process.env.GEO_MOCK === "1" && (
          <div className="border-b border-signal bg-signal px-4 py-1 text-center font-mono text-micro uppercase text-paper">
            Mode démonstration (GEO_MOCK=1) — données simulées en mémoire.
          </div>
        )}
        <nav className="border-b border-rule bg-paper-raised px-6 py-3">
          <div className="mx-auto flex max-w-5xl items-center gap-6 text-sm font-medium">
            <span className="font-bold text-signal">GEO Sprint · Admin</span>
            <a href="/leads" className="hover:text-signal">Leads</a>
            <a href="/clients" className="hover:text-signal">Clients</a>
            <a href="/leads/export" className="ml-auto text-ink-faint hover:text-signal">Export CSV</a>
            <a href="/logout" className="text-ink-faint hover:text-signal">Déconnexion</a>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
