import { Request, Response as ExpressResponse } from "express";
import { Coupon } from "../models/Coupon";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const localKeywordSearch = (query: string, coupons: any[], limit: number) => {
  const tokens = (query.toLowerCase().match(/\w+/g) || []).filter(Boolean);
  if (tokens.length === 0) return coupons.slice(0, limit);
  const scored = coupons
    .map((c) => {
      const hay = [c.title, c.code, c.store, c.category, c.description, c.discountType]
        .map((v) => String(v ?? ""))
        .join(" ")
        .toLowerCase();
      const score = tokens.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
      return { c, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.c);
};

export const aiSearch = async (req: Request, res: ExpressResponse) => {
  await runAiSearch("/search", req, res, "Error performing AI search");
};

export const semanticSearch = async (req: Request, res: ExpressResponse) => {
  await runAiSearch("/semantic-search", req, res, "Error performing semantic search");
};

export const extractCoupon = async (req: Request, res: ExpressResponse) => {  try {
    const { image, mimeType } = req.body;
    if (!image || typeof image !== "string") {
      res.status(400).json({ success: false, message: "Image is required" });
      return;
    }
    if (!mimeType || typeof mimeType !== "string" || !mimeType.startsWith("image/")) {
      res.status(400).json({ success: false, message: "A valid image mimeType is required" });
      return;
    }
    if (image.length > 7000000) {
      res.status(400).json({ success: false, message: "Image too large" });
      return;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const aiRes: any = await fetch(`${AI_SERVICE_URL}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mimeType }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (aiRes.ok) {
        const aiJson: any = await aiRes.json();
        if (aiJson?.success) {
          res.json({ success: true, data: aiJson.data });
          return;
        }
        res.status(502).json({
          success: false,
          message: aiJson?.message ?? "AI extraction failed",
        });
        return;
      }
    } catch {
      // fall through to 502 below
    }

    res.status(502).json({ success: false, message: "AI extraction unavailable" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error performing AI extraction" });
  }
};

const runAiSearch = async (
  endpoint: string,
  req: Request,
  res: ExpressResponse,
  errorMessage: string
) => {
  try {
    const { query, limit } = req.body;
    if (!query || typeof query !== "string" || !query.trim()) {
      res.status(400).json({ success: false, message: "Query is required" });
      return;
    }
    const n = Math.max(1, Math.min(Number(limit) || 10, 50));

    const coupons = await Coupon.find({ userId: req.userId }).lean();
    const slim = coupons.map((c: any) => ({
      _id: String(c._id),
      title: c.title ?? "",
      code: c.code ?? "",
      store: c.store ?? "",
      category: c.category ?? "",
      description: c.description ?? "",
      discountType: c.discountType ?? "",
    }));

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const aiRes: any = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, coupons: slim, limit: n }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (aiRes.ok) {
        const aiJson: any = await aiRes.json();
        if (aiJson?.success) {
          const ids = new Set<string>(
            (aiJson.data.coupons || []).map((c: any) => String(c._id ?? c.id ?? ""))
          );
          const byId = new Map(coupons.map((c: any) => [String(c._id), c]));
          const ranked = [...ids].map((id) => byId.get(id)).filter(Boolean);
          res.json({
            success: true,
            data: { coupons: ranked, method: aiJson.data.method ?? "ai" },
          });
          return;
        }
      }
    } catch {
      // fall through to local search below
    }

    res.json({
      success: true,
      data: { coupons: localKeywordSearch(query, coupons, n), method: "local-fallback" },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: errorMessage });
  }
};

export const askQuestion = async (req: Request, res: ExpressResponse) => {
  try {
    const { question, limit } = req.body;
    if (!question || typeof question !== "string" || !question.trim()) {
      res.status(400).json({ success: false, message: "Question is required" });
      return;
    }
    const n = Math.max(1, Math.min(Number(limit) || 10, 50));

    const coupons = await Coupon.find({ userId: req.userId }).lean();
    const slim = coupons.map((c: any) => ({
      _id: String(c._id),
      title: c.title ?? "",
      code: c.code ?? "",
      store: c.store ?? "",
      category: c.category ?? "",
      description: c.description ?? "",
      discountType: c.discountType ?? "",
      discountValue: c.discountValue ?? "",
      expiryDate: c.expiryDate ? String(c.expiryDate) : "",
    }));

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const aiRes: any = await fetch(`${AI_SERVICE_URL}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, coupons: slim, limit: n }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (aiRes.ok) {
        const aiJson: any = await aiRes.json();
        if (aiJson?.success) {
          const byId = new Map(coupons.map((c: any) => [String(c._id), c]));
          const cited = ((aiJson.data.coupons || []) as any[])
            .map((c: any) => byId.get(String(c._id ?? c.id ?? "")))
            .filter(Boolean);
          res.json({
            success: true,
            data: { answer: aiJson.data.answer ?? "", coupons: cited, model: aiJson.data.model ?? "" },
          });
          return;
        }
        res.status(502).json({ success: false, message: aiJson?.message ?? "AI answering failed" });
        return;
      }
    } catch {
      // fall through to 502 below
    }

    res.status(502).json({ success: false, message: "AI answering unavailable" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error answering question" });
  }
};
