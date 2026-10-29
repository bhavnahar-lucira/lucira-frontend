/**
 * Utility for resolving order milestone statuses consistently across
 * the customer orders list (/admin/orders) and order details (/admin/orders/[id]).
 */

export const STAGES = [
  "Order Confirmed",
  "Processing",
  "Manufacturing",
  "Quality Control",
  "Certification",
  "Dispatch",
  "In Transit",
  "Out For Delivery",
  "Delivered"
];

export function parseFlexibleDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).trim();
  if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length === 3) {
      // Handles DD/MM/YYYY
      const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (!isNaN(d.getTime())) return d;
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function extractTargetDispatchDate(order) {
  if (!order) return null;
  if (order.targetDispatchDate) {
    const d = parseFlexibleDate(order.targetDispatchDate);
    if (d) return d;
  }
  if (order.mtoDispatchDate) {
    const d = parseFlexibleDate(order.mtoDispatchDate);
    if (d) return d;
  }

  let mtoDispatchDate = null;
  let inStockDispatchDate = null;

  const rawItems = order.lineItems || order.line_items || [];
  const items = Array.isArray(rawItems)
    ? rawItems
    : (rawItems.edges ? rawItems.edges.map(e => e.node) : []);

  for (const item of items) {
    const rawProps = item.properties || item.customAttributes || [];
    const props = Array.isArray(rawProps)
      ? rawProps.reduce((acc, p) => ({ ...acc, [p.key || p.name]: p.value }), {})
      : rawProps;

    let shipDateStr = item.shippingDate || null;
    if (!shipDateStr && props && typeof props === "object") {
      for (const [k, v] of Object.entries(props)) {
        const normK = k.toLowerCase().replace(/[^a-z]/g, "");
        if (normK.includes("shippingdate") || normK.includes("dispatchdate")) {
          shipDateStr = v;
          break;
        }
      }
    }

    if (shipDateStr) {
      const parsed = parseFlexibleDate(shipDateStr);
      if (parsed) {
        const title = (item.title || item.name || "").toLowerCase();
        const sku = (item.sku || "").toLowerCase();
        const isIns = item.isInsurance || title.includes("insurance") || sku.includes("ins");
        if (isIns) {
          if (!inStockDispatchDate || parsed > inStockDispatchDate) inStockDispatchDate = parsed;
        } else {
          if (!mtoDispatchDate || parsed > mtoDispatchDate) mtoDispatchDate = parsed;
        }
      }
    }
  }

  return mtoDispatchDate || inStockDispatchDate || null;
}

/**
 * Computes dynamic milestone timeline dates and returns the current active stage.
 */
export function getOrderMilestoneStatus(order, clickpostData = null) {
  if (!order) return "Processing";

  const isCancelled = Boolean(
    order.cancelledAt ||
    order.cancelled_at ||
    order.cancelReason ||
    order.cancel_reason ||
    order.status === "Cancelled" ||
    order.status === "Canceled" ||
    (typeof order.status === "string" && order.status.toUpperCase() === "CANCELLED")
  );
  if (isCancelled) return "Cancelled";

  const fStatus = (order.fulfillmentStatus || order.fulfillment_status || "").toUpperCase();
  const rawStatus = (order.reason_status_description || order.status || "").toLowerCase();
  const normalizedStatus = rawStatus.replace(/[^a-z0-9]/g, "");

  if (fStatus === "FULFILLED" || fStatus === "DELIVERED" || normalizedStatus.includes("deliver")) {
    return "Delivered";
  }

  const cpBucket = clickpostData?.tracking?.status_bucket || order.customStatus?.clickpost_status_bucket;
  const cpDesc = (clickpostData?.tracking?.status_description || clickpostData?.tracking?.latest_status?.status || order.customStatus?.clickpost_status_description || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  if (cpBucket === 6 || (cpDesc.includes("deliver") && !cpDesc.includes("outfordelivery"))) {
    return "Delivered";
  }

  const placedDate = order.processedAt || order.processed_at || order.date || Date.now();
  const placed = new Date(placedDate);
  const placedDay = new Date(placed.getFullYear(), placed.getMonth(), placed.getDate());
  const now = new Date();
  const nowTime = now.getTime();

  const targetDispatchDate = extractTargetDispatchDate(order);

  let dispatchDay = targetDispatchDate && !isNaN(targetDispatchDate.getTime())
    ? new Date(targetDispatchDate.getFullYear(), targetDispatchDate.getMonth(), targetDispatchDate.getDate())
    : new Date(placedDay.getTime() + 10 * 86400000);

  if (dispatchDay < placedDay) dispatchDay = placedDay;

  const isBeforeDispatchDate = Boolean(targetDispatchDate && nowTime < dispatchDay.getTime());

  if (isBeforeDispatchDate) {
    const diffDays = Math.round((dispatchDay.getTime() - placedDay.getTime()) / 86400000);

    if (diffDays <= 0 || diffDays === 1) {
      return "Processing";
    }

    if (diffDays <= 3) {
      const mid1 = new Date(placedDay.getTime() + 1 * 86400000);
      if (nowTime >= mid1.getTime()) {
        return "Manufacturing";
      }
      return "Processing";
    }

    // MTO / Extended timeline (4+ days):
    // Day 1: Processing (1 day after confirmed)
    // Day 2: Manufacturing (1 day after processing)
    // Dispatch - 2 days: Quality Control
    // Dispatch - 1 day: Certification
    const d1 = new Date(placedDay.getTime() + 1 * 86400000);
    const d2 = new Date(d1.getTime() + 1 * 86400000);
    const d3 = new Date(dispatchDay.getTime() - 2 * 86400000);
    const d4 = new Date(dispatchDay.getTime() - 1 * 86400000);

    const finalD1 = d1 > dispatchDay ? dispatchDay : d1;
    const finalD2 = d2 < finalD1 ? finalD1 : (d2 > dispatchDay ? dispatchDay : d2);
    const finalD3 = d3 < finalD2 ? finalD2 : (d3 > dispatchDay ? dispatchDay : d3);
    const finalD4 = d4 < finalD3 ? finalD3 : (d4 > dispatchDay ? dispatchDay : d4);

    if (normalizedStatus.includes("certif") || normalizedStatus.includes("hallmark") || nowTime >= finalD4.getTime()) {
      return "Certification";
    }
    if (normalizedStatus.includes("quality") || normalizedStatus.includes("qc") || nowTime >= finalD3.getTime()) {
      return "Quality Control";
    }
    if (normalizedStatus.includes("manufactur") || normalizedStatus.includes("production") || normalizedStatus.includes("making") || nowTime >= finalD2.getTime()) {
      return "Manufacturing";
    }
    if (normalizedStatus.includes("process") || normalizedStatus.includes("pogenerated") || normalizedStatus.includes("inprogress") || nowTime >= finalD1.getTime()) {
      return "Processing";
    }
    return "Order Confirmed";
  }

  // On or after dispatch date:
  if (cpBucket === 4 || cpDesc.includes("outfordelivery") || normalizedStatus.includes("outfordelivery")) {
    return "Out For Delivery";
  }
  if (cpBucket === 3 || cpDesc.includes("intransit") || cpDesc.includes("transit") || cpDesc.includes("reachedhub") || cpDesc.includes("departed") || normalizedStatus.includes("transit")) {
    return "In Transit";
  }
  if (cpBucket === 2 || cpDesc.includes("pickedup") || cpDesc.includes("dispatched") || normalizedStatus.includes("dispatch") || normalizedStatus.includes("shipped") || fStatus === "SHIPPED") {
    return "Dispatch";
  }

  if (order.status && !["FULFILLED", "UNFULFILLED", "PARTIAL"].includes(String(order.status).toUpperCase())) {
    return order.status;
  }

  return "Dispatch";
}
