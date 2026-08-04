import { createFileRoute } from "@tanstack/react-router";

const TITLE = "Méthode — Citari";
const DESCRIPTION =
  "La méthode de mesure Citari : 24 questions, six moteurs, formule du score publiée. Page en cours de rédaction.";

export const Route = createFileRoute("/methode")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Methode,
});

function Methode() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <h1 className="text-[30px] sm:text-[40px]">Méthode — en cours de rédaction</h1>
    </div>
  );
}
