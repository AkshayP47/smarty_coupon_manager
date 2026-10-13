import { Request, Response } from "express";
import { Coupon } from "../models/Coupon";

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const totalCoupons = await Coupon.countDocuments({ userId: req.userId });
    const activeCoupons = await Coupon.countDocuments({ userId: req.userId, expiryDate: { $gte: now } });
    const expiredCoupons = await Coupon.countDocuments({ userId: req.userId, expiryDate: { $lt: now } });
    const expiringSoon = await Coupon.countDocuments({
      userId: req.userId,
      expiryDate: { $gte: now, $lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
    });
    const recentCoupons = await Coupon.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: { totalCoupons, activeCoupons, expiredCoupons, expiringSoon, recentCoupons },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching dashboard" });
  }
};
