import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startApp, registerUser } from "../test/db";

describe("ai proxy routes", () => {
  let api: Awaited<ReturnType<typeof startApp>>["api"];
  let stop: () => Promise<void>;
  let token = "";
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const s = await startApp();
    api = s.api;
    stop = s.stop;
    token = (await registerUser(api, "AI", "ai@example.com", "password1")).token;
    await api.post("/api/coupons").set(auth()).send({
      title: "Pizza Friday",
      code: "PIZZA5",
      description: "5 off pizza",
      category: "Food",
      store: "Dominos",
      discountType: "fixed",
      discountValue: 5,
    });
  });

  afterAll(async () => {
    await stop();
  });

  for (const path of ["/api/ai/search", "/api/ai/semantic-search"]) {
    it(`${path} rejects unauthenticated access`, async () => {
      expect((await api.post(path).send({ query: "pizza" })).status).toBe(401);
    });

    it(`${path} rejects missing query`, async () => {
      const res = await api.post(path).set(auth()).send({});
      expect(res.status).toBe(400);
    });

    it(`${path} falls back to local search when the AI service is unreachable`, async () => {
      const res = await api.post(path).set(auth()).send({ query: "pizza", limit: 10 });
      expect(res.status).toBe(200);
      expect(res.body.data.method).toBe("local-fallback");
      expect(res.body.data.coupons.map((c: { code: string }) => c.code)).toEqual(["PIZZA5"]);
    });
  }

  describe("/api/ai/extract", () => {    const png =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    it("rejects unauthenticated access", async () => {
      expect((await api.post("/api/ai/extract").send({ image: png, mimeType: "image/png" })).status).toBe(401);
    });

    it("rejects missing image", async () => {
      const res = await api.post("/api/ai/extract").set(auth()).send({ mimeType: "image/png" });
      expect(res.status).toBe(400);
    });

    it("rejects non-image mime types", async () => {
      const res = await api.post("/api/ai/extract").set(auth()).send({ image: "aGk=", mimeType: "text/plain" });
      expect(res.status).toBe(400);
    });

    it("returns 502 (never fake data) when the AI service is unreachable", async () => {
      const res = await api.post("/api/ai/extract").set(auth()).send({ image: png, mimeType: "image/png" });
      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
    });
  });

  describe("/api/ai/ask", () => {
    it("rejects unauthenticated access", async () => {
      expect((await api.post("/api/ai/ask").send({ question: "any deals?" })).status).toBe(401);
    });

    it("rejects missing question", async () => {
      const res = await api.post("/api/ai/ask").set(auth()).send({});
      expect(res.status).toBe(400);
    });

    it("returns 502 (never fake answers) when the AI service is unreachable", async () => {
      const res = await api.post("/api/ai/ask").set(auth()).send({ question: "any pizza deals?" });
      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
    });
  });
});
