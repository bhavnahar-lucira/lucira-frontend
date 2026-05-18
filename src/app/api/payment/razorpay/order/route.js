import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { buildCartLookup, normalizeUserId } from "@/lib/cartIdentity";
import { shopifyAdminFetch } from "@/lib/shopify";

function toSubunits(amount) {
  const numericAmount = Number(amount || 0);
  return Math.round(numericAmount * 100);
}

function buildPaymentMethod(body = {}, draftTotal = 0) {
  const method = body?.paymentMethod || {};
  const requestedType = method?.type || "razorpay";
  const grandTotal = Number(draftTotal || 0);

  console.log(`[PAYMENT API] Requested Type: ${requestedType}, Draft Total: ${grandTotal}, Frontend Payment Method:`, JSON.stringify(method));

  // Handle Partial COD ONLY if specifically requested
  if (requestedType === "partial_cod") {
      if (grandTotal <= 0 || grandTotal >= 50000) {
        console.log(`[PAYMENT API] Partial COD requested but ineligible (Total: ${grandTotal}). Falling back to full Razorpay.`);
        return {
          type: "razorpay",
          prepaidAmount: grandTotal,
          codAmount: 0,
          grandTotal,
        };
      }

      const prepaidAmount = grandTotal * 0.2;
      const codAmount = grandTotal - prepaidAmount;

      console.log(`[PAYMENT API] Partial COD Applied. Prepaid: ${prepaidAmount}, COD: ${codAmount}`);
      return {
        type: "partial_cod",
        prepaidAmount: Math.round(prepaidAmount),
        codAmount: Math.round(codAmount),
        grandTotal,
      };
  }

  // Always enforce 100% prepaid for Razorpay Secure
  console.log(`[PAYMENT API] Razorpay Secure Applied. Full Amount: ${grandTotal}`);
  return {
    type: "razorpay",
    prepaidAmount: grandTotal,
    codAmount: 0,
    grandTotal,
  };
}

function normalizeVariantId(variantId = "") {
  const value = String(variantId || "").trim();
  if (!value) return "";
  return value.includes("gid://shopify/ProductVariant/")
    ? value
    : `gid://shopify/ProductVariant/${value}`;
}

