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

type Moteur = { nom: string; src: string };

const MOTEURS: Moteur[] = [
  { nom: "ChatGPT", src: "/img/chatgpt.svg" },
  { nom: "Claude", src: "/img/claude.png" },
  { nom: "Gemini", src: "/img/gemini.png" },
  { nom: "Perplexity", src: "/img/perplexity.webp" },
  { nom: "Grok", src: "/img/grok.png" },
  { nom: "Le Chat", src: "/img/lechat.png" },
];

export function LogosMoteurs({ centered = false }: { centered?: boolean }) {
  return (
    <ul
      className={`mt-3 flex flex-wrap items-center gap-x-6 gap-y-4 ${
        centered ? "justify-center" : ""
      }`}
    >
      {MOTEURS.map((m) => (
        <li key={m.nom} className="flex items-center" title={m.nom}>
          <img
            src={m.src}
            alt={`Logo ${m.nom}`}
            width={26}
            height={26}
            loading="lazy"
            className="h-[26px] w-[26px] shrink-0 object-contain"
          />
        </li>
      ))}
    </ul>
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
