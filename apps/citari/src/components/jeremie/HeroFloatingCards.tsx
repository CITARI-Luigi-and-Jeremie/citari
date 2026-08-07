/**
 * Cartes flottantes du hero, disposées autour du titre.
 *
 * Portées du projet Lovable de Jérémie le 07/08/2026.
 *
 * ⚠ Contenu explicitement ILLUSTRATIF, et il doit le rester : « Cabinet
 * Vaurel » est un nom fictif, les chiffres sont des exemples. La doctrine
 * d'honnêteté interdit d'afficher un résultat client — il n'y a pas encore de
 * client — et interdit tout compteur simulé présenté comme une mesure. Ces
 * cartes sont une maquette de rapport, pas un rapport.
 */

function Carte({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`float-card pointer-events-auto ${className ?? ""}`}>
      <div>{children}</div>
    </div>
  );
}

/** Filet qui se remplit quand la carte est survolée. */
function Filet({ de, vers }: { de: string; vers: string }) {
  return (
    <div className="h-[3px] w-full bg-paper-2">
      <div
        className="float-bar h-full bg-ink"
        style={{ ["--bar-w" as string]: de, ["--bar-hover" as string]: vers, width: de }}
      />
    </div>
  );
}

export function HeroFloatingCards() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden xl:block">
      <Carte className="float-card-tl">
        <p className="mono text-[12px] text-ink-2">Score de visibilité</p>
        <p className="mono float-accent mt-1 text-[30px] leading-none">34/100</p>
        <p className="mono mt-2 text-[12px] text-ink-2">Cabinet Vaurel · exemple</p>
      </Carte>

      <Carte className="float-card-bl">
        <p className="mono text-[12px] text-ink-2">Part de voix</p>
        <p className="mono float-accent mt-1 text-[24px] leading-none">7 %</p>
        <div className="mt-3 space-y-1.5">
          <div className="h-[3px] w-full bg-paper-2">
            <div
              className="float-bar h-full bg-signal"
              style={{ ["--bar-w" as string]: "7%", ["--bar-hover" as string]: "12%", width: "7%" }}
            />
          </div>
          <Filet de="28%" vers="34%" />
          <Filet de="19%" vers="24%" />
        </div>
      </Carte>

      <Carte className="float-card-tr">
        <p className="mono text-[12px] text-ink-2">Moteurs interrogés</p>
        <ul className="mono mt-2 space-y-1 text-[13px]">
          <li className="flex justify-between gap-4">
            <span>ChatGPT</span>
            <span>31</span>
          </li>
          <li className="flex justify-between gap-4">
            <span>Gemini</span>
            <span>37</span>
          </li>
          <li className="flex justify-between gap-4 text-ink-2">
            <span>Perplexity</span>
            <span>verrouillé</span>
          </li>
        </ul>
      </Carte>

      <Carte className="float-card-br">
        <p className="mono text-[12px] text-ink-2">Accès des robots d'IA</p>
        <p className="mono mt-2 text-[13px] text-signal">GPTBot bloqué</p>
        <p className="mono float-accent mt-1 text-[13px]">llms.txt absent</p>
      </Carte>
    </div>
  );
}
