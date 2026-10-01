import type { Request, Response } from "express";
import { env } from "../config/env";
import { getDbState } from "../config/db";
import { sendSuccess } from "../utils/sendResponse";

export const getHealth = (req: Request, res: Response): void => {
  const database = getDbState();

  sendSuccess(res, {
    message: "Service is running",
    data: {
      status: database === "connected" ? "ok" : "degraded",
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database,
      // Exposed outside production only, to verify TRUST_PROXY_HOPS during setup.
      ...(env.isProduction ? {} : { ip: req.ip }),
    },
  });
};