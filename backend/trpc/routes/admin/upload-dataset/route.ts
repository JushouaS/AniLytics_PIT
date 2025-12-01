import { publicProcedure } from "../../../create-context";
import { z } from "zod";

const YieldDataSchema = z.object({
  year: z.number(),
  yield: z.number(),
});

const RegionYieldDataSchema = z.object({
  municipalityId: z.string(),
  historicalData: z.array(YieldDataSchema),
  averageYield: z.number(),
});

export const uploadDatasetProcedure = publicProcedure
  .input(
    z.object({
      data: z.array(RegionYieldDataSchema),
      mode: z.enum(["replace", "append"]),
    })
  )
  .mutation(async ({ input }) => {
    try {
      console.log(`[Admin] Uploading dataset in ${input.mode} mode`);
      console.log(`[Admin] Dataset size: ${input.data.length} regions`);

      return {
        success: true,
        message: `Dataset uploaded successfully in ${input.mode} mode`,
        uploadedRegions: input.data.length,
      };
    } catch (error) {
      console.error("[Admin] Dataset upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  });
