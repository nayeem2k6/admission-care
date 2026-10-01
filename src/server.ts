
import type { Server } from "node:http";
import { env } from "./config/env"; // imported first so invalid config fails fast
import { isCloudinaryConfigured } from "./config/cloudinary";
import { connectDB, disconnectDB } from "./config/db";
import app from "./app";

let server: Server | undefined;
let shuttingDown = false;

const shutdown = async (reason: string, exitCode = 0): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${reason} received. Shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    console.error("[server] Shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    const activeServer = server;
    if (activeServer) {
      await new Promise<void>((resolve, reject) => {
        activeServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await disconnectDB();
    process.exit(exitCode);
  } catch (error) {
    console.error("[server] Error during shutdown:", error);
    process.exit(1);
  }
};

const start = async (): Promise<void> => {
  await connectDB();

  if (!isCloudinaryConfigured) {
    console.warn("[cloudinary] Credentials are not set. Image uploads will be unavailable.");
  }

  server = app.listen(env.PORT, () => {
    console.log(`[server] ${env.NODE_ENV} server listening on port ${env.PORT}`);
  });
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled promise rejection:", reason);
  void shutdown("unhandledRejection", 1);
});
process.on("uncaughtException", (error) => {
  console.error("[server] Uncaught exception:", error);
  void shutdown("uncaughtException", 1);
});

start().catch((error) => {
  console.error("[server] Failed to start:", error);
  process.exit(1);
});