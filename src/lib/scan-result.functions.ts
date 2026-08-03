import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicClient } from "@/lib/supabase-public.server";


export const getScan = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: scan, error } = await supabase
      .from("scans")
      .select("id, brand, domain, status, score, score_detail, share_of_voice, responses")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return scan;
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
    const supabase = publicClient();
    const { error } = await supabase
      .from("scan_leads")
      .insert({ scan_id: data.scanId, email: data.email.toLowerCase() });

    if (error) throw new Error(error.message);
    return { ok: true };
  });
