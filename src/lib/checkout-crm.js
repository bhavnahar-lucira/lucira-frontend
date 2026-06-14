import { getNumericId } from "./gtm";
import { apiFetch } from "./api";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47661824082138";

export const getStoredUtms = () => {
  if (typeof window === 'undefined') return {};
  try {
    const getCookie = (name) => {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    };

    const cookieUtmsStr = getCookie("lucira_utms");
    if (cookieUtmsStr) {
      try {
        return JSON.parse(decodeURIComponent(cookieUtmsStr));
      } catch(e) {}
    }

    return JSON.parse(localStorage.getItem("lucira_utms") || "{}");
  } catch (e) {
    return {};
  }
};

export const saveUtmsFromUrl = (searchParams) => {
  if (typeof window === 'undefined') return;
  const utms = {
    utm_source: searchParams.get("utm_source"),
    utm_medium: searchParams.get("utm_medium"),
    utm_campaign: searchParams.get("utm_campaign"),
  };
  
  const existingUtms = getStoredUtms();
  const newUtms = { ...existingUtms };
  let changed = false;
  
  Object.keys(utms).forEach(key => {
    if (utms[key]) {
      newUtms[key] = utms[key];
      changed = true;
    }
  });
  
  if (changed) {
    const strUtms = JSON.stringify(newUtms);
    localStorage.setItem("lucira_utms", strUtms);

    // Save in cookie for 30 days
    const date = new Date();
    date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
    document.cookie = "lucira_utms=" + encodeURIComponent(strUtms) + "; expires=" + date.toUTCString() + "; path=/; SameSite=Lax";
  }
};

export const sendCheckoutCrmEvent = async (type, data) => {
  try {
    const utm_map = getStoredUtms();
    
    const leadDetails = {
      Email: data.email || "",
      Mobile: data.mobile || "",
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

    const payload = {
      leaddetails: leadDetails,
      customerevent: customerEvent,
      products: products,
      order: {}
    };

    await apiFetch("/api/webhooks/checkout-crm", {
      method: "POST",
      body: JSON.stringify({ type, payload }),
    });
  } catch (error) {
    console.error(`Error sending ${type} CRM event:`, error);
  }
};
