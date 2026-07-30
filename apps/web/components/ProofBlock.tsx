import BlankLine from "./BlankLine";
import { fr } from "@/lib/typo";

/**
 * Le moment de compréhension : à quoi ressemble une réponse d’IA quand la marque
 * n’y est pas. Explicitement étiqueté « exemple » — nous ne présentons jamais une
 * réponse fabriquée comme une mesure réelle.
 */
export default function ProofBlock() {
  return (
    <figure className="border border-rule bg-paper-raised">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule px-4 py-3 sm:px-8">
        <span className="label">Exemple — ce que reçoit votre prospect</span>
        <span className="label">Réponse type d’un moteur</span>
      </figcaption>

      <div className="grid gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[1.4fr_1fr] lg:gap-16 lg:py-12">
        <div>
          <p className="font-mono text-sm text-ink-faint">Il demande</p>
          <p className="mt-2 font-mono text-lg text-ink">{fr("« Quel cabinet comptable choisir à Lyon ? »")}</p>

          <p className="mt-8 text-lg leading-relaxed text-ink-dim">
            Pour une PME à Lyon, <mark className="mark-rival">Cabinet Rivière</mark> revient souvent : bonne
            réputation sur les dossiers de croissance. <mark className="mark-rival">Fiducia Conseil</mark> est
            également cité pour son accompagnement juridique. Les deux proposent un premier rendez-vous gratuit.
          </p>
        </div>

        {/* Le geste : la ligne restée vide */}
        <div className="lg:border-l lg:border-rule lg:pl-16">
          <BlankLine
            label="Et votre cabinet"
            caption="Il n’y a pas de deuxième page de résultats. Ce prospect ne saura jamais que vous existiez."
          />
        </div>
      </div>
    </figure>
  );
}
