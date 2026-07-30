import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité | GEO Sprint", robots: { index: false } };

/**
 * RGPD : le scanner collecte marque, URL, secteur, concurrents, IP et email.
 * Ces données transitent par des API de LLM et par Resend — il faut le dire.
 */
export default function ConfidentialitePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <a href="/" className="text-sm text-slate-500 hover:text-accent">← GEO Sprint</a>
      <h1 className="text-3xl font-extrabold">Politique de confidentialité</h1>
      <p className="text-sm text-slate-500">Dernière mise à jour : 30 juillet 2026</p>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Responsable de traitement</h2>
        <p className="text-slate-700">
          [À COMPLÉTER : dénomination sociale et adresse] — contact :{" "}
          <a className="text-accent underline" href="mailto:[À COMPLÉTER]">[À COMPLÉTER : email]</a>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Données collectées et finalités</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left">
              <th className="py-2 pr-4">Donnée</th>
              <th className="py-2 pr-4">Finalité</th>
              <th className="py-2">Base légale</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100 align-top">
              <td className="py-2 pr-4">Nom de marque, URL, secteur, concurrents cités</td>
              <td className="py-2 pr-4">Réaliser le scan de visibilité et produire le rapport</td>
              <td className="py-2">Exécution de la demande (mesure pré-contractuelle)</td>
            </tr>
            <tr className="border-b border-slate-100 align-top">
              <td className="py-2 pr-4">Adresse email</td>
              <td className="py-2 pr-4">Envoyer le rapport complet et, le cas échéant, un suivi commercial</td>
              <td className="py-2">Consentement</td>
            </tr>
            <tr className="border-b border-slate-100 align-top">
              <td className="py-2 pr-4">Adresse IP</td>
              <td className="py-2 pr-4">Limiter les abus (3 scans par jour et par IP)</td>
              <td className="py-2">Intérêt légitime (sécurité du service)</td>
            </tr>
          </tbody>
        </table>
        <p className="text-slate-700">
          Aucun cookie publicitaire ni traceur analytique tiers n'est déposé. Aucun profilage n'est réalisé au-delà
          de l'analyse de visibilité demandée.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Sous-traitants et transferts</h2>
        <p className="text-slate-700">
          La réalisation du scan implique l'envoi des questions générées (contenant le nom de la marque et de ses
          concurrents) aux fournisseurs suivants, via leurs API professionnelles :
        </p>
        <ul className="ml-5 list-disc space-y-1 text-slate-700">
          <li><strong>OpenAI</strong>, <strong>Anthropic</strong>, <strong>Google</strong>, <strong>Perplexity</strong> — exécution des requêtes de mesure (États-Unis, clauses contractuelles types).</li>
          <li><strong>Supabase</strong> — hébergement de la base de données.</li>
          <li><strong>Resend</strong> — envoi des emails contenant le rapport.</li>
          <li><strong>Cloudflare Turnstile</strong> — protection anti-robot du formulaire.</li>
        </ul>
        <p className="text-slate-700">
          Aucune donnée personnelle au-delà de ce qui est nécessaire à la mesure n'est transmise. Les API
          professionnelles utilisées ne réutilisent pas les données transmises pour entraîner les modèles.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Durée de conservation</h2>
        <ul className="ml-5 list-disc space-y-1 text-slate-700">
          <li>Scans et rapports : 24 mois (permet la comparaison avant/après à J+90 et au-delà).</li>
          <li>Adresses email des prospects : 3 ans à compter du dernier contact.</li>
          <li>Adresses IP : 12 mois.</li>
          <li>Données clients : durée de la relation contractuelle, puis 10 ans pour les obligations comptables.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Vos droits</h2>
        <p className="text-slate-700">
          Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de
          portabilité. Pour l'exercer, écrivez à{" "}
          <a className="text-accent underline" href="mailto:[À COMPLÉTER]">[À COMPLÉTER : email]</a> — réponse sous
          un mois. Vous pouvez également introduire une réclamation auprès de la{" "}
          <a className="text-accent underline" href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">CNIL</a>.
        </p>
        <p className="text-slate-700">
          Chaque email envoyé comporte un lien de désinscription. La suppression de vos données de scan peut être
          demandée à tout moment et prend effet sous 30 jours.
        </p>
      </section>

      <p className="pt-4 text-sm text-slate-500">
        Voir également nos <a className="text-accent underline" href="/mentions-legales">mentions légales</a>.
      </p>
    </main>
  );
}
