import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createScan = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        domain: z.string().trim().min(3).max(255),
        brand: z.string().trim().min(1).max(120),
        sector: z.string().trim().min(1).max(120),
        competitors: z.array(z.string().trim().min(1).max(255)).max(3),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { insertScan } = await import("@/lib/scan-live.server");
    return insertScan(data);
  });

