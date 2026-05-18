import crypto from "crypto";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { buildCartLookup, normalizeUserId } from "@/lib/cartIdentity";
import { shopifyAdminFetch, shopifyAdminRestFetch } from "@/lib/shopify";

function normalizeVariantId(variantId = "") {
  const value = String(variantId || "").trim();
  if (!value) return "";
  return value.includes("gid://shopify/ProductVariant/")
    ? value
    : `gid://shopify/ProductVariant/${value}`;
}

function getNumericShopifyId(gid = "") {
  return String(gid || "").match(/\d+$/)?.[0] || "";
}

function asMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function normalizePhone(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return value.startsWith("+") ? value : `+${digits}`;
}

function formatCompanyWithGstin(company = "", gstin = "") {
  const trimmedCompany = String(company || "").trim();
  const trimmedGstin = String(gstin || "").trim().toUpperCase();

  if (trimmedCompany && trimmedGstin) {
    return `${trimmedCompany} | GSTIN: ${trimmedGstin}`;
  }

  if (trimmedGstin) {
    return `GSTIN: ${trimmedGstin}`;
  }

  return trimmedCompany;
}

function buildMailingAddress(address = null) {
  if (!address) return null;

  return {
    firstName: address.firstName || "",
    lastName: address.lastName || "",
    company: formatCompanyWithGstin(address.company, address.gstin),
    address1: address.address1 || "",
    address2: address.address2 || "",
    city: address.city || "",
    province: address.province || "",
    zip: address.zip || "",
    country: address.country || "",
    phone: normalizePhone(address.phone || ""),
  };
}

function buildRestMailingAddress(address = null) {
  if (!address) return null;

  return {
    first_name: address.firstName || "",
    last_name: address.lastName || "",
    company: formatCompanyWithGstin(address.company, address.gstin),
    address1: address.address1 || "",
    address2: address.address2 || "",
    city: address.city || "",
    province: address.province || "",
    zip: String(address.zip || ""),
    country: address.country || "",
    phone: normalizePhone(address.phone || ""),
  };
}

function buildLineItemProperties(item = {}) {
  const pairs = [
    ["EngravingText", item.engravingText || item.engraving || ""],
    ["EngravingFont", item.engravingFont || ""],
    ["GiftText", item.giftText || ""],
    ["_Shipping Date", item.shippingDate || ""],
    ["_Gold Price Per Gram", item.goldPricePerGram],
    ["_Gold Weight", item.goldWeight],
    ["_Gold Price", item.goldPrice],
    ["_Making Charges", item.makingCharges],
    ["_Diamond Charges", item.diamondCharges],
    ["_GST", item.gst],
    ["_Final Price", item.finalPrice || item.price],
    ["_Diamond Total Pcs", item.diamondTotalPcs],
    ["Color", item.color || ""],
    ["Karat", item.karat || ""],
    ["Size", item.size || ""],
    ["Variant Title", item.variantTitle || ""],
  ];

  return pairs
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([key, value]) => ({
      key,
      value: String(value),
    }));
}

function buildRestLineItemProperties(item = {}) {
  return buildLineItemProperties(item).map(({ key, value }) => ({
    name: key,
    value,
  }));
}

function buildOrderCustomAttributes({
  shippingAddress,
  billingAddress,
  razorpayOrderId,
  razorpayPaymentId,
  appliedCoupon,
  nectorPoints,
  paymentMethod,
}) {
  const pairs = [
    ["payment_gateway", paymentMethod?.type === "partial_cod" ? "Partial COD" : "Razorpay"],
    ["razorpay_order_id", razorpayOrderId],
    ["razorpay_payment_id", razorpayPaymentId],
    ["partial_cod_prepaid_amount", paymentMethod?.type === "partial_cod" ? paymentMethod.prepaidAmount : ""],
    ["partial_cod_cod_amount", paymentMethod?.type === "partial_cod" ? paymentMethod.codAmount : ""],
    ["partial_cod_grand_total", paymentMethod?.type === "partial_cod" ? paymentMethod.grandTotal : ""],
    ["shipping_address_id", shippingAddress?.id || ""],
    ["billing_address_id", billingAddress?.id || ""],
    ["shipping_gstin", shippingAddress?.gstin || ""],
    ["billing_gstin", billingAddress?.gstin || ""],
    ["NECTOR_USED_AMOUNT", nectorPoints?.coin_value ? String(nectorPoints.coin_value) : ""],
    ["nector_points_used", nectorPoints?.coin_value ? String(nectorPoints.coin_value) : ""],
    [
      "shipping_method",
      (shippingAddress?.country || "").trim().toLowerCase() === "india"
        ? "Shipping Rate - FREE"
        : "Shipping - Calculated outside Shopify checkout",
    ],
  ];

  return pairs
    .filter(([, value]) => String(value || "").trim() !== "")
    .map(([key, value]) => ({ key, value: String(value) }));
}

