import mongoose, { Schema, Document } from "mongoose";

interface ICoupon extends Document {
  userId: string;
  title: string;
  code: string;
  description: string;
  category: string;
  store: string;
  discountType: "percentage" | "fixed" | "free_shipping" | "other";
  discountValue: number;
  minimumPurchase: number | null;
  maximumDiscount: number | null;
  validFrom: Date | null;
  expiryDate: Date | null;
  usageLimit: number | null;
  remainingUses: number | null;
  termsAndConditions: string | null;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    store: { type: String, required: true, trim: true },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping", "other"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    minimumPurchase: { type: Number, default: null },
    maximumDiscount: { type: Number, default: null },
    validFrom: { type: Date, default: null },
    expiryDate: { type: Date, default: null, index: true },
    usageLimit: { type: Number, default: null },
    remainingUses: { type: Number, default: null },
    termsAndConditions: { type: String, default: null },
    source: { type: String, default: null },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model<ICoupon>("Coupon", CouponSchema);
