
import mongoose from "mongoose";
import { env } from "./env";

export type DbState = "disconnected" | "connected" | "connecting" | "disconnecting";

mongoose.set("strictQuery", true);

let listenersRegistered = false;

const registerConnectionListeners = (): void => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on("connected", () => console.log("[db] MongoDB connected"));
  mongoose.connection.on("disconnected", () => console.warn("[db] MongoDB disconnected"));
  mongoose.connection.on("error", (error) => console.error("[db] MongoDB error:", error));
};

export const connectDB = async (): Promise<void> => {
  registerConnectionListeners();
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
  });
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
};

const readyStates: Record<number, DbState> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export const getDbState = (): DbState => readyStates[mongoose.connection.readyState] ?? "disconnected";