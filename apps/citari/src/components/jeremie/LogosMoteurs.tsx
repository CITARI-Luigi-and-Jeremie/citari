/**
 * Logos des six moteurs interrogés.
 *
 * Portés du projet Lovable de Jérémie le 07/08/2026. Les images ont été
 * téléchargées dans `public/img/` plutôt que servies depuis le CDN de Lovable :
 * un site en production ne doit dépendre d'aucun outil de conception.
 *
 * La liste est celle qui est FIGÉE côté moteur (`src/lib/typo.ts`). Toute
 * divergence ferait afficher un moteur qu'on n'interroge pas, ou en cacherait
 * un qu'on facture.
 */

type Moteur = { nom: string; src: string; apercu: boolean };

/**
 * `apercu` marque les deux moteurs que le scan GRATUIT interroge réellement.
 *
 * Les six logos s'alignaient à l'identique sous le bouton « Lancer le scan
 * gratuit » (15/08/2026) : un visiteur en déduisait que son scan offert
 * interroge les six, alors qu'il en interroge deux — et le rapport le lui
 * dit ensuite noir sur blanc (« Claude, Perplexity, Grok, Le Chat : non »).
 * Promettre six moteurs à la porte d'entrée pour en livrer deux est
 * exactement ce que la doctrine interdit. Les deux du gratuit sont donc
 * pleins et nommés, les quatre autres atténués et annoncés comme la suite.
 */
const MOTEURS: Moteur[] = [
  { nom: "ChatGPT", src: "/img/chatgpt.svg", apercu: true },
  { nom: "Gemini", src: "/img/gemini.png", apercu: true },
  { nom: "Claude", src: "/img/claude.png", apercu: false },
  { nom: "Perplexity", src: "/img/perplexity.webp", apercu: false },
  { nom: "Grok", src: "/img/grok.png", apercu: false },
  { nom: "Le Chat", src: "/img/lechat.png", apercu: false },
];

export function LogosMoteurs({ centered = false }: { centered?: boolean }) {
  return (
    <div className={`mt-4 flex flex-col gap-2 ${centered ? "items-center" : "items-start"}`}>
      <ul className={`flex flex-wrap items-center gap-x-5 gap-y-3 ${centered ? "justify-center" : ""}`}>
        {MOTEURS.map((m, i) => (
          <li key={m.nom} className="flex items-center gap-2" title={m.nom}>
            <img
              src={m.src}
              alt={`Logo ${m.nom}`}
              width={26}
              height={26}
              loading="lazy"
              className={`h-[26px] w-[26px] shrink-0 object-contain ${m.apercu ? "" : "opacity-40"}`}
            />
            {m.apercu ? (
              <span className="mono text-[13px] font-semibold text-ink">{m.nom}</span>
            ) : null}
            {/* le séparateur tombe après le dernier moteur du gratuit */}
            {i === 1 ? <span aria-hidden className="ml-1 h-4 w-px bg-rule-strong" /> : null}
          </li>
        ))}
      </ul>
      <p className={`mono text-[12px] text-ink-2 ${centered ? "text-center" : ""}`}>
        Interrogés par votre scan gratuit. Les quatre autres au diagnostic.
      </p>
    </div>
  );
}

const PAR_NOM: Record<string, string> = {
  chatgpt: "/img/chatgpt.svg",
  claude: "/img/claude.png",
  gemini: "/img/gemini.png",
  perplexity: "/img/perplexity.webp",
  grok: "/img/grok.png",
  "le chat": "/img/lechat.png",
  lechat: "/img/lechat.png",
  mistral: "/img/lechat.png",
};

export function logoMoteurUrl(nom: string | null | undefined): string | null {
  if (!nom) return null;
  return PAR_NOM[nom.trim().toLowerCase()] ?? null;
}

/** Logo d'un moteur, sans mise en page. */
export function LogoMoteur({ nom, size = 18 }: { nom: string; size?: number }) {
  const src = logoMoteurUrl(nom);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={`Logo ${nom}`}
      width={size}
      height={size}
      loading="lazy"
      style={{ width: size, height: size, flex: "none", objectFit: "contain", display: "block" }}
    />
  );
}
