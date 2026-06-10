# SECURITY ADVISORY: CRITICAL VULNERABILITY (PAYMENT MANIPULATION)

**Priority:** Critical
**Status:** Frontend Hardened, Backend Fix REQUIRED

## 1. Vulnerability Summary
A malicious user can manipulate the `amount` field in the `/api/payment/razorpay/order` request to pay any arbitrary amount (e.g., ₹1) for any product. 

**Root Cause:** The backend currently trusts the `amount` field provided by the client-side application.

## 2. Mandatory Backend Actions (Immediate)

### A. Ignore Client-Side `amount`
The backend MUST NOT use the `amount` field sent in the request body for creating the Razorpay order. It should be used for logging/debugging ONLY.

### B. Server-Side Price Calculation
1. **Fetch Cart:** Use the provided `sessionId`, `cartId`, or `userId` to fetch the current cart items from Shopify or the MongoDB database.
2. **Fetch Official Prices:** Get the latest prices for each `variantId` directly from Shopify or your pricing engine.
3. **Verify Coupons:** Validate the `appliedCoupon` code via Shopify Storefront/Admin API.
4. **Verify Loyalty Points:**
   - Call the Nector API/Proxy with the user's ID.
   - Verify that the user has sufficient balance for the requested `coin_value`.
   - Ensure the `fiat_value` matches the official conversion rate.
5. **Final Sum:** Calculate the final amount on the server: `Sum(Items) + Insurance - Discounts - Points`.

### C. Razorpay Order Creation
Use the **calculated server-side amount** to call the Razorpay API.

## 3. Frontend Hardening Applied
- Added `src/utils/security.js` to perform pre-payment balance checks.
- Refactored `payment/page.js` to perform a "fresh fetch" of the cart before initiating payment.
- Updated payload to include more metadata for backend verification.

## 4. Contact
Please coordinate with the frontend team to sync on the recalculation logic.
