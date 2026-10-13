export interface Coupon {
  _id: string;
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
  validFrom: string | null;
  expiryDate: string | null;
  usageLimit: number | null;
  remainingUses: number | null;
  termsAndConditions: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  expiringSoon: number;
  recentCoupons: Coupon[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface User {
  id: string;
  name: string;
  email: string;
}
