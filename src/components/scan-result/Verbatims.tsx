import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { formatDate, type Verbatim } from "@/lib/scan-result";
import { saveScanLead } from "@/lib/scan-result.functions";
import { BOOKING_URL } from "@/lib/site";

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Adresse email invalide." })
  .max(255, { message: "Adresse email trop longue." });

function VerbatimText({ verbatim }: { verbatim: Verbatim }) {
  // Le texte réel est rendu tel quel ; seuls les concurrents recommandés
  // sont surlignés en signal, en romain.
  const pattern = verbatim.competitors.filter(Boolean);
  const parts: (string | { brand: string })[] = [];
  let rest = verbatim.text;

  while (rest.length > 0) {
    let bestIndex = -1;
    let bestBrand = "";
    for (const brand of pattern) {
      const index = rest.toLowerCase().indexOf(brand.toLowerCase());
      if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
        bestIndex = index;
        bestBrand = rest.slice(index, index + brand.length);
      }
    }
    if (bestIndex === -1) {
      parts.push(rest);
      break;
    }
    if (bestIndex > 0) parts.push(rest.slice(0, bestIndex));
    parts.push({ brand: bestBrand });
    rest = rest.slice(bestIndex + bestBrand.length);
  }

  return (
    <>
      {parts.map((part, index) =>
        typeof part === "string" ? (
          <span key={index}>{part}</span>
        ) : (
          <span
            key={index}
            className="highlight-signal highlight-signal-on"
            style={{ fontStyle: "normal" }}
          >
            {part.brand}
          </span>
        ),
      )}
    </>
  );
}

/** 5. VERBATIMS VERROUILLÉS + 6. SECTION RÉVÉLÉE APRÈS EMAIL. */
export function VerbatimsSection({
  scanId,
  verbatimCount,
}: {
  scanId: string;
  verbatimCount: number;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "unlocked">("idle");
  const [verbatims, setVerbatims] = useState<Verbatim[]>([]);
  const submitLead = useServerFn(saveScanLead);

  if (verbatimCount === 0) {
    return (
      <section className="border-t border-rule">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-[26px] sm:text-[34px]">Les phrases</h2>
          <p className="measure mt-6 text-ink-2">
            Sur cet échantillon, vous sortez. Le diagnostic complet vous dira où vous êtes
            fragile.
          </p>
        </div>
        <BookingWall />
      </section>
    );
  }

  const unlocked = status === "unlocked";

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Adresse email invalide.");
      return;
    }
    setError(null);
    setStatus("sending");
    try {
      const result = await submitLead({ data: { scanId, email: parsed.data } });
      setVerbatims(result.verbatims);
      setStatus("unlocked");
    } catch {
      setStatus("idle");
      setError("Envoi impossible pour le moment. Réessayez dans un instant.");
    }
  };

  return (
    <>
      <section className="border-t border-rule">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="measure text-[26px] sm:text-[34px]">
            {unlocked
              ? "Les phrases, telles qu'elles ont été écrites."
              : "Ce que les IA disent à votre place."}
          </h2>

          <div className="relative mt-10">
            {unlocked ? (
              <ul className="space-y-8">
                {verbatims.map((verbatim, index) => (
                  <li key={index} className="border border-rule-strong bg-paper-2 p-6 sm:p-8">
                    <blockquote className="quote-serif measure text-[21px] leading-[1.45] sm:text-[24px]">
                      « <VerbatimText verbatim={verbatim} /> »
                    </blockquote>
                    <p className="mono mt-5 text-[13px] text-ink-2">
                      — {verbatim.engineLabel}
                      {formatDate(verbatim.askedAt)
                        ? `, interrogé le ${formatDate(verbatim.askedAt)}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              // Aucun texte de réponse n'est envoyé au client avant la capture :
              // le verrou affiche des blocs neutres, pas des phrases floutées.
              <ul
                className="space-y-8 select-none"
                style={{ filter: "blur(6px)", pointerEvents: "none" }}
                aria-hidden
              >
                {Array.from({ length: verbatimCount }).map((_, index) => (
                  <li key={index} className="border border-rule-strong bg-paper-2 p-6 sm:p-8">
                    <div className="space-y-3">
                      <span className="block h-4 w-full bg-rule" />
                      <span className="block h-4 w-[92%] bg-rule" />
                      <span className="block h-4 w-[64%] bg-rule" />
                    </div>
                    <span className="mt-5 block h-3 w-40 bg-rule" />
                  </li>
                ))}
              </ul>
            )}


            {unlocked ? null : (
              <div className="absolute inset-0 flex items-start justify-center p-4">
                <form
                  onSubmit={onSubmit}
                  className="w-full max-w-xl border border-ink bg-paper p-6 sm:p-8"
                >
                  <p className="measure text-[20px] sm:text-[24px]">
                    {verbatimCount} phrase{verbatimCount > 1 ? "s" : ""} où une IA
                    recommande un concurrent à votre place. Votre email pour les lire.

                  </p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <label htmlFor="unlock-email" className="sr-only">
                      Votre email professionnel
                    </label>
                    <input
                      id="unlock-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      maxLength={255}
                      className="field"
                      placeholder="vous@votre-site.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="cta shrink-0"
                      disabled={status === "sending"}
                    >
                      Débloquer les verbatims
                    </button>
                  </div>
                  {error ? (
                    <p className="mono mt-3 text-[13px]" style={{ color: "var(--signal)" }}>
                      {error}
                    </p>
                  ) : null}
                  <p className="mono mt-4 text-[13px] text-ink-2">
                    Votre email sert à vous envoyer ce scan et rien d'autre. Désinscription
                    en un clic.{" "}
                    <Link to="/mentions-legales" className="underline underline-offset-4">
                      Confidentialité
                    </Link>
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {unlocked ? <BookingWall /> : null}
    </>
  );
}

function BookingWall() {
  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="border border-ink p-6 sm:p-12">
          <h2 className="measure text-[26px] sm:text-[34px]">
            Le scan gratuit s'arrête ici.
          </h2>
          <p className="measure mt-6 text-ink-2">
            30 minutes en visio : les 24 questions une par une, les sources sur lesquelles les
            IA s'appuient pour recommander vos concurrents, et vos 3 corrections prioritaires.
            Repartez avec votre diagnostic, qu'on travaille ensemble ou non. Si votre score est
            bon, on vous le dit et on ne vous vend rien.
          </p>
          <div className="mt-8">
            <iframe
              src={BOOKING_URL}
              title="Réserver 30 minutes avec Citari"
              loading="lazy"
              className="h-[620px] w-full border border-rule-strong bg-paper"
            />
          </div>
          <p className="mt-6">
            <a href={BOOKING_URL} className="cta">
              Réserver mes 30 minutes
            </a>
          </p>
          <p className="mono mt-4 text-[13px] text-ink-2">
            Call gratuit · Le sprint, si vous le faites : 2 900 € une fois, sans abonnement.
          </p>
        </div>
      </div>
    </section>
  );
}
