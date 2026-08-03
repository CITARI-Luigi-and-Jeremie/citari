import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient } from "@/lib/supabase-public.server";

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
    const supabase = publicClient();
    const { data: scan, error } = await supabase
      .from("scans")
      .insert({
        domain: data.domain,
        brand: data.brand,
        sector: data.sector,
        competitors: data.competitors,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: scan.id };
  });
