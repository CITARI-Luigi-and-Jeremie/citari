/**
 * Décor sombre quadrillé de la séquence de résultat, reprise du fond de
 * l'écran de scan. Purement décoratif.
 */
const CSS = `
@keyframes citRapportGrille{0%{transform:translateY(0)}100%{transform:translateY(44px)}}
.rap-fond{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:var(--ink)}
.rap-grille{position:absolute;inset:-60px;opacity:0.075;
  background-image:linear-gradient(#F2F0EA 1px, transparent 1px), linear-gradient(90deg, #F2F0EA 1px, transparent 1px);
  background-size:44px 44px;animation:citRapportGrille 5.5s linear infinite}
.rap-halo{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%, rgba(242,240,234,0.07) 0%, rgba(23,22,15,0) 62%)}
@media (prefers-reduced-motion:reduce){.rap-grille{animation:none}}
`;

export function GrilleFond() {
  return (
    <div className="rap-fond" aria-hidden="true">
      <style>{CSS}</style>
      <div className="rap-grille" />
      <div className="rap-halo" />
    </div>
  );
}
