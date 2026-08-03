import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getScan = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { readScanLive } = await import("@/lib/scan-live.server");
    const live = await readScanLive(data.id);
    if (!live) return null;

    let verbatimCount = 0;
    if (live.scan.status === "done") {
      const { countVerbatims } = await import("@/lib/scan-verbatims.server");
      verbatimCount = await countVerbatims(data.id);
    }
    return { ...live, verbatimCount };
  });

export const saveScanLead = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        scanId: z.string().uuid(),
        email: z.string().trim().email().max(255),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { insertScanLead } = await import("@/lib/scan-live.server");
    const { buildVerbatims } = await import("@/lib/scan-verbatims.server");
    await insertScanLead(data.scanId, data.email);
    return { verbatims: await buildVerbatims(data.scanId) };
  });
