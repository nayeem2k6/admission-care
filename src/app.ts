import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { apiLimiter } from "./middleware/rateLimiters";
import routes from "./routes";
import { sendSuccess } from "./utils/sendResponse";

const app = express();

app.set("trust proxy", env.TRUST_PROXY_HOPS);

app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());

if (env.NODE_ENV !== "test") {
  app.use(morgan(env.isProduction ? "combined" : "dev"));
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  sendSuccess(res, {
    message: "Bipu L's Admission Care API is running",
    data: { health: "/api/health" },
  });
});

app.use("/api", apiLimiter);
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;