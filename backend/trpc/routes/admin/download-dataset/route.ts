import { publicProcedure } from "../../../create-context";
import { z } from "zod";

export const downloadDatasetProcedure = publicProcedure
  .input(
    z.object({
      format: z.enum(["csv", "json"]).default("csv"),
    })
  )
  .query(async ({ input }) => {
    try {
      console.log(`[Admin] Downloading dataset in ${input.format} format`);

      return {
        success: true,
        format: input.format,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Admin] Dataset download failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Download failed",
      };
    }
  });
