import { getStoredUtms } from "./checkout-crm";
import { apiFetch } from "./api";

const buildLeadDetails = (user, utms, eventType) => {
  const details = {
    First_Name: user.firstName || (user.name ? user.name.split(' ')[0] : "") || "Unknown",
    Last_Name: user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : "") || "Unknown",
    Mobile: user.mobile || user.phone || "",
    Email: user.email || "",
    Lead_Source: "Website",
    Allocation_Type: "Auto",
    UTM_Source: utms.utm_source || "",
    UTM_Medium: utms.utm_medium || "",
    UTM_Campaign: utms.utm_campaign || ""
  };
  
  if (eventType === "ATC") {
    details.Deal_Trigger_Event = "ATC";
    details.Record_Type = "Sales";
  }

  return details;
};

export const sendProductViewWebhook = async (user, productData) => {
  if (!user || (!user.email && !user.mobile && !user.phone)) return; // Only if logged in

  try {
    const utms = getStoredUtms();
    
    const payload = {
      leaddetails: buildLeadDetails(user, utms, "ProductView"),
      customerevent: {
        Event_Type: "ProductView",
        Channel: "website",
        Order_Value: String(productData.offerPrice || productData.price || 0),
        Currency: "INR"
      },
      products: [
        {
          product_name: productData.productName || productData.title || "",
          price: String(productData.price || 0),
          product_sku: productData.sku || "",
          product_url: productData.productUrl || "",
          product_type: productData.productType || productData.type || "",
          category: productData.category || productData.type || "",
          product_id: String(productData.variantId || "")
        }
      ],
      order: {}
    };

    await apiFetch("/api/webhooks/headless", {
      method: "POST",
      body: JSON.stringify({ type: "ProductView", payload })
    });
  } catch (error) {
    console.error("Error sending ProductView webhook:", error);
  }
};

export const sendAddToCartWebhook = async (user, productData) => {
  if (!user || (!user.email && !user.mobile && !user.phone)) return; // Only if logged in

  try {
    const utms = getStoredUtms();
    
    const payload = {
      leaddetails: buildLeadDetails(user, utms, "ATC"),
      customerevent: {
        Event_Type: "ATC",
        Channel: "website",
        Order_Value: String(productData.offerPrice || productData.price || 0),
        Currency: "INR"
      },
      products: [
        {
          product_name: productData.productName || productData.title || "",
          price: String(productData.price || 0),
          product_sku: productData.sku || "",
          product_url: productData.productUrl || "",
          quantity: String(productData.quantity || 1),
          product_type: productData.productType || productData.type || "",
          category: productData.category || productData.type || "",
          product_id: String(productData.productId || "") 
        }
      ],
      order: {}
    };

    await apiFetch("/api/webhooks/headless", {
      method: "POST",
      body: JSON.stringify({ type: "ATC", payload })
    });
  } catch (error) {
    console.error("Error sending ATC webhook:", error);
  }
};
