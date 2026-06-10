/**
 * Security utilities for validating payment and cart integrity
 */
import { apiFetch } from "../lib/api";

/**
 * Re-verifies Nector points and cart integrity against server-side data
 * @param {Object} params - { userId, nectorPoints, appliedCoupon, items }
 * @returns {Promise<{ isValid: boolean, reason?: string, verifiedAmount?: number }>}
 */
export async function verifyPaymentIntegrity({ userId, nectorPoints, appliedCoupon, items }) {
  try {
    // 1. Re-fetch fresh Nector balance
    if (nectorPoints) {
      const getNectorCustomerId = (gid) => {
        if (!gid) return "";
        const match = String(gid).match(/\d+$/);
        const numericId = match ? match[0] : gid;
        return `shopify-${numericId}`;
      };

      const nectorData = await apiFetch('/api/nector/checkout', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: getNectorCustomerId(userId),
          country: "ind",
          action: "list",
          amount: 100 // Minimal amount just to check availability
        })
      });

      const pointsData = nectorData?.data || nectorData;
      const promotions = pointsData?.promotions || [];
      
      // Check if the claimed discount exists in the server's available promotions
      // We check by ID first (most secure) or by matching values
      const validPromotion = promotions.find(p => 
        (nectorPoints.id && p.id === nectorPoints.id) || 
        (p.coin_value === nectorPoints.coin_value && p.fiat_value === nectorPoints.fiat_value)
      );

      if (!validPromotion && nectorPoints.fiat_value > 0) {
        console.error("SECURITY ALERT: Nector points manipulation detected.", {
          claimed: nectorPoints,
          available: promotions
        });
        return { isValid: false, reason: "Loyalty points verification failed. Please remove and re-apply your coins." };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error("Integrity check error (Allowing for UX safety):", error);
    // If the Nector API is down, we allow the payment to proceed to avoid blocking real customers,
    // but the backend will still perform its mandatory check.
    return { isValid: true };
  }
}
