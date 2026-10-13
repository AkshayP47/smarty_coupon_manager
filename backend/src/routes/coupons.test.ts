import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startApp, registerUser } from "../test/db";

const payload = (over: Record<string, unknown> = {}) => ({
  title: "Amazon 20% Off",
  code: "SAVE20",
  description: "20% discount",
  category: "Electronics",
  store: "Amazon",
  discountType: "percentage",
  discountValue: 20,
  ...over,
});

describe("coupon routes + ownership", () => {
  let api: Awaited<ReturnType<typeof startApp>>["api"];
  let stop: () => Promise<void>;
  let tokenA = "";
  let tokenB = "";

  beforeAll(async () => {
    const s = await startApp();
    api = s.api;
    stop = s.stop;
    tokenA = (await registerUser(api, "A", "a@example.com", "password1")).token;
    tokenB = (await registerUser(api, "B", "b@example.com", "password1")).token;
  });

  afterAll(async () => {
    await stop();
  });

  it("rejects unauthenticated access", async () => {
    expect((await api.get("/api/coupons")).status).toBe(401);
    expect((await api.post("/api/coupons").send(payload())).status).toBe(401);
  });

  it("creates and reads a coupon", async () => {
    const created = await api
      .post("/api/coupons")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(payload());
    expect(created.status).toBe(201);
    const id = created.body.data.coupon._id;

    const one = await api.get(`/api/coupons/${id}`).set("Authorization", `Bearer ${tokenA}`);
    expect(one.status).toBe(200);
    expect(one.body.data.coupon.code).toBe("SAVE20");

    const list = await api.get("/api/coupons").set("Authorization", `Bearer ${tokenA}`);
    expect(list.body.data.coupons.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects creation with missing fields", async () => {
    const res = await api
      .post("/api/coupons")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "incomplete" });
    expect(res.status).toBe(400);
  });

  it("hides user A's coupons from user B (read/update/delete)", async () => {
    const created = await api
      .post("/api/coupons")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(payload({ title: "Private deal", code: "PRIV1" }));
    const id = created.body.data.coupon._id;

    expect((await api.get(`/api/coupons/${id}`).set("Authorization", `Bearer ${tokenB}`)).status).toBe(404);
    expect(
      (await api.put(`/api/coupons/${id}`).set("Authorization", `Bearer ${tokenB}`).send({ title: "Hijacked" })).status
    ).toBe(404);
    expect((await api.delete(`/api/coupons/${id}`).set("Authorization", `Bearer ${tokenB}`)).status).toBe(404);
  });

  it("updates and deletes the owner's own coupon", async () => {
    const created = await api
      .post("/api/coupons")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(payload({ title: "To edit", code: "EDIT1" }));
    const id = created.body.data.coupon._id;

    const updated = await api
      .put(`/api/coupons/${id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Edited" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.coupon.title).toBe("Edited");

    const deleted = await api.delete(`/api/coupons/${id}`).set("Authorization", `Bearer ${tokenA}`);
    expect(deleted.status).toBe(200);
    expect((await api.get(`/api/coupons/${id}`).set("Authorization", `Bearer ${tokenA}`)).status).toBe(404);
  });

  it("filters by status and expiry range", async () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const future = new Date(Date.now() + 86400000).toISOString();
    await api.post("/api/coupons").set("Authorization", `Bearer ${tokenB}`).send(payload({ title: "Old deal", code: "OLD9", expiryDate: past }));
    await api.post("/api/coupons").set("Authorization", `Bearer ${tokenB}`).send(payload({ title: "New deal", code: "NEW9", expiryDate: future }));

    const active = await api.get("/api/coupons?status=active").set("Authorization", `Bearer ${tokenB}`);
    const activeCodes = active.body.data.coupons.map((c: { code: string }) => c.code);
    expect(activeCodes).toContain("NEW9");
    expect(activeCodes).not.toContain("OLD9");

    const ranged = await api
      .get(`/api/coupons?expiryAfter=${encodeURIComponent(new Date().toISOString())}`)
      .set("Authorization", `Bearer ${tokenB}`);
    const rangedCodes = ranged.body.data.coupons.map((c: { code: string }) => c.code);
    expect(rangedCodes).toContain("NEW9");

    const bad = await api.get("/api/coupons?expiryBefore=not-a-date").set("Authorization", `Bearer ${tokenB}`);
    expect(bad.status).toBe(400);
  });
});
