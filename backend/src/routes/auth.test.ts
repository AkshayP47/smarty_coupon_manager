import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startApp, registerUser } from "../test/db";

describe("auth routes", () => {
  let api: Awaited<ReturnType<typeof startApp>>["api"];
  let stop: () => Promise<void>;

  beforeAll(async () => {
    const s = await startApp();
    api = s.api;
    stop = s.stop;
  });

  afterAll(async () => {
    await stop();
  });

  it("registers a user and returns a token", async () => {
    const { res, token } = await registerUser(api, "Ann", "ann@example.com", "password1");
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof token).toBe("string");
    expect(res.body.data.user.email).toBe("ann@example.com");
  });

  it("rejects duplicate registration", async () => {
    await registerUser(api, "Ann", "dupe@example.com", "password1");
    const res = await api
      .post("/api/auth/register")
      .send({ name: "Ann", email: "dupe@example.com", password: "password1" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects registration with missing fields", async () => {
    const res = await api.post("/api/auth/register").send({ email: "x@example.com" });
    expect(res.status).toBe(400);
  });

  it("logs in with correct credentials", async () => {
    await registerUser(api, "Bob", "bob@example.com", "password1");
    const res = await api.post("/api/auth/login").send({ email: "bob@example.com", password: "password1" });
    expect(res.status).toBe(200);
    expect(typeof res.body.data.token).toBe("string");
  });

  it("rejects login with wrong password", async () => {
    await registerUser(api, "Cat", "cat@example.com", "password1");
    const res = await api.post("/api/auth/login").send({ email: "cat@example.com", password: "nope" });
    expect(res.status).toBe(401);
  });

  it("rejects login for unknown user", async () => {
    const res = await api.post("/api/auth/login").send({ email: "ghost@example.com", password: "password1" });
    expect(res.status).toBe(401);
  });

  it("protects /profile without a token", async () => {
    const res = await api.get("/api/auth/profile");
    expect(res.status).toBe(401);
  });

  it("returns the profile with a token", async () => {
    const { token } = await registerUser(api, "Dan", "dan@example.com", "password1");
    const res = await api.get("/api/auth/profile").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("dan@example.com");
  });

  it("rejects logout without a token", async () => {
    const res = await api.post("/api/auth/logout");
    expect(res.status).toBe(401);
  });

  it("logs out with a token", async () => {
    const { token } = await registerUser(api, "Eve", "eve@example.com", "password1");
    const res = await api.post("/api/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
