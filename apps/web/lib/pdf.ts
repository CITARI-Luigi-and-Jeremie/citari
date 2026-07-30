/**
 * Génération du PDF du rapport via Playwright (best-effort).
 * Nécessite `pnpm --filter web exec playwright install chromium` en local/CI.
 * Retourne null si Playwright indisponible — l'email part alors sans pièce jointe.
 */
export async function renderReportPdf(reportUrl: string): Promise<Buffer | null> {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto(reportUrl, { waitUntil: "networkidle", timeout: 30_000 });
      const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "16mm", bottom: "16mm" } });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } catch (e) {
    console.warn("[pdf] génération impossible:", String(e).slice(0, 200));
    return null;
  }
}
