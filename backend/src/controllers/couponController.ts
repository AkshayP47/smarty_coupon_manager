import { Request, Response } from "express";
import { Coupon } from "../models/Coupon";

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { title, code, description, category, store, discountType, discountValue, minimumPurchase, maximumDiscount, validFrom, expiryDate, usageLimit, termsAndConditions, source } = req.body;

    if (!title || !code || !category || !store || !discountType || discountValue === undefined) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const coupon = await Coupon.create({
      userId: req.userId,
      title,
      code,
      description,
      category,
      store,
      discountType,
      discountValue,
      minimumPurchase: minimumPurchase ?? null,
      maximumDiscount: maximumDiscount ?? null,
      validFrom: validFrom ?? null,
      expiryDate: expiryDate ?? null,
      usageLimit: usageLimit ?? null,
      remainingUses: usageLimit ?? null,
      termsAndConditions: termsAndConditions ?? null,
      source: source ?? null,
    });

    res.status(201).json({ success: true, message: "Coupon created successfully", data: { coupon } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating coupon" });
  }
};

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const { search, category, store, status, discountType, expiryBefore, expiryAfter } = req.query;

    const filter: any = { userId: req.userId };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { store: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) filter.category = category;
    if (store) filter.store = store;
    if (discountType) filter.discountType = discountType;

    if (status === "active") {
      filter.expiryDate = { ...(filter.expiryDate ?? {}), $gte: new Date() };
    } else if (status === "expired") {
      filter.expiryDate = { ...(filter.expiryDate ?? {}), $lt: new Date() };
    }

    if (expiryBefore !== undefined) {
      const d = new Date(expiryBefore as string);
      if (isNaN(d.getTime())) {
        res.status(400).json({ success: false, message: "Invalid expiryBefore date" });
        return;
      }
      filter.expiryDate = { ...(filter.expiryDate ?? {}), $lte: d };
    }

    if (expiryAfter !== undefined) {
      const d = new Date(expiryAfter as string);
      if (isNaN(d.getTime())) {
        res.status(400).json({ success: false, message: "Invalid expiryAfter date" });
        return;
      }
      filter.expiryDate = { ...(filter.expiryDate ?? {}), $gte: d };
    }

    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, data: { coupons } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching coupons" });
  }
};

export const getCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, userId: req.userId });
    if (!coupon) {
      res.status(404).json({ success: false, message: "Coupon not found" });
      return;
    }
    res.json({ success: true, data: { coupon } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching coupon" });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const { title, code, description, category, store, discountType, discountValue, minimumPurchase, maximumDiscount, validFrom, expiryDate, usageLimit, termsAndConditions, source } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (store !== undefined) updateData.store = store;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (minimumPurchase !== undefined) updateData.minimumPurchase = minimumPurchase;
    if (maximumDiscount !== undefined) updateData.maximumDiscount = maximumDiscount;
    if (validFrom !== undefined) updateData.validFrom = validFrom;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (termsAndConditions !== undefined) updateData.termsAndConditions = termsAndConditions;
    if (source !== undefined) updateData.source = source;

    const coupon = await Coupon.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      res.status(404).json({ success: false, message: "Coupon not found" });
      return;
    }

    res.json({ success: true, message: "Coupon updated successfully", data: { coupon } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating coupon" });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!coupon) {
      res.status(404).json({ success: false, message: "Coupon not found" });
      return;
    }
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting coupon" });
  }
};
