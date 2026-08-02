import { createFileRoute } from "@tanstack/react-router";

const TITLE = "Mentions légales — Citari";
const DESCRIPTION = "Mentions légales de Citari. Page en cours de rédaction.";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: MentionsLegales,
});

function MentionsLegales() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <h1 className="text-[30px] sm:text-[40px]">Mentions légales</h1>
      <p className="measure mt-6 text-ink-2">En cours de rédaction</p>
      <p className="mono mt-6 text-[12px] text-ink-2">
        Citari — mentions légales en cours de complétion.
      </p>
    </div>
  );
}
