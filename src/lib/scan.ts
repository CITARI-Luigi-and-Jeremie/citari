/**
 * Point d'intégration unique de la soumission du scan.
 * Le payload et l'endpoint restent centralisés ici : le découpage
 * du formulaire en deux étapes est purement visuel.
 */

export type ScanPayload = {
  domain: string;
  brand: string;
  sector: string;
  competitors: string[];
};

export async function submitScan(payload: ScanPayload) {
  const response = await fetch("/api/public/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("scan_submit_failed");
  }

  return response.json();
}

export function brandFromDomain(domain: string) {
  const host = domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0];
  const label = host.split(".")[0] ?? "";
  if (!label) return "";
  return label
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
