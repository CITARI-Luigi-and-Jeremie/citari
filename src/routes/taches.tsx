import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  basculerTache,
  creerTache,
  libelleTag,
  listerTaches,
  supprimerTache,
  TAGS,
  type Tache,
} from "@/lib/taches";

export const Route = createFileRoute("/taches")({
  component: Taches,
  head: () => ({
    meta: [
      { title: "Tâches — organiseur rapide inspiré de Linear" },
      {
        name: "description",
        content:
          "Une to-do list minimaliste et rapide : ajout instantané, étiquettes, filtres et bascule terminé/à faire, sur mobile comme sur desktop.",
      },
      { property: "og:title", content: "Tâches — organiseur rapide inspiré de Linear" },
      {
        property: "og:description",
        content: "To-do list minimaliste : étiquettes, filtres et bascule terminé/à faire.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Filtre = "toutes" | "encours" | "terminees";

function Taches() {
  const qc = useQueryClient();
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [tagActif, setTagActif] = useState<string | null>(null);

  const { data: taches = [], isLoading } = useQuery({
    queryKey: ["taches"],
    queryFn: listerTaches,
  });

  const invalider = () => qc.invalidateQueries({ queryKey: ["taches"] });

  const ajout = useMutation({ mutationFn: creerTache, onSuccess: invalider });
  const bascule = useMutation({ mutationFn: basculerTache, onSuccess: invalider });
  const suppression = useMutation({ mutationFn: supprimerTache, onSuccess: invalider });

  const visibles = taches.filter((t) => {
    if (filtre === "encours" && t.completed) return false;
    if (filtre === "terminees" && !t.completed) return false;
    if (tagActif && !t.tags.includes(tagActif)) return false;
    return true;
  });

  const restantes = taches.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-lin-bg font-sans text-lin-text">
      <div className="mx-auto w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6 sm:pb-16 sm:pt-12">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="truncate font-sans text-[22px] font-semibold tracking-tight sm:text-[26px]">
              Mes tâches
            </h1>
            <p className="mt-1 text-[13px] text-lin-text-3">
              {isLoading ? "Chargement…" : `${restantes} en cours · ${taches.length} au total`}
            </p>
          </div>
          <Link
            to="/"
            className="shrink-0 rounded-md border border-lin-line px-3 py-1.5 text-[12px] text-lin-text-2 transition-colors duration-200 hover:bg-lin-panel-2 hover:text-lin-text"
          >
            Accueil
          </Link>
        </header>

        <ChampAjout
          onAjouter={(title, tags) => ajout.mutate({ title, tags })}
          enCours={ajout.isPending}
        />

        <FiltreTags actif={tagActif} onChange={setTagActif} />

        <ul className="mt-5 space-y-2">
          {visibles.map((t) => (
            <LigneTache
              key={t.id}
              tache={t}
              onBascule={() => bascule.mutate({ id: t.id, completed: !t.completed })}
              onSupprimer={() => suppression.mutate(t.id)}
            />
          ))}
        </ul>

        {!isLoading && visibles.length === 0 && (
          <p className="mt-12 text-center text-[14px] text-lin-text-3">
            Rien ici. Ajoutez une première tâche ci-dessus.
          </p>
        )}
      </div>

      <NavBasse filtre={filtre} onChange={setFiltre} compteur={restantes} />
    </div>
  );
}

/* ---------------- Ajout ---------------- */

function ChampAjout({
  onAjouter,
  enCours,
}: {
  onAjouter: (title: string, tags: string[]) => void;
  enCours: boolean;
}) {
  const [titre, setTitre] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const basculerTag = (id: string) =>
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const envoyer = () => {
    const t = titre.trim();
    if (!t) return;
    onAjouter(t, tags);
    setTitre("");
    setTags([]);
  };

  return (
    <div className="mt-6 rounded-xl border border-lin-line bg-lin-panel p-3 transition-all duration-300 focus-within:border-lin-accent">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-lin-accent-soft text-[15px] leading-none text-lin-accent">
          +
        </span>
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && envoyer()}
          placeholder="Nouvelle tâche…"
          aria-label="Titre de la tâche"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-lin-text outline-none placeholder:text-lin-text-3"
        />
        <button
          type="button"
          onClick={envoyer}
          disabled={enCours || !titre.trim()}
          className="shrink-0 rounded-md bg-lin-accent px-3 py-1.5 text-[13px] font-medium text-lin-text transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
        >
          Ajouter
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-lin-line pt-3">
        {TAGS.map((tag) => {
          const on = tags.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              aria-pressed={on}
              onClick={() => basculerTag(tag.id)}
              className={`rounded-full border px-2.5 py-1 text-[12px] transition-all duration-200 hover:scale-105 ${
                on
                  ? "border-lin-accent bg-lin-accent-soft text-lin-text"
                  : "border-lin-line text-lin-text-3 hover:text-lin-text-2"
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Filtre par étiquette ---------------- */

function FiltreTags({
  actif,
  onChange,
}: {
  actif: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`rounded-full px-2.5 py-1 text-[12px] transition-all duration-200 hover:scale-105 ${
          actif === null ? "bg-lin-panel-2 text-lin-text" : "text-lin-text-3 hover:text-lin-text-2"
        }`}
      >
        Toutes les étiquettes
      </button>
      {TAGS.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onChange(actif === tag.id ? null : tag.id)}
          className={`rounded-full px-2.5 py-1 text-[12px] transition-all duration-200 hover:scale-105 ${
            actif === tag.id
              ? "bg-lin-accent-soft text-lin-text"
              : "text-lin-text-3 hover:text-lin-text-2"
          }`}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Ligne ---------------- */

function LigneTache({
  tache,
  onBascule,
  onSupprimer,
}: {
  tache: Tache;
  onBascule: () => void;
  onSupprimer: () => void;
}) {
  return (
    <li className="group animate-fade-in rounded-xl border border-lin-line bg-lin-panel transition-all duration-200 hover:scale-105 hover:border-lin-accent hover:shadow-lift">
      <div className="flex items-start gap-3 p-3">
        <button
          type="button"
          onClick={onBascule}
          aria-label={tache.completed ? "Marquer comme à faire" : "Marquer comme terminée"}
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] transition-all duration-200 hover:scale-105 ${
            tache.completed
              ? "border-lin-accent bg-lin-accent text-lin-text"
              : "border-lin-line text-transparent hover:border-lin-accent"
          }`}
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[15px] leading-snug transition-colors duration-200 ${
              tache.completed ? "text-lin-text-3 line-through" : "text-lin-text"
            }`}
          >
            {tache.title}
          </p>
          {tache.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {tache.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-lin-panel-2 px-2 py-0.5 text-[11px] text-lin-text-2"
                >
                  {libelleTag(tag)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onBascule}
            className="rounded-md px-2 py-1 text-[12px] text-lin-text-3 transition-colors duration-200 hover:bg-lin-panel-2 hover:text-lin-text"
          >
            {tache.completed ? "Annuler" : "Terminer"}
          </button>
          <button
            type="button"
            onClick={onSupprimer}
            aria-label="Supprimer la tâche"
            className="rounded-md px-2 py-1 text-[12px] text-lin-text-3 opacity-0 transition-all duration-200 focus:opacity-100 hover:text-destructive group-hover:opacity-100"
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  );
}

/* ---------------- Nav basse ---------------- */

function NavBasse({
  filtre,
  onChange,
  compteur,
}: {
  filtre: Filtre;
  onChange: (f: Filtre) => void;
  compteur: number;
}) {
  const items: Array<[Filtre, string]> = [
    ["toutes", "Toutes"],
    ["encours", "En cours"],
    ["terminees", "Terminées"],
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-lin-line bg-lin-bg/90 backdrop-blur-md sm:static sm:mx-auto sm:mb-12 sm:max-w-2xl sm:rounded-xl sm:border">
      <div className="mx-auto grid max-w-2xl grid-cols-3 px-2 py-2 sm:px-3">
        {items.map(([id, label]) => {
          const on = filtre === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`rounded-lg px-2 py-2 text-[12px] font-medium transition-all duration-200 hover:scale-105 ${
                on ? "bg-lin-panel-2 text-lin-text" : "text-lin-text-3 hover:text-lin-text-2"
              }`}
            >
              {label}
              {id === "encours" && compteur > 0 ? ` · ${compteur}` : ""}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
