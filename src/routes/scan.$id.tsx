import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { getScan } from "@/lib/scan-result.functions";
import { CONTACT_EMAIL } from "@/lib/site";
import { Verdict, Breakdown, ByEngine, ShareOfVoice } from "@/components/scan-result/Metrics";
import { VerbatimsSection } from "@/components/scan-result/Verbatims";
import { LoadingScreen } from "@/components/scan-loading/LoadingScreen";

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

  const { data, isPending, isError, errorUpdateCount } = useQuery({
    queryKey: ["scan", id],
    queryFn: () => fetchScan({ data: { id } }),
    retry: false,
    // On garde le dernier état connu en cas d'échec réseau.
    placeholderData: (previous) => previous,
    refetchInterval: (query) => {
      const status = query.state.data?.scan.status;
      return status === "done" || status === "error" ? false : 1500;
    },
  });

  // 400 ms de papier nu entre la fin de l'analyse et la révélation.
  const sawScoring = useRef(false);
  const [held, setHeld] = useState(false);
  const status = data?.scan.status;
  if (status === "scoring" || status === "running") sawScoring.current = true;

  useEffect(() => {
    if (status !== "done" || !sawScoring.current || held) return;
    const timer = window.setTimeout(() => setHeld(true), 400);
    return () => window.clearTimeout(timer);
  }, [status, held]);

  if (isPending) return <Notice title="Chargement du scan…" />;

  if (isError && !data)
    return (
      <Notice
        title="Ce scan n'a pas pu être chargé."
        body="Vérifiez le lien reçu, ou relancez un scan depuis la page d'accueil."
      />
    );

  if (!data)
    return <Notice title="Scan introuvable." body="Ce lien ne correspond à aucun scan." />;

  const { scan, queries, meta, verbatimCount } = data;

  if (scan.status === "error")
    return (
      <Notice
        title="Le scan s'est interrompu."
        body={`Relancez-le depuis l'accueil — si ça se reproduit, écrivez-nous : ${CONTACT_EMAIL}.`}
      />
    );

  if (scan.status !== "done" || scan.score === null)
    return (
      <LoadingScreen
        scan={scan}
        queries={queries}
        meta={meta}
        unstable={errorUpdateCount >= 10}
      />
    );

  if (sawScoring.current && !held) return <section className="min-h-[60vh]" />;

  return (
    <>
      <Verdict scan={scan} />
      <Breakdown scan={scan} />
      <ByEngine scan={scan} />
      <ShareOfVoice scan={scan} />
      <VerbatimsSection scanId={scan.id} verbatimCount={verbatimCount} />
    </>
  );
}

function Notice({ title, body, mono }: { title: string; body?: string; mono?: string }) {
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
