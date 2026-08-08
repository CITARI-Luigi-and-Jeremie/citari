import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { LogoLien } from "@/components/logo";
import { chargerRapport } from "@/lib/scan.functions";
import { Etiquette, Label, Rule } from "@/components/kit";
import {
  Actions,
  LimiteMethodologique,
  PartDeVoix,
  ScoreGeant,
  ScoresMoteurs,
  Sources,
  TableauRequetes,
  Verbatims,
  Vide,
  type Mention,
  type Question,
  type Reponse,
} from "@/components/rapport";
import { dateFr, fr, frTitre, verdict, MOTEURS, NBSP } from "@/lib/typo";
import { bookingUrl } from "@/lib/site";

export const Route = createFileRoute("/rapport/$jeton")({
  loader: async ({ params }) => {
    const data = await chargerRapport({ data: { jeton: params.jeton } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const titre = loaderData
      ? `Rapport de visibilité IA — ${loaderData.scan.brand_name}`
      : "Rapport indisponible";
    const desc =
      "Score de visibilité IA, part de voix et sources citées par ChatGPT, Claude, Gemini, Perplexity, Grok et Le Chat.";
    return {
      meta: [
        { title: titre },
        { name: "description", content: desc },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: titre },
        { property: "og:description", content: desc },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-32">
      <h1 className="text-[48px]">Rapport introuvable</h1>
      <p className="mt-4 text-ink-2">Ce lien est incorrect ou le rapport a été supprimé.</p>
      <Link to="/" className="ink-link mt-6 inline-block">
        Revenir à l’accueil
      </Link>
    </div>
  ),
  component: Rapport,
});

const SECTIONS = [
  ["score", "Score global"],
  ["voix", "Part de voix"],
  ["requetes", "Requête par requête"],
  ["verbatims", "Verbatims"],
  ["sources", "Sources citées"],
  ["actions", "Actions prioritaires"],
] as const;

function Rapport() {
  const { scan, questions, reponses, mentions, precedent } = Route.useLoaderData();
  const marque = scan.brand_name;
  const score = Math.round(Number(scan.score_global ?? 0));
  const pdv = (Array.isArray(scan.share_of_voice) ? scan.share_of_voice : []) as {
    name: string;
    count: number;
    share: number;
    target: boolean;
  }[];
  const actions = (Array.isArray(scan.actions) ? scan.actions : []) as {
    chantier: string;
    titre: string;
    pourquoi: string;
    effort: string;
  }[];
  // Les six, toujours. Il en manquait deux — Grok et Le Chat — et le rapport
  // les affichait donc « — » alors qu'ils avaient bien été interrogés et notés.
  const parMoteur: Record<string, number | null> = {
    ChatGPT: scan.score_chatgpt as number | null,
    Claude: scan.score_claude as number | null,
    Gemini: scan.score_gemini as number | null,
    Perplexity: scan.score_perplexity as number | null,
    Grok: scan.score_grok as number | null,
    "Le Chat": scan.score_mistral as number | null,
  };
  // Le nombre de moteurs dépend du mode : annoncer « × 6 moteurs » sur un
  // aperçu qui en interroge deux gonfle l'ampleur de la mesure vendue.
  const moteursInterroges = MOTEURS.filter((m) => parMoteur[m] !== null).length || MOTEURS.length;

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-32 lg:px-10">
      {/* En-tête éditorial, calé à gauche */}
      <header className="pt-14 md:pt-20">
        <div className="flex items-baseline justify-between gap-6">
          <LogoLien hauteur={24} className="no-print" />
          <button
            type="button"
            onClick={() => window.print()}
            className="label-xs no-print ink-link"
          >
            imprimer
          </button>
        </div>
        <h1 className="mt-8 text-[64px] leading-[0.92] md:text-[96px]">{marque}</h1>
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-2 border-t border-rule-strong pt-3">
          {[
            ["secteur", scan.sector],
            ["site", scan.website_url ?? "—"],
            ["date", scan.completed_at ? dateFr(scan.completed_at) : dateFr(scan.created_at)],
            ["échantillon", `${questions.length} questions × ${moteursInterroges} moteurs`],
            ["réponses", `${reponses.length}`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="label-xs">{k}</dt>
              <dd className="num text-[14px]">{v}</dd>
            </div>
          ))}
        </dl>
        {precedent ? (
          <div className="mt-4">
            <Etiquette ton="signal">
              mode comparaison — scan initial du {precedent.date ? dateFr(precedent.date) : "—"}
            </Etiquette>
          </div>
        ) : null}
      </header>

      <div className="mt-16 grid gap-12 lg:grid-cols-[168px_1fr] lg:gap-16">
        {/* Rail de navigation */}
        <nav className="no-print h-max lg:sticky lg:top-10">
          <Label className="pb-2">sections</Label>
          <Rule strong />
          <ol>
            {SECTIONS.map(([id, titre], i) => (
              <li key={id} className="border-b border-rule">
                <a href={`#${id}`} className="flex items-baseline gap-2 py-2 text-[13px] hover:text-signal">
                  <span className="num text-[10px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  {titre}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="min-w-0">
          <Section id="score" titre="Score de visibilité IA">
            <ScoreGeant
              score={score}
              verdict={verdict(score)}
              ecart={precedent ? score - Math.round(precedent.score) : null}
            />
            <p className="mt-6 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
              {fr(
                `Le score pondère quatre indicateurs : taux de mention (50 %), position moyenne dans la réponse (20 %), recommandation explicite (20 %) et sentiment (10 %).`,
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-x-12 gap-y-4 border-t border-rule pt-4">
              {[
                ["taux de mention", pct(scan.mention_rate)],
                ["position moyenne", scan.avg_position ? Number(scan.avg_position).toFixed(1).replace(".", ",") : "—"],
                ["recommandation explicite", pct(scan.reco_rate)],
                ["sentiment", pct(scan.sentiment_score)],
              ].map(([k, v]) => (
                <div key={k}>
                  <Label>{k}</Label>
                  <div className="num text-[26px] leading-tight">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <ScoresMoteurs scores={parMoteur} avant={precedent?.parMoteur ?? null} />
            </div>
          </Section>

          <Section id="voix" titre="Part de voix">
            <p className="mb-6 max-w-[58ch] text-[15px] text-ink-2">
              {fr(
                "Mentions de la marque rapportées au total des mentions relevées, concurrents compris. La marque suivie est en rouge signal ; le contexte reste neutre.",
              )}
            </p>
            <PartDeVoix items={pdv} />
            {precedent && Array.isArray(precedent.pdv) && precedent.pdv.length ? (
              <div className="mt-10">
                <Label className="pb-3">au scan initial</Label>
                <PartDeVoix items={precedent.pdv} />
              </div>
            ) : null}
          </Section>

          <Section id="requetes" titre="Requête par requête">
            <p className="mb-6 max-w-[58ch] text-[15px] text-ink-2">
              {fr(
                "Échantillon figé : le re-scan à J+90 rejoue exactement ces mêmes questions, sinon la comparaison ne vaut rien.",
              )}
            </p>
            <TableauRequetes
              questions={questions as Question[]}
              reponses={reponses as unknown as Reponse[]}
              mentions={mentions as unknown as Mention[]}
              marque={marque}
            />
          </Section>

          <Section id="verbatims" titre="Verbatims bruts">
            <Verbatims mentions={mentions as unknown as Mention[]} marque={marque} />
          </Section>

          <Section id="sources" titre="Sources citées par Perplexity">
            <p className="mb-6 max-w-[58ch] text-[15px] text-ink-2">
              {fr(
                "Voilà où il faut être. Ces domaines sont ceux que le moteur consulte pour répondre aux questions de votre marché.",
              )}
            </p>
            <Sources reponses={reponses as unknown as Reponse[]} />
          </Section>

          <Section id="actions" titre="Dix actions prioritaires">
            <Actions actions={actions} />
          </Section>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            <LimiteMethodologique />
            <div className="max-w-[46ch] border-t border-rule-strong pt-3">
              <Etiquette>engagement</Etiquette>
              <p className="mt-2 text-[13px] leading-snug text-ink-2">
                {fr(
                  "Nous garantissons les actions livrées, pas un score. Les moteurs intègrent les changements de contenu et de citations en 4 à 12 semaines : c’est pourquoi le re-scan est planifié à J+90.",
                )}
              </p>
            </div>
          </div>

          {!reponses.length ? <Vide>Aucune réponse collectée pour ce scan.</Vide> : null}

          <Restitution marque={marque} />
        </main>
      </div>

      <footer className="mt-24 border-t border-rule-strong pt-4">
        <p className="num text-[11px] text-ink-3">
          Citari{NBSP}· rapport {scan.report_token.slice(0, 8)}{NBSP}·{" "}
          {frTitre("mesure par API officielles, sans scraping")}
        </p>
      </footer>
    </div>
  );
}

/**
 * Le mur de restitution.
 *
 * Porté du projet Lovable de Jérémie (`BookingWall`) le 08/08/2026 : le rapport
 * s'arrêtait jusqu'ici sur une note méthodologique, sans jamais proposer la
 * suite. C'est pourtant la page où le prospect est le plus convaincu.
 *
 * Ne rien promettre sur le résultat : on vend trente minutes de lecture du
 * rapport, et on dit à voix haute qu'un bon score ne débouche sur aucune vente.
 */
function Restitution({ marque }: { marque: string }) {
  const lien = bookingUrl({ name: marque });
  return (
    <section className="no-print mt-24 border border-ink p-6 sm:p-12">
      <h2 className="measure text-[26px] sm:text-[34px]">Le rapport se lit mieux à deux.</h2>
      <p className="measure mt-6 text-ink-2">
        {fr(
          "Trente minutes en visio : les questions une par une, les sources sur lesquelles les moteurs s’appuient pour recommander vos concurrents, et vos trois corrections prioritaires. Vous repartez avec le diagnostic, qu’on travaille ensemble ou non.",
        )}
      </p>
      <div className="mt-8">
        <iframe
          src={lien}
          title="Réserver trente minutes avec Citari"
          loading="lazy"
          className="h-[620px] w-full border border-rule-strong bg-paper"
        />
      </div>
      <p className="mt-6">
        <a href={lien} className="cta">
          Réserver mes 30 minutes
        </a>
      </p>
      <p className="mono mt-4 text-[13px] text-ink-2">
        {fr(
          "Appel gratuit. Si votre score est bon, nous vous le disons et nous ne vous vendons rien. Le Sprint GEO, si vous le faites : 2 900 € HT une fois, sans abonnement.",
        )}
      </p>
    </section>
  );
}

function pct(v: unknown) {
  const n = Number(v ?? 0);
  return `${Math.round(n * 100)}${NBSP}%`;
}

function Section({ id, titre, children }: { id: string; titre: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-20 scroll-mt-8">
      <div className="mb-6 flex items-baseline gap-4 border-b border-rule-strong pb-2">
        <h2 className="text-[34px] leading-none md:text-[42px]">{titre}</h2>
      </div>
      {children}
    </section>
  );
}
