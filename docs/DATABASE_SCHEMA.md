# Smart Coupon Manager Database Schema

## 1. Database

Database:

MongoDB

Recommended collections:

* users
* coupons

Additional collections may be introduced later if required.

---

# 2. Users Collection

Example document:

{
"_id": "ObjectId",
"name": "string",
"email": "string",
"passwordHash": "string",
"createdAt": "Date",
"updatedAt": "Date"
}

### Rules

* Email must be unique.
* Password must never be stored directly.
* Store only a secure password hash.
* Never return passwordHash in API responses.

---

# 3. Coupons Collection

Example document:

{
"_id": "ObjectId",
"userId": "ObjectId",
"title": "string",
"code": "string",
"description": "string",
"category": "string",
"store": "string",
"discountType": "percentage | fixed | free_shipping | other",
"discountValue": "number",
"minimumPurchase": "number | null",
"maximumDiscount": "number | null",
"validFrom": "Date | null",
"expiryDate": "Date | null",
"usageLimit": "number | null",
"remainingUses": "number | null",
"termsAndConditions": "string | null",
"source": "string | null",
"createdAt": "Date",
"updatedAt": "Date"
}

---

# 4. Ownership

Every coupon MUST contain:

userId

The userId identifies the owner.

All coupon queries must be scoped to the authenticated user.

Example concept:

Find coupon where:

_id = requestedCouponId

AND

userId = authenticatedUserId

---

# 5. Indexes

Recommended indexes:

users.email

coupons.userId

coupons.expiryDate

Additional indexes should only be added when justified by actual query patterns.

---

# 6. Schema Changes

Do not modify the database schema without updating this document first.

If an implementation requires a new field:

1. Explain why.
2. Update DATABASE_SCHEMA.md.
3. Update API_SPEC.md if required.
4. Then implement the change.

Never silently introduce fields.
