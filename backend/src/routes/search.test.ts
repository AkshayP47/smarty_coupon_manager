import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startApp, registerUser } from "../test/db";

const payload = (over: Record<string, unknown> = {}) => ({
  title: "Generic coupon",
  code: "GEN1",
  description: "A generic coupon",
  category: "Misc",
  store: "StoreA",
  discountType: "percentage",
  discountValue: 10,
  ...over,
});

describe("coupon search & filtering", () => {
  let api: Awaited<ReturnType<typeof startApp>>["api"];
  let stop: () => Promise<void>;
  let token = "";
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const s = await startApp();
    api = s.api;
    stop = s.stop;
    token = (await registerUser(api, "S", "s@example.com", "password1")).token;
    await api.post("/api/coupons").set(auth()).send(
      payload({ title: "Amazon 20% Off", code: "SAVE20", store: "Amazon", category: "Electronics", description: "20 percent off electronics", discountType: "percentage" })
    );
    await api.post("/api/coupons").set(auth()).send(
      payload({ title: "Pizza Friday", code: "PIZZA5", store: "Dominos", category: "Food", description: "5 dollars off pizza", discountType: "fixed", discountValue: 5 })
    );
    await api.post("/api/coupons").set(auth()).send(
      payload({ title: "Free delivery weekend", code: "SHIPFREE", store: "Amazon", category: "Electronics", description: "free shipping", discountType: "free_shipping", discountValue: 0 })
    );
  });

  afterAll(async () => {
    await stop();
  });

  const codes = (body: { data: { coupons: { code: string }[] } }) =>
    body.data.coupons.map((c) => c.code);

  it("searches by title", async () => {
    const res = await api.get("/api/coupons?search=pizza").set(auth());
    expect(codes(res.body)).toEqual(["PIZZA5"]);
  });

  it("searches by code and store (case-insensitive)", async () => {
    const byCode = await api.get("/api/coupons?search=save20").set(auth());
    expect(codes(byCode.body)).toEqual(["SAVE20"]);
    const byStore = await api.get("/api/coupons?search=amazon").set(auth());
    expect(codes(byStore.body).sort()).toEqual(["SAVE20", "SHIPFREE"]);
  });

  it("searches description and category", async () => {
    const byDesc = await api.get("/api/coupons?search=shipping").set(auth());
    expect(codes(byDesc.body)).toEqual(["SHIPFREE"]);
    const byCat = await api.get("/api/coupons?search=food").set(auth());
    expect(codes(byCat.body)).toEqual(["PIZZA5"]);
  });

  it("returns empty for no match", async () => {
    const res = await api.get("/api/coupons?search=zzz-no-such-thing").set(auth());
    expect(res.body.data.coupons).toEqual([]);
  });

  it("filters by category and store", async () => {
    const cat = await api.get("/api/coupons?category=Food").set(auth());
    expect(codes(cat.body)).toEqual(["PIZZA5"]);
    const store = await api.get("/api/coupons?store=Dominos").set(auth());
    expect(codes(store.body)).toEqual(["PIZZA5"]);
  });

  it("filters by discount type", async () => {
    const fixed = await api.get("/api/coupons?discountType=fixed").set(auth());
    expect(codes(fixed.body)).toEqual(["PIZZA5"]);
    const ship = await api.get("/api/coupons?discountType=free_shipping").set(auth());
    expect(codes(ship.body)).toEqual(["SHIPFREE"]);
  });

  it("combines search with filters", async () => {
    const res = await api.get("/api/coupons?search=amazon&discountType=percentage").set(auth());
    expect(codes(res.body)).toEqual(["SAVE20"]);
  });
});
