/**
 * Quadrillage décoratif, reprise du fond de l'écran de scan.
 *
 * Porté du projet Lovable de Jérémie le 14/08/2026. Deux variantes :
 * - `clair` : lignes d'encre très faibles sur fond papier, fixe.
 * - `sombre` : lignes papier sur fond encre, dérive verticale lente.
 *
 * Le parent doit être `relative overflow-hidden`.
 * Purement décoratif : aucune donnée, aucune interaction.
 */

const CSS = `
@keyframes citQuadDerive{0%{transform:translateY(0)}100%{transform:translateY(44px)}}

.quad{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.quad-lignes{position:absolute;inset:-60px}

.quad-clair .quad-lignes{opacity:0.055;
  background-image:linear-gradient(#17160F 1px, transparent 1px), linear-gradient(90deg, #17160F 1px, transparent 1px);
  background-size:44px 44px}

.quad-sombre{background:#17160F}
.quad-sombre .quad-lignes{opacity:0.075;
  background-image:linear-gradient(#F2F0EA 1px, transparent 1px), linear-gradient(90deg, #F2F0EA 1px, transparent 1px);
  background-size:44px 44px;animation:citQuadDerive 5.5s linear infinite}

.quad-halo{position:absolute;inset:0}
.quad-sombre .quad-halo{background:radial-gradient(ellipse at 50% 40%, rgba(242,240,234,0.07) 0%, rgba(23,22,15,0) 62%)}
.quad-clair .quad-halo{background:radial-gradient(ellipse at 50% 45%, rgba(23,22,15,0) 45%, #FBFAF7 100%)}

@media (prefers-reduced-motion:reduce){.quad-sombre .quad-lignes{animation:none}}
`;

export function Quadrillage({
  variante = "clair",
  halo = true,
}: {
  variante?: "clair" | "sombre";
  halo?: boolean;
}) {
  return (
    <div className={`quad quad-${variante}`} aria-hidden="true">
      <style>{CSS}</style>
      <div className="quad-lignes" />
      {halo ? <div className="quad-halo" /> : null}
    </div>
  );
}