function buildRestNoteAttributes({
  shippingAddress,
  billingAddress,
  razorpayOrderId,
  razorpayPaymentId,
  appliedCoupon,
  nectorPoints,
  paymentMethod,
}) {
  return buildOrderCustomAttributes({
    shippingAddress,
    billingAddress,
    razorpayOrderId,
    razorpayPaymentId,
    nectorPoints,
    paymentMethod,
  }).map(({ key, value }) => ({
    name: key,
    value,
  }));
}

function buildOrderNote({ shippingAddress, billingAddress, paymentMethod }) {
  return [
    "Order created via custom Razorpay checkout.",
    paymentMethod?.type === "partial_cod"
      ? `Partial COD: prepaid ${asMoney(paymentMethod.prepaidAmount)}, COD ${asMoney(paymentMethod.codAmount)}.`
      : "",
    shippingAddress?.gstin ? `Shipping GSTIN: ${shippingAddress.gstin}` : "",
    billingAddress?.gstin ? `Billing GSTIN: ${billingAddress.gstin}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildShippingLines(address = null) {
  const isIndia = (address?.country || "").trim().toLowerCase() === "india";
  if (!isIndia) return [];

  return [
    {
      title: "Shipping Rate - FREE",
      code: "FREE",
      source: "Lucira",
      priceSet: {
        shopMoney: {
          amount: 0,
          currencyCode: "INR",
        },
      },
    },
  ];
}

function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature, secret }) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return expectedSignature === razorpaySignature;
}

async function callNectorPerform({ userId, orderId, amount }) {
  try {
    const webhookKey = process.env.NECTOR_WEBHOOK_KEY || "1b00001c-26f4-4b62-a601-4f874e63f108";
    const numericId = String(userId || "").match(/\d+/)?.[0] || userId;
    const customerId = `shopify-${numericId}`;
    
    // Extract numeric order ID from GID (e.g., gid://shopify/Order/6565486231770 -> 6565486231770)
    const numericOrderId = String(orderId || "").match(/\d+/)?.[0] || orderId;

    console.log("Calling Nector Perform Server-Side:", { customerId, orderId: numericOrderId, amount });

    const response = await fetch(`https://platform.nector.io/api/open/integrations/customcheckoutwebhook/${webhookKey}`, {
      method: "POST",
      headers: {
        "x-source": "web",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_id: customerId,
        action: "perform",
        amount: Number(amount),
        reference_order_id: numericOrderId,
        wallet_type: "coins"
      }),
    });

    const data = await response.json();
    console.log("Nector Perform Response:", data);
    return data;
  } catch (error) {
    console.error("Nector Perform Server-Side Error:", error);
    return null;
  }
}

