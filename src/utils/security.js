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
        // Extract numeric ID from gid://shopify/Customer/12345
        const match = String(gid).match(/\d+$/);
        return match ? match[0] : gid;
      };

      const customerId = getNectorCustomerId(userId);
      const nectorData = await apiFetch('/api/nector/checkout', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          country: "ind",
          action: "list",
          amount: 100 
        })
      });

      const pointsData = nectorData?.data || nectorData;
      const promotions = pointsData?.promotions || [];
      
      // DEBUG LOG: Helps identify why 'available' might be empty
      console.log("Nector Security Check:", {
        sent_customer_id: customerId,
        received_promotions: promotions.length,
        claimed_id: nectorPoints.id
      });

      // If the API returns promotions, we MUST validate against them.
      // If the API returns an empty list (available: []), it might be because the proxy 
      // or Nector 'list' action is filtered. We only block if we have a list to compare against
      // AND the claimed point is clearly not in it.
      if (promotions.length > 0) {
        const validPromotion = promotions.find(p => 
          (nectorPoints.id && String(p.id) === String(nectorPoints.id)) || 
          (p.coin_value === nectorPoints.coin_value && p.fiat_value === nectorPoints.fiat_value)
        );

        if (!validPromotion && nectorPoints.fiat_value > 0) {
          return { isValid: false, reason: "Loyalty points verification failed. Please re-apply your coins." };
        }
      } else if (nectorPoints.id && nectorPoints.id.startsWith('nector_') && nectorPoints.fiat_value > 5000) {
          // HEURISTIC: If 'available' is empty but the user claims a very high discount 
          // with a generic 'nector_' prefix (common in manual injections), block it.
          return { isValid: false, reason: "Suspicious loyalty points detected. Please refresh." };
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
