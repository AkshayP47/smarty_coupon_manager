import { Router } from "express";
import { createCoupon, getCoupons, getCoupon, updateCoupon, deleteCoupon } from "../controllers/couponController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.route("/").get(getCoupons).post(createCoupon);
router.route("/:id").get(getCoupon).put(updateCoupon).delete(deleteCoupon);

export default router;
