import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

// Starts an in-memory Mongo, points the app at it, and returns a
// supertest agent plus cleanup. Env must be set BEFORE importing the app
// because database.ts / auth modules read it at module load time.
export async function startApp() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  const { default: app } = await import("../app");
  await mongoose.connection.asPromise();
  const stop = async () => {
    await mongoose.disconnect();
    await mongo.stop();
  };
  return { app, api: request(app), stop };
}

export async function registerUser(
  api: ReturnType<typeof request>,
  name: string,
  email: string,
  password: string
) {
  const res = await api.post("/api/auth/register").send({ name, email, password });
  return { res, token: res.body?.data?.token as string };
}