async function recordPartialCodPayment({ orderId, amount, razorpayPaymentId }) {
  const paymentAmount = Number(amount || 0);
  if (!orderId || !paymentAmount) return null;

  try {
    const manualPaymentData = await shopifyAdminFetch(`
      mutation orderCreateManualPayment($id: ID!, $amount: MoneyInput, $paymentMethodName: String, $processedAt: DateTime) {
        orderCreateManualPayment(
          id: $id,
          amount: $amount,
          paymentMethodName: $paymentMethodName,
          processedAt: $processedAt
        ) {
          order {
            id
            displayFinancialStatus
            totalOutstandingSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            netPaymentSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      id: orderId,
      amount: {
        amount: asMoney(paymentAmount),
        currencyCode: "INR",
      },
      paymentMethodName: razorpayPaymentId ? `Razorpay ${razorpayPaymentId}` : "Razorpay",
      processedAt: new Date().toISOString(),
    }, "2026-01");

    const payload = manualPaymentData.orderCreateManualPayment;
    if (payload?.userErrors?.length) {
      throw new Error(payload.userErrors[0].message);
    }

    return payload?.order || null;
  } catch (error) {
    console.error("GraphQL partial payment record failed, trying REST transaction:", error.message);
  }

  const numericOrderId = getNumericShopifyId(orderId);
  if (!numericOrderId) return null;

  const { data } = await shopifyAdminRestFetch(
    `orders/${numericOrderId}/transactions.json`,
    {},
    {
      method: "POST",
      body: {
        transaction: {
          kind: "sale",
          status: "success",
          amount: asMoney(paymentAmount),
          currency: "INR",
          gateway: "Razorpay",
          authorization: razorpayPaymentId || undefined,
          source_name: "external",
          message: "Partial COD prepaid amount captured via Razorpay",
        },
      },
    }
  );

  return data?.transaction || null;
}

async function createPartialCodOrder({
  cart,
  customer,
  shippingAddress,
  billingAddress,
  razorpayOrderId,
  razorpayPaymentId,
  appliedCoupon,
  nectorPoints,
  paymentMethod,
}) {
  const lineItems = (cart?.items || []).map((item) => {
    const numericVariantId = getNumericShopifyId(item.variantId);
    const price = Number(item.price || 0);
    const lineItem = {
      quantity: Number(item.quantity || 1),
      price: asMoney(price),
      properties: buildRestLineItemProperties(item),
    };

    if (numericVariantId) {
      lineItem.variant_id = Number(numericVariantId);
    } else {
      lineItem.title = item.title || "Custom item";
    }

    return lineItem;
  });

  const subtotalBeforeDiscount = (cart?.items || []).reduce(
    (acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)),
    0
  );
  const couponDetails = typeof appliedCoupon === "object" ? appliedCoupon : { code: appliedCoupon, value: 0, valueType: "FIXED_AMOUNT" };
  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    if (couponDetails.valueType === "FIXED_AMOUNT") {
      couponDiscountAmount = Number(couponDetails.value || 0);
    } else if (couponDetails.valueType === "PERCENTAGE") {
      couponDiscountAmount = (subtotalBeforeDiscount * Number(couponDetails.value || 0)) / 100;
    }
  }
  const nectorValue = Number(nectorPoints?.fiat_value || 0);
  const discountCodes = [
    couponDiscountAmount > 0
      ? {
          code: couponDetails.code || "Coupon Discount",
          amount: asMoney(couponDiscountAmount),
          type: "fixed_amount",
        }
      : null,
    nectorValue > 0
      ? {
          code: nectorPoints?.id || "Nector Discount",
          amount: asMoney(Math.min(nectorValue, subtotalBeforeDiscount)),
          type: "fixed_amount",
        }
      : null,
  ].filter(Boolean);
  const tags = ["Razorpay", "Partial COD"];
  if (nectorPoints?.coin_value) tags.push("nector_redeem");

  const { data } = await shopifyAdminRestFetch(
    "orders.json",
    {},
    {
      method: "POST",
      body: {
        order: {
          email: customer?.email || "",
          phone: normalizePhone(customer?.phone || ""),
          send_receipt: false,
          send_fulfillment_receipt: false,
          inventory_behaviour: "decrement_obeying_policy",
          financial_status: "partially_paid",
          currency: "INR",
          tags: tags.join(", "),
          note: buildOrderNote({ shippingAddress, billingAddress, paymentMethod }),
          note_attributes: buildRestNoteAttributes({
            shippingAddress,
            billingAddress,
            razorpayOrderId,
            razorpayPaymentId,
            nectorPoints,
            paymentMethod,
          }),
          line_items: lineItems,
          shipping_address: buildRestMailingAddress(shippingAddress),
          billing_address: buildRestMailingAddress(billingAddress || shippingAddress),
          shipping_lines: [
            {
              title: "Shipping Rate - FREE",
              code: "FREE",
              price: "0.00",
            },
          ],
          discount_codes: discountCodes,
          transactions: [
            {
              kind: "sale",
              status: "success",
              amount: asMoney(paymentMethod.prepaidAmount),
              currency: "INR",
              gateway: "Razorpay",
              authorization: razorpayPaymentId || razorpayOrderId,
            },
          ],
        },
      },
    }
  );

  return data?.order || null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const userId = normalizeUserId(body?.userId);
    const sessionId = body?.sessionId || null;
    const razorpayOrderId = String(body?.razorpayOrderId || "").trim();
    const razorpayPaymentId = String(body?.razorpayPaymentId || "").trim();
    const razorpaySignature = String(body?.razorpaySignature || "").trim();
    const draftId = body?.draftId;
    const nectorPoints = body?.nectorPoints;
    const paymentMethod = body?.paymentMethod?.type === "partial_cod"
      ? body.paymentMethod
      : { type: "razorpay" };

    console.log("COMPLETE ORDER REQUEST:", { userId, sessionId, razorpayOrderId, razorpayPaymentId, draftId });

    if (!userId && !sessionId) {
      return NextResponse.json({ error: "UserId or SessionId is required" }, { status: 400 });
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !draftId) {
      return NextResponse.json({ error: "Payment details are incomplete" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    if (!verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature, secret })) {
      console.error("Razorpay signature verification failed");
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("shopify-app");
    const cartCollection = db.collection("carts");
    const paymentCollection = db.collection("shopify_order_payments");
    const ordersCollection = db.collection("orders");

    const cartLookup = buildCartLookup({ userId, sessionId });
    const cart = await cartCollection.findOne(cartLookup);

    if (paymentMethod.type === "partial_cod") {
      const partialOrder = await createPartialCodOrder({
        cart,
        customer: body?.customer,
        shippingAddress: body?.shippingAddress,
        billingAddress: body?.billingAddress || body?.shippingAddress,
        razorpayOrderId,
        razorpayPaymentId,
        appliedCoupon: body?.appliedCoupon,
        nectorPoints,
        paymentMethod,
      });

      if (!partialOrder?.id) {
        return NextResponse.json({ error: "Failed to create Partial COD order" }, { status: 500 });
      }

      try {
        await shopifyAdminFetch(`
          mutation draftOrderDelete($input: DraftOrderDeleteInput!) {
            draftOrderDelete(input: $input) {
              deletedId
              userErrors { field message }
            }
          }
        `, { input: { id: draftId } });
      } catch (deleteDraftError) {
        console.error("Unable to delete unused Partial COD draft:", deleteDraftError);
      }

      const shopifyOrderId = partialOrder.admin_graphql_api_id || `gid://shopify/Order/${partialOrder.id}`;
      if (nectorPoints?.coin_value) {
        const cartTotalAmount = cart?.items?.reduce((acc, item) =>
          acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0) || 0;

        await callNectorPerform({
          userId,
          orderId: shopifyOrderId,
          amount: Math.max(cartTotalAmount, 1)
        });
      }

      const orderRecord = {
        shopifyOrderId,
        shopifyOrderName: partialOrder.name,
        razorpayOrderId,
        razorpayPaymentId,
        userId: userId || null,
        sessionId: sessionId || null,
        totalAmount: Number(partialOrder.total_price || paymentMethod.grandTotal || 0),
        customer: body?.customer,
        shippingAddress: body?.shippingAddress,
        billingAddress: body?.billingAddress,
        paymentMethod,
        partialCodPaymentRecorded: true,
        status: "PARTIAL_COD",
        createdAt: new Date(),
      };

      await ordersCollection.insertOne(orderRecord);
      await paymentCollection.insertOne({
        ...orderRecord,
        razorpaySignature,
        updatedAt: new Date()
      });

      await cartCollection.updateOne(cartLookup, { $set: { items: [], updatedAt: new Date() } });

      return NextResponse.json({
        success: true,
        shopifyOrderId,
        shopifyOrderName: partialOrder.name,
      });
    }

    // STEP 1: Update Draft Order with final details (Address, Properties, etc.)
    // We omit lineItems here to preserve the complex properties and discounts 
    // set during the initial draftOrderCreate step.
    const tags = ["Razorpay"];
    if (paymentMethod.type === "partial_cod") {
      tags.push("Partial COD");
    }
    if (nectorPoints?.coin_value) {
      tags.push("nector_redeem");
    }

    await shopifyAdminFetch(`
      mutation draftOrderUpdate($id: ID!, $input: DraftOrderInput!) {
        draftOrderUpdate(id: $id, input: $input) {
          draftOrder { id }
          userErrors { field message }
        }
      }
    `, {
      id: draftId,
      input: {
        shippingAddress: buildMailingAddress(body?.shippingAddress),
        billingAddress: buildMailingAddress(body?.billingAddress || body?.shippingAddress),
        note: buildOrderNote({
          shippingAddress: body?.shippingAddress,
          billingAddress: body?.billingAddress,
          paymentMethod,
        }),
        tags: tags,
        customAttributes: buildOrderCustomAttributes({
          shippingAddress: body?.shippingAddress,
          billingAddress: body?.billingAddress,
          razorpayOrderId,
          razorpayPaymentId,
          nectorPoints,
          paymentMethod,
        })
      }
    });

    // STEP 2: Complete Shopify Draft Order
    console.log("Completing draft order:", draftId);
    const shopifyData = await shopifyAdminFetch(`
      mutation draftOrderComplete($id: ID!, $paymentPending: Boolean) {
        draftOrderComplete(id: $id, paymentPending: $paymentPending) {
          draftOrder {
            id
            order {
              id
              name
              totalPriceSet {
                shopMoney {
                  amount
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `, { id: draftId, paymentPending: paymentMethod.type === "partial_cod" });

    const payload = shopifyData.draftOrderComplete;
    
    if (payload?.userErrors?.some(e => e.message.toLowerCase().includes("already completed") || e.message.toLowerCase().includes("not open"))) {
      console.log("Draft order already completed or not open:", draftId);
      await cartCollection.updateOne(cartLookup, { $set: { items: [], updatedAt: new Date() } });
      return NextResponse.json({
        success: true,
        message: "Order already completed"
      });
    }

    if (payload?.userErrors?.length) {
      console.error("DraftOrderComplete UserErrors:", payload.userErrors);
      return NextResponse.json({ error: payload.userErrors[0].message }, { status: 400 });
    }

    const order = payload.draftOrder.order;
    console.log("Order completed successfully:", order.name);

    let partialCodPaymentRecorded = false;
    if (paymentMethod.type === "partial_cod") {
      try {
        const recordedPaymentOrder = await recordPartialCodPayment({
          orderId: order.id,
          amount: paymentMethod.prepaidAmount,
          razorpayPaymentId,
        });

        partialCodPaymentRecorded = Boolean(recordedPaymentOrder);
        console.log("Partial COD payment record result:", recordedPaymentOrder);
      } catch (paymentRecordError) {
        console.error("Partial COD payment could not be recorded in Shopify:", paymentRecordError);
      }
    }

    // STEP 3: Nector Point Redemption (Server-Side)
    if (nectorPoints?.coin_value) {
      // Calculate amount before Nector discount (sum of items)
      // This must match the amount passed during the Nector 'list' call.
      const cartTotalAmount = cart?.items?.reduce((acc, item) => 
        acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0) || 0;

      await callNectorPerform({
        userId,
        orderId: order.id,
        amount: Math.max(cartTotalAmount, 1)
      });
    }

    // STEP 4: Save to Local MongoDB
    const orderRecord = {
      shopifyOrderId: order.id,
      shopifyOrderName: order.name,
      razorpayOrderId,
      razorpayPaymentId,
      userId: userId || null,
      sessionId: sessionId || null,
      totalAmount: Number(order.totalPriceSet.shopMoney.amount),
      customer: body?.customer,
      shippingAddress: body?.shippingAddress,
      billingAddress: body?.billingAddress,
      paymentMethod,
      partialCodPaymentRecorded,
      status: paymentMethod.type === "partial_cod" ? "PARTIAL_COD" : "PAID",
      createdAt: new Date(),
    };

    await ordersCollection.insertOne(orderRecord);
    await paymentCollection.insertOne({
      ...orderRecord,
      razorpaySignature,
      updatedAt: new Date()
    });

    // STEP 4: Clear Cart
    console.log("Clearing cart for user:", userId || sessionId);
    await cartCollection.updateOne(cartLookup, { $set: { items: [], updatedAt: new Date() } });

    return NextResponse.json({
      success: true,
      shopifyOrderId: order.id,
      shopifyOrderName: order.name,
    });
  } catch (error) {
    console.error("COMPLETE ORDER ERROR:", error);
    return NextResponse.json({ 
      error: "Failed to complete order",
      details: error.message
    }, { status: 500 });
  }
}
