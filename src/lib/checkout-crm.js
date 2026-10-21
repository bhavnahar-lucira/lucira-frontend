import { getNumericId } from "./gtm";
import { apiFetch } from "./api";
import { toE164 } from "@/lib/phone";
import { getStoredUtms, saveUtmsFromUrl } from "@/lib/utm";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";

// UTM capture/read now lives in src/lib/utm.js (shared with the auth redirects
// and GtmPageView). Re-exported here so existing importers keep working.
export { getStoredUtms, saveUtmsFromUrl };

export const sendCheckoutCrmEvent = async (type, data) => {
  try {
    const utm_map = getStoredUtms();
    
    const leadDetails = {
      Email: data.email || "",
      Mobile: toE164(data.mobile || data.phone) || data.mobile || data.phone || "",
      First_Name: data.firstName || "",
      Last_Name: data.lastName || "",
      Lead_Source: "Website",
      Record_Type: "Sales",
      Allocation_Type: "Auto",
      UTM_Source: utm_map.utm_source || "Shopify",
      UTM_Medium: utm_map.utm_medium || "",
      UTM_Campaign: utm_map.utm_campaign || ""
    };

    const customerEvent = {
      Event_Type: type === "add_payment_info" ? "Payment" : "Checkout",
      Channel: "website",
      Order_Value: data.totalCartValue,
      Currency: "INR",
      Payment_Type: data.paymentType || "Pay Via UPI / COD"
    };

    if (type === "add_payment_info") {
      customerEvent["Billing Pincode"] = data.billingPincode || "";
      customerEvent["Billing City"] = data.billingCity || "";
      customerEvent["Billing State"] = data.billingState || "";
      customerEvent["Shipping Pincode"] = data.shippingPincode || "";
      customerEvent["Shipping City"] = data.shippingCity || "";
      customerEvent["Shipping State"] = data.shippingState || "";
    }

    const products = (data.cartItems || []).map(item => {
      const origin = typeof window !== 'undefined' ? window.location.origin : "https://www.lucirajewelry.com";
      const handle = item.handle || item.productHandle || item.product_handle;
      const productUrl = handle ? `${origin}/products/${handle}${item.variantId ? `?variant=${item.variantId}` : ""}` : "";

      return {
        product_name: item.title,
        price: Number(item.price || 0),
        product_url: productUrl,
        sku: item.sku || "",
        quantity: item.quantity
      };
    });

    const byjImage = (data.cartItems || []).find(item => item.properties?.['byj_image'])?.properties?.['byj_image'] || 
                     (data.cartItems || []).find(item => item.properties?.['_byj_preview'])?.properties?.['_byj_preview'] || "";

    const payload = {
      leaddetails: leadDetails,
      customerevent: customerEvent,
      products: products,
      order: {
        byj_image: byjImage,
        "custom.byj_image": byjImage
      }
    };

    await apiFetch("/api/webhooks/checkout-crm", {
      method: "POST",
      body: JSON.stringify({ type, payload }),
    });
  } catch (error) {
    console.error(`Error sending ${type} CRM event:`, error);
  }
};
