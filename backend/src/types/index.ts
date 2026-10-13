export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponDocument {
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

export interface DashboardStats {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  expiringSoon: number;
  recentCoupons: CouponDocument[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
