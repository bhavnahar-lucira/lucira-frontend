import { getNumericId } from "./gtm";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47661824082138";

export const getStoredUtms = () => {
  if (typeof window === 'undefined') return {};
  try {
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
    localStorage.setItem("lucira_utms", JSON.stringify(newUtms));
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
      Event_Type: "Checkout",
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
      const origin = typeof window !== 'undefined' ? window.location.origin : "https://www.lucira.in";
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

    console.log(`[CRM Webhook] Sending ${type} event:`, payload);

    await fetch("/api/webhooks/checkout-crm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, payload }),
    });
  } catch (error) {
    console.error(`Error sending ${type} CRM event:`, error);
  }
};
