import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "GEO Sprint — Admin" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {process.env.GEO_MOCK === "1" && (
          <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
            Mode démonstration (GEO_MOCK=1) — données simulées en mémoire.
          </div>
        )}
        <nav className="border-b border-slate-200 bg-white px-6 py-3">
          <div className="mx-auto flex max-w-5xl items-center gap-6 text-sm font-medium">
            <span className="font-bold text-accent">GEO Sprint · Admin</span>
            <a href="/leads" className="hover:text-accent">Leads</a>
            <a href="/clients" className="hover:text-accent">Clients</a>
            <a href="/leads/export" className="ml-auto text-slate-500 hover:text-accent">Export CSV</a>
            <a href="/logout" className="text-slate-400 hover:text-accent">Déconnexion</a>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
