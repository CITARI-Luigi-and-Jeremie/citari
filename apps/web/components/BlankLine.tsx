/**
 * Le geste signature du produit : l’absence rendue physique.
 *
 * Une ligne de formulaire restée vide — là où le nom de la marque aurait dû
 * être écrit. C’est la traduction visuelle exacte de ce que le scan mesure,
 * et le seul ornement que s’autorise le système.
 */
export default function BlankLine({
  label,
  caption,
  filled,
}: {
  label: string;
  caption?: string;
  /** Si la marque EST citée, on écrit son nom sur la ligne au lieu de la laisser vide. */
  filled?: string | null;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="mt-3 flex items-end gap-4">
        <div className="min-w-0 flex-1">
          {filled ? (
            <p className="truncate border-b border-ink pb-2 font-editorial text-3xl text-ink">{filled}</p>
          ) : (
            /* La ligne vide : haute, pour qu’on voie qu’il manque quelque chose */
            <div className="h-12 border-b-2 border-signal" aria-hidden />
          )}
        </div>
        {!filled && (
          <span className="shrink-0 pb-2 font-mono text-sm uppercase tracking-wider" style={{ color: "var(--signal)" }}>
            Rien
          </span>
        )}
      </div>
      {caption && <p className="mt-3 text-sm text-ink-dim">{caption}</p>}
    </div>
  );
}
