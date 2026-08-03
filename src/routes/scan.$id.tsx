import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getScan } from "@/lib/scan-result.functions";
import { selectVerbatims, type ScanRecord } from "@/lib/scan-result";
import { Verdict, Breakdown, ByEngine, ShareOfVoice } from "@/components/scan-result/Metrics";
import { VerbatimsSection } from "@/components/scan-result/Verbatims";

const TITLE = "Votre scan de visibilité IA — Citari";
const DESCRIPTION =
  "Résultat du scan : votre score sur 100, le détail moteur par moteur et les phrases exactes des IA.";

export const Route = createFileRoute("/scan/$id")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const { id } = Route.useParams();
  const fetchScan = useServerFn(getScan);

  const { data, isPending, isError } = useQuery({
    queryKey: ["scan", id],
    queryFn: () => fetchScan({ data: { id } }),
    refetchInterval: (query) =>
      (query.state.data as ScanRecord | null)?.status === "done" ? false : 4000,
  });

  if (isPending) return <Notice title="Chargement du scan…" />;

  if (isError)
    return (
      <Notice
        title="Ce scan n'a pas pu être chargé."
        body="Vérifiez le lien reçu, ou relancez un scan depuis la page d'accueil."
      />
    );

  if (!data)
    return (
      <Notice
        title="Scan introuvable."
        body="Ce lien ne correspond à aucun scan."
      />
    );

  const scan = data as unknown as ScanRecord;

  if (scan.status !== "done" || scan.score === null) {
    return (
      <Notice
        title="Scan en cours."
        body="Six moteurs sont interrogés en direct avec les questions de vos acheteurs. Cette page se met à jour toute seule."
        mono={`${scan.brand} · ${scan.domain}`}
      />
    );
  }

  return (
    <>
      <Verdict scan={scan} />
      <Breakdown scan={scan} />
      <ByEngine scan={scan} />
      <ShareOfVoice scan={scan} />
      <VerbatimsSection scanId={scan.id} verbatims={selectVerbatims(scan)} />
    </>
  );
}

function Notice({
  title,
  body,
  mono,
}: {
  title: string;
  body?: string;
  mono?: string;
}) {
  return (
    <section>
      <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32">
        <h1 className="measure text-[26px] sm:text-[34px]">{title}</h1>
        {body ? <p className="measure mt-6 text-ink-2">{body}</p> : null}
        {mono ? <p className="mono mt-6 text-[13px] text-ink-2">{mono}</p> : null}
        <p className="mt-8">
          <Link to="/" className="underline underline-offset-4">
            Retour à l'accueil →
          </Link>
        </p>
      </div>
    </section>
  );
}