function buildMailingAddress(address = null) {
  if (!address) return null;

  return {
    firstName: address.firstName || "",
    lastName: address.lastName || "",
    company: address.company || "",
    address1: address.address1 || "",
    address2: address.address2 || "",
    city: address.city || "",
    province: address.province || "",
    zip: String(address.zip || ""),
    country: address.country || "",
    phone: address.phone || "",
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const userId = normalizeUserId(body?.userId);
    const sessionId = body?.sessionId || null;

    if (!userId && !sessionId) {
      return NextResponse.json({ error: "UserId or SessionId is required" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay credentials not configured" }, { status: 500 });
    }

    const client = await clientPromise;
    const db = client.db("shopify-app");
    const cartLookup = buildCartLookup({ userId, sessionId });
    console.log("[PAYMENT API] Fetching cart with lookup:", JSON.stringify(cartLookup));
    
    // Fetch the MOST RECENT cart to avoid stale data issues
    const carts = await db.collection("carts")
      .find(cartLookup)
      .sort({ updatedAt: -1 })
      .limit(1)
      .toArray();
    
    const cart = carts[0];

    if (!cart?.items?.length) {
      console.log("[PAYMENT API] Cart not found or empty.");
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    console.log("[PAYMENT API] Cart items found:", cart.items.map(i => `${i.title} (${i.quantity})`).join(", "));

    const shippingAddress = body?.shippingAddress;
    const billingAddress = body?.billingAddress;
    const customer = body?.customer;
    const appliedCoupon = body?.appliedCoupon;
    const nectorPoints = body?.nectorPoints;

    const couponValue = Number(appliedCoupon?.value || 0);
    const nectorValue = Number(nectorPoints?.fiat_value || 0);

    const subtotalBeforeDiscount = cart.items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    
    // Calculate subtotal excluding insurance for correct percentage coupon calculation (matching frontend)
    const insuranceItem = cart.items.find(item => item.variantId === "gid://shopify/ProductVariant/47709366026458");
    const insuranceValue = insuranceItem ? (Number(insuranceItem.price || 0) * Number(insuranceItem.quantity || 1)) : 0;
    const subtotalForCoupon = subtotalBeforeDiscount - insuranceValue;

    const finalTotal = Math.max(0, subtotalBeforeDiscount - nectorValue);

    // Prepare line items
    const lineItems = cart.items.map(item => {
      const price = Number(item.price || 0);
      // For free gifts, we want to show the original value as a strikethrough in Shopify
      // We look for originalPrice or comparePrice
      const originalValue = Number(item.originalPrice || item.comparePrice || 0);
      const unitPrice = (price === 0 && originalValue > 0) ? originalValue : price;

      const lineItem = {
        variantId: normalizeVariantId(item.variantId),
        quantity: Number(item.quantity || 1),
        originalUnitPrice: unitPrice,
        customAttributes: [
          { key: "_Gold Weight", value: String(item.goldWeight || "") },
          { key: "_Gold Price", value: String(item.goldPrice || "") },
          { key: "_Gold Price Per Gram", value: String(item.goldPricePerGram || "") },
          { key: "_Making Charges", value: String(item.makingCharges || "") },
          { key: "_Diamond Charges", value: String(item.diamondCharges || "") },
          { key: "_Diamond Total Pcs", value: String(item.diamondTotalPcs || "") },
          { key: "_GST", value: String(item.gst || "") },
          { key: "_Final Price", value: String(item.finalPrice || item.price || "") },
          { key: "_Shipping Date", value: String(item.shippingDate || "") },
          { key: "Variant Title", value: price === 0 ? "Free Gift" : String(item.variantTitle || "") },
          { key: "Color", value: String(item.color || "") },
          { key: "Karat", value: String(item.karat || "") },
          { key: "Size", value: String(item.size || "") },
          { key: "EngravingText", value: String(item.engravingText || item.engraving || "") },
          { key: "EngravingFont", value: String(item.engravingFont || "") },
          { key: "GiftText", value: String(item.giftText || "") },
        ].filter(attr => attr.value !== "" && attr.value !== "0" && attr.value !== "undefined")
      };

      if (price === 0) {
        lineItem.appliedDiscount = {
          title: "Free Gift",
          value: 100,
          valueType: "PERCENTAGE"
        };
      }
      return lineItem;
    });

    // Apply Nector Discount to the highest priced paid line item
    if (nectorValue > 0) {
      // Sort a copy of lineItems by price descending to find the best candidate
      const sortedItems = [...lineItems]
        .filter(item => item.originalUnitPrice > 0 && !item.appliedDiscount)
        .sort((a, b) => b.originalUnitPrice - a.originalUnitPrice);

      if (sortedItems.length > 0) {
        const bestItem = sortedItems[0];
        // Find the original reference in lineItems to apply the discount
        const targetItem = lineItems.find(item => item === bestItem);
        if (targetItem) {
          targetItem.appliedDiscount = {
            title: nectorPoints?.id || "Nector Discount",
            value: nectorValue,
            valueType: "FIXED_AMOUNT"
          };
        }
      }
    }

    // Set Coupon as the order-level discount
    let finalDiscount = undefined;
    if (couponValue > 0) {
      let totalCouponDiscountAmount = couponValue;
      if (appliedCoupon?.valueType === "PERCENTAGE") {
        totalCouponDiscountAmount = (subtotalForCoupon * couponValue) / 100;
      }

      finalDiscount = {
        title: appliedCoupon.code || "Coupon Discount",
        value: totalCouponDiscountAmount,
        valueType: "FIXED_AMOUNT"
      };
    }

    // STEP 1: Create Shopify Draft Order
    const customAttributes = [];
    const tags = ["Razorpay"];
    const requestedPaymentMethod = body?.paymentMethod?.type === "partial_cod" ? "partial_cod" : "razorpay";
    if (requestedPaymentMethod === "partial_cod") {
      tags.push("Partial COD");
    }
    if (nectorPoints?.coin_value) {
      customAttributes.push({ key: "NECTOR_USED_AMOUNT", value: String(nectorPoints.coin_value) });
      customAttributes.push({ key: "nector_points_used", value: String(nectorPoints.coin_value) });
      tags.push("nector_redeem");
    }

    const draftOrderInput = {
      lineItems,
      appliedDiscount: finalDiscount,
      useCustomerDefaultAddress: false,
      taxExempt: true,
      shippingAddress: buildMailingAddress(shippingAddress),
      billingAddress: buildMailingAddress(billingAddress || shippingAddress),
      customAttributes: customAttributes.length > 0 ? customAttributes : undefined,
      tags: tags
    };

    // If we have a real discount code, Shopify Draft Orders usually require 
    // applying it AFTER creation or via 'appliedDiscount'.
    // Let's try applying it as a manual discount with the code name.

    if (customer?.email) {
      draftOrderInput.email = customer.email;
    }

    console.log("[PAYMENT API] Draft Order Input:", JSON.stringify(draftOrderInput, null, 2));

    const shopifyDraftData = await shopifyAdminFetch(`
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            totalPrice
            subtotalPrice
            totalTax
          }
          userErrors {
            field
            message
          }
        }
      }
    `, { input: draftOrderInput });

    console.log("[PAYMENT API] Shopify Draft Data Response:", JSON.stringify(shopifyDraftData, null, 2));

    const draftOrder = shopifyDraftData.draftOrderCreate.draftOrder;
    const userErrors = shopifyDraftData.draftOrderCreate.userErrors;

    if (userErrors?.length) {
      return NextResponse.json({ error: userErrors[0].message }, { status: 400 });
    }

    const paymentMethod = buildPaymentMethod(body, draftOrder.totalPrice);
    if (requestedPaymentMethod === "partial_cod" && paymentMethod.type !== "partial_cod") {
      return NextResponse.json({ error: "Partial COD is available only below ₹50,000 with COD up to ₹30,000" }, { status: 400 });
    }

    // STEP 2: Create Razorpay Order using Draft Order Total, or prepaid amount for Partial COD.
    const amountInSubunits = toSubunits(paymentMethod.prepaidAmount);
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        currency: "INR",
        receipt: draftOrder.id,
      }),
    });

    const razorpayOrder = await razorpayResponse.json();

    return NextResponse.json({
      key: keyId,
      amount: amountInSubunits,
      currency: "INR",
      orderId: razorpayOrder.id,
      draftId: draftOrder.id,
      customer: body?.customer,
      shippingAddress: body?.shippingAddress,
      billingAddress: body?.billingAddress,
      paymentMethod,
    });
  } catch (error) {
    console.error("DRAFT ORDER FLOW ERROR:", error);
    return NextResponse.json({ error: "Failed to initialize checkout" }, { status: 500 });
  }
}
