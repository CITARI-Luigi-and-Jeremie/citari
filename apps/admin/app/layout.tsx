import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = { title: "Citari — Admin" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={fontVariables}>
      <body>
        {/* Le bandeau « mode démonstration » a été retiré le 06/08/2026, en
            même temps que la base simulée qu'il annonçait. Il ne protégeait
            de rien : l'admin a tourné des semaines sur des données inventées
            sans que le bandeau empêche quiconque de les prendre au sérieux.
            `getDb()` ne renvoie plus que la vraie base. */}
        <nav className="border-b border-rule bg-paper-raised px-6 py-3">
          <div className="mx-auto flex max-w-5xl items-center gap-6 text-sm font-medium">
            <span className="font-bold text-signal">Citari · Admin</span>
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
