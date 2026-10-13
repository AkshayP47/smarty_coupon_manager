import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startApp, registerUser } from "../test/db";

const day = 86400000;

const payload = (over: Record<string, unknown> = {}) => ({
  title: "Generic coupon",
  code: "GEN1",
  description: "desc",
  category: "Misc",
  store: "StoreA",
  discountType: "percentage",
  discountValue: 10,
  ...over,
});

describe("dashboard", () => {
  let api: Awaited<ReturnType<typeof startApp>>["api"];
  let stop: () => Promise<void>;
  let token = "";
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const s = await startApp();
    api = s.api;
    stop = s.stop;
    token = (await registerUser(api, "D", "d@example.com", "password1")).token;
  });

  afterAll(async () => {
    await stop();
  });

  it("rejects unauthenticated access", async () => {
    expect((await api.get("/api/dashboard")).status).toBe(401);
  });

  it("reports zeros for a fresh user", async () => {
    const res = await api.get("/api/dashboard").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      totalCoupons: 0,
      activeCoupons: 0,
      expiredCoupons: 0,
      expiringSoon: 0,
      recentCoupons: [],
    });
  });

  it("counts active, expired and expiring-soon correctly", async () => {
    const now = Date.now();
    await api.post("/api/coupons").set(auth()).send(
      payload({ title: "Active far", code: "A1", expiryDate: new Date(now + 30 * day).toISOString() })
    );
    await api.post("/api/coupons").set(auth()).send(
      payload({ title: "Active soon", code: "A2", expiryDate: new Date(now + 3 * day).toISOString() })
    );
    await api.post("/api/coupons").set(auth()).send(
      payload({ title: "Expired", code: "E1", expiryDate: new Date(now - 2 * day).toISOString() })
    );

    const res = await api.get("/api/dashboard").set(auth());
    expect(res.body.data).toMatchObject({
      totalCoupons: 3,
      activeCoupons: 2,
      expiredCoupons: 1,
      expiringSoon: 1,
    });
  });

  it("returns at most 5 recent coupons, newest first", async () => {
    for (let i = 0; i < 4; i++) {
      await api.post("/api/coupons").set(auth()).send(payload({ title: `Extra ${i}`, code: `X${i}` }));
    }
    const res = await api.get("/api/dashboard").set(auth());
    const recent = res.body.data.recentCoupons as { code: string }[];
    expect(res.body.data.totalCoupons).toBe(7);
    expect(recent.length).toBe(5);
    expect(recent[0].code).toBe("X3");
  });
});
