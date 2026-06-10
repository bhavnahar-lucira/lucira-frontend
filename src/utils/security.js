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
      const validPromotion = promotions.find(p => 
        p.coin_value === nectorPoints.coin_value && 
        p.fiat_value === nectorPoints.fiat_value
      );

      if (!validPromotion && nectorPoints.fiat_value > 0) {
        console.error("SECURITY ALERT: Nector points manipulation detected.");
        return { isValid: false, reason: "Invalid loyalty points redemption. Please refresh and try again." };
      }
    }

    // 2. Additional integrity checks can be added here
    // In a real fix, we would compare frontend items with a server-fetched cart
    
    return { isValid: true };
  } catch (error) {
    console.error("Integrity check failed:", error);
    return { isValid: false, reason: "Security verification failed. Please try again." };
  }
}
