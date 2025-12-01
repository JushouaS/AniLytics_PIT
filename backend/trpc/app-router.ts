import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { uploadDatasetProcedure } from "./routes/admin/upload-dataset/route";
import { downloadDatasetProcedure } from "./routes/admin/download-dataset/route";
import {
  createBackupProcedure,
  restoreBackupProcedure,
} from "./routes/admin/backup/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  admin: createTRPCRouter({
    uploadDataset: uploadDatasetProcedure,
    downloadDataset: downloadDatasetProcedure,
    createBackup: createBackupProcedure,
    restoreBackup: restoreBackupProcedure,
  }),
});

export type AppRouter = typeof appRouter;
