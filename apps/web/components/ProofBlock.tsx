/**
 * Le moment de compréhension : à quoi ressemble une réponse d'IA quand la marque
 * n'y est pas. Explicitement étiqueté « exemple » — nous ne présentons jamais une
 * réponse fabriquée comme une mesure réelle.
 */
export default function ProofBlock() {
  return (
    <figure className="border border-rule">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule px-4 py-3 sm:px-6">
        <span className="label">Exemple — à quoi ressemble le problème</span>
        <span className="label">Réponse type d'un moteur</span>
      </figcaption>

      <div className="px-4 py-8 sm:px-6 lg:px-12 lg:py-12">
        <p className="font-mono text-sm text-ink-faint">Un prospect demande :</p>
        <p className="mt-2 font-mono text-lg text-ink">« Quel cabinet comptable choisir à Lyon ? »</p>

        <p className="mt-8 max-w-prose text-lg leading-relaxed text-ink-dim">
          Pour une PME à Lyon, <mark className="mark-rival">Cabinet Rivière</mark> revient souvent : bonne
          réputation sur les dossiers de croissance. <mark className="mark-rival">Fiducia Conseil</mark> est
          également cité pour son accompagnement juridique. Les deux proposent un premier rendez-vous gratuit.
        </p>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-rule px-4 py-5 sm:px-6 lg:px-12">
        <span className="label">Votre cabinet</span>
        <span className="font-mono text-lg uppercase tracking-wider" style={{ color: "var(--signal)" }}>
          Non cité
        </span>
      </div>
    </figure>
  );
}
