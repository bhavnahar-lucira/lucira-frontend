"use client";

import { useEffect, useState } from "react";
import { 
  ChevronLeft, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  MapPin,
  HelpCircle,
  AlertCircle,
  Loader2,
  RefreshCcw,
  ExternalLink,
  Copy,
  Check,
  Calendar
} from "lucide-react";
import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { apiFetch } from "@/lib/api";
import { getOrderImage } from "@/lib/utils";
import { shopifyStorefrontFetch, toShopifyGid } from "@/lib/shopify-client";

const CLICKPOST_SECURITY_KEY = "2f6fe169-505f-47d8-bf14-da099427c840";

function getClickpostTrackingUrl(waybill, cpId = 5) {
  if (!waybill) return "";
  return `https://track.clickpost.in/?waybill=${encodeURIComponent(waybill)}&source=dashboard&cp_id=${encodeURIComponent(cpId)}&security_key=${CLICKPOST_SECURITY_KEY}`;
}

// Specific query to get order details with handles via Customer
const GET_ORDER_WITH_HANDLES = `
  query getCustomerOrder($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      orders(first: 50) {
        edges {
          node {
            id
            orderNumber
            lineItems(first: 20) {
              edges {
                node {
                  title
                  customAttributes {
                    key
                    value
                  }
                  variant {
                    id
                    sku
                    product {
                      handle
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { accessToken } = useSelector((state) => state.user);
  const [order, setOrder] = useState(null);
  const [clickpostData, setClickpostData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleCopyWaybill = (text) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Tracking number copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      toast.info(text);
    }
  };

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!id) return;
      try {
        setLoading(true);
        
        // 1. Fetch basic order details from our backend
        let orderData = null;
        try {
          const data = await apiFetch(`/api/customer/orders/${id}`);
          orderData = data.order;
        } catch (err) {
          console.warn("[OrderDetails] Backend fetch failed:", err);
        }

        // 2. If handles are missing, fetch them from Shopify Storefront API fallback
        if (orderData && accessToken) {
          console.log("[OrderDetails] Checking handles...");
          const hasMissingHandles = orderData.lineItems?.some(item => !item.handle && !item.productHandle && !item.product_handle);
          
          if (hasMissingHandles) {
            console.log("[OrderDetails] Fetching missing handles from Storefront API...");
            try {
              const sfData = await shopifyStorefrontFetch(GET_ORDER_WITH_HANDLES, {
                customerAccessToken: accessToken
              });

              // Find order by exact ID or orderNumber
              const sfOrder = sfData?.customer?.orders?.edges?.find(e => {
                const node = e.node;
                const nodeNum = String(node.orderNumber);
                const orderDataNum = String(orderData.orderNumber);
                return node.id.includes(id) || nodeNum === orderDataNum;
              })?.node;
              
              if (sfOrder) {
                orderData.lineItems = orderData.lineItems.map(item => {
                  // Match by variant ID first, then by SKU, then by title (case-insensitive)
                  const sfItem = sfOrder.lineItems.edges.find(e => {
                    const sfNode = e.node;
                    const itemVarId = (item.variantId || item.variant?.id || "").split("/").pop();
                    const sfVarId = (sfNode.variant?.id || "").split("/").pop();
                    
                    const skuMatch = item.sku && sfNode.variant?.sku && item.sku === sfNode.variant.sku;
                    const titleMatch = (sfNode.title || "").toLowerCase() === (item.title || "").toLowerCase();
                    
                    return (itemVarId && itemVarId === sfVarId) || skuMatch || titleMatch;
                  })?.node;

                  return {
                    ...item,
                    handle: sfItem?.variant?.product?.handle || item.handle
                  };
                });
              }
            } catch (sfErr) {
              console.warn("[OrderDetails] Storefront fallback failed:", sfErr);
            }
          }
        }

        // 3. Fetch ClickPost tracking status and order status link
        try {
          const cpRes = await apiFetch(`/api/clickpost/track/${id}`);
          if (cpRes?.success && (cpRes.clickpostUrl || cpRes.waybill || cpRes.tracking)) {
            const partnerId = cpRes.tracking?.additional?.courier_partner_id || 5;
            const finalUrl = (cpRes.clickpostUrl && cpRes.clickpostUrl.includes('security_key'))
              ? cpRes.clickpostUrl
              : getClickpostTrackingUrl(cpRes.waybill || orderData?.trackingInfo?.waybill, partnerId);
            setClickpostData({
              ...cpRes,
              clickpostUrl: finalUrl
            });
          } else if (orderData?.trackingInfo?.waybill) {
            setClickpostData({
              waybill: orderData.trackingInfo.waybill,
              courierName: orderData.trackingInfo.courier,
              clickpostUrl: (orderData.trackingInfo.trackingUrl && orderData.trackingInfo.trackingUrl.includes('security_key'))
                ? orderData.trackingInfo.trackingUrl
                : getClickpostTrackingUrl(orderData.trackingInfo.waybill, 5),
              tracking: null
            });
          }
        } catch (cpErr) {
          console.warn("[OrderDetails] Clickpost fetch error (non-fatal):", cpErr);
          if (orderData?.trackingInfo?.waybill) {
            setClickpostData({
              waybill: orderData.trackingInfo.waybill,
              courierName: orderData.trackingInfo.courier,
              clickpostUrl: (orderData.trackingInfo.trackingUrl && orderData.trackingInfo.trackingUrl.includes('security_key'))
                ? orderData.trackingInfo.trackingUrl
                : getClickpostTrackingUrl(orderData.trackingInfo.waybill, 5),
              tracking: null
            });
          }
        }

        setOrder(orderData);
      } catch (err) {
        console.error("Order details fetch error:", err);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    }
    fetchOrderDetails();
  }, [id, accessToken]);

  const handleReturnClick = () => {
    if (isCancelled) {
      toast.info("This order has been cancelled and cannot be returned");
      return;
    }
    if (order.fulfillmentStatus !== 'FULFILLED') {
      toast.info("Returns are available once your order is delivered");
      return;
    }
    router.push(`/admin/orders/${id}/return`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading order details...</p>   
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 font-figtree">
        <AlertCircle size={48} className="mx-auto text-zinc-300 mb-4" />
        <h3 className="text-xl font-bold text-zinc-900">Order not found</h3>
        <Link prefetch={false} href="/admin/orders" className="text-primary hover:underline mt-4 block font-bold uppercase tracking-widest text-xs">
          Back to all orders
        </Link>
      </div>
    );
  }

  const formatCurrency = (amount, currencyCode) => {
    const val = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode || 'INR',
    }).format(val);
  };

  // Sorting logic for items
  const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
  const sortedLineItems = [...(order.lineItems || [])]
   .filter(item => {
     const rawProps = item.properties || item.customAttributes || [];
     const props = Array.isArray(rawProps)
       ? rawProps.reduce((acc, p) => ({ ...acc, [p.key || p.name]: p.value }), {})
       : rawProps;
     return !props['_byj_parent'] && !(props['_byj_group_id'] && !props['_byj_preview']);
   })
   .sort((a, b) => {
     const priceA = parseFloat(a.price?.amount || a.price || 0);
     const priceB = parseFloat(b.price?.amount || b.price || 0);
     return priceB - priceA;
   });

  const insuranceIdx = sortedLineItems.findIndex(item => 
    (item.variantId || item.variant?.id) === INSURANCE_VARIANT_ID || 
    (item.title || "").toLowerCase().includes("insurance")
  );

  if (insuranceIdx !== -1) {
    const insuranceItem = sortedLineItems.splice(insuranceIdx, 1)[0];
    if (sortedLineItems.length >= 1) {
      sortedLineItems.splice(1, 0, insuranceItem);
    } else {
      sortedLineItems.push(insuranceItem);
    }
  }

  // Parse order placed date
  const orderPlacedDate = order.processedAt ? new Date(order.processedAt) : new Date();

  // Helper to parse dates in DD/MM/YYYY or YYYY-MM-DD
  const parseFlexibleDate = (val) => {
    if (!val) return null;
    const s = String(val).trim();
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // Extract MTO and In-Stock dispatch dates
  let mtoDispatchDate = parseFlexibleDate(order.mtoDispatchDate);
  let inStockDispatchDate = parseFlexibleDate(order.inStockDispatchDate);

  sortedLineItems.forEach(item => {
    const rawProps = item.properties || item.customAttributes || [];
    const props = Array.isArray(rawProps)
      ? rawProps.reduce((acc, p) => ({ ...acc, [p.key || p.name]: p.value }), {})
      : rawProps;
    
    let shipDateStr = item.shippingDate || null;
    if (!shipDateStr) {
      for (const [k, v] of Object.entries(props)) {
        const normK = k.toLowerCase().replace(/[^a-z]/g, '');
        if (normK.includes('shippingdate') || normK.includes('dispatchdate')) {
          shipDateStr = v;
          break;
        }
      }
    }

    if (shipDateStr) {
      const parsed = parseFlexibleDate(shipDateStr);
      if (parsed) {
        const isIns = item.isInsurance || 
                      (item.title || "").toLowerCase().includes("insurance") || 
                      (item.sku || "").toLowerCase().includes("ins");
        if (isIns) {
          if (!inStockDispatchDate || parsed > inStockDispatchDate) inStockDispatchDate = parsed;
        } else {
          if (!mtoDispatchDate || parsed > mtoDispatchDate) mtoDispatchDate = parsed;
        }
      }
    }
  });

  const targetDispatchDate = mtoDispatchDate || inStockDispatchDate || parseFlexibleDate(order.targetDispatchDate);

  const stages = [
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

  // Extract real courier milestone dates from ClickPost scans (for Dispatch, In Transit, Out For Delivery, Delivered)
  const clickpostScanDates = (() => {
    const dates = {
      5: null, // Dispatch
      6: null, // In Transit
      7: null, // Out For Delivery
      8: null, // Delivered
    };

    const scans = clickpostData?.tracking?.scans || [];
    for (const scan of scans) {
      const bucket = scan.clickpost_status_bucket;
      const desc = (scan.clickpost_status_description || scan.status || scan.remark || "").toLowerCase().replace(/[^a-z0-9]/g, '');
      const t = scan.timestamp ? new Date(scan.timestamp) : null;
      if (!t || isNaN(t.getTime())) continue;

      if (bucket === 6 || (desc.includes('deliver') && !desc.includes('outfordelivery'))) {
        if (!dates[8] || t > dates[8]) dates[8] = t;
      } else if (bucket === 4 || desc.includes('outfordelivery') || desc.includes('outfordeliver')) {
        if (!dates[7] || t > dates[7]) dates[7] = t;
      } else if (bucket === 3 || desc.includes('intransit') || desc.includes('transit') || desc.includes('reachedhub') || desc.includes('departed')) {
        if (!dates[6] || t > dates[6]) dates[6] = t;
      } else if (
        bucket === 2 || 
        desc.includes('pickedup') || 
        desc.includes('dispatched') || 
        desc.includes('pickupdone') || 
        desc.includes('manifested') || 
        desc.includes('inward')
      ) {
        if (!dates[5] || t < dates[5]) dates[5] = t;
      }
    }

    const latest = clickpostData?.tracking?.latest_status;
    if (latest?.timestamp) {
      const lt = new Date(latest.timestamp);
      if (!isNaN(lt.getTime())) {
        const b = latest.clickpost_status_bucket;
        const d = (latest.clickpost_status_description || latest.status || "").toLowerCase().replace(/[^a-z0-9]/g, '');
        if (b === 6 || (d.includes('deliver') && !d.includes('outfordelivery'))) {
          if (!dates[8]) dates[8] = lt;
        } else if (b === 4 || d.includes('outfordelivery')) {
          if (!dates[7]) dates[7] = lt;
        } else if (b === 3 || d.includes('intransit') || d.includes('transit')) {
          if (!dates[6]) dates[6] = lt;
        } else if (b === 2 || d.includes('pickedup') || d.includes('dispatched') || d.includes('pickupdone')) {
          if (!dates[5]) dates[5] = lt;
        }
      }
    }

    const additional = clickpostData?.tracking?.additional;
    if (!dates[5] && additional?.pickup_date) {
      const pt = new Date(additional.pickup_date);
      if (!isNaN(pt.getTime())) dates[5] = pt;
    }

    return dates;
  })();

  // Dynamic calculation of milestone dates for all orders (In-stock, Express, MTO)
  const stageDates = (() => {
    const placed = new Date(orderPlacedDate);
    const placedDay = new Date(placed.getFullYear(), placed.getMonth(), placed.getDate());

    let dispatchDay;
    if (targetDispatchDate && !isNaN(targetDispatchDate.getTime())) {
      dispatchDay = new Date(targetDispatchDate.getFullYear(), targetDispatchDate.getMonth(), targetDispatchDate.getDate());
    } else {
      dispatchDay = new Date(placedDay.getTime() + 10 * 86400000);
    }

    if (dispatchDay < placedDay) {
      dispatchDay = placedDay;
    }

    const diffDays = Math.round((dispatchDay.getTime() - placedDay.getTime()) / 86400000);

    // If actual courier dispatch scan exists from ClickPost, use it for dispatch date
    const actualDispatch = clickpostScanDates?.[5];
    const effectiveDispatch = actualDispatch || dispatchDay;

    if (diffDays <= 0) {
      // In-stock / Same-day shipping: crafting is already complete; everything aligns with dispatch target
      return {
        0: placed,
        1: placed,
        2: placed,
        3: placed,
        4: placed,
        5: effectiveDispatch,
      };
    }

    if (diffDays === 1) {
      // Next-day shipping
      return {
        0: placed,
        1: placed,
        2: placed,
        3: dispatchDay,
        4: dispatchDay,
        5: effectiveDispatch,
      };
    }

    if (diffDays <= 3) {
      // 2-3 days shipping
      const mid1 = new Date(placedDay.getTime() + 1 * 86400000);
      return {
        0: placed,
        1: placed,
        2: mid1,
        3: mid1,
        4: dispatchDay,
        5: effectiveDispatch,
      };
    }

    // MTO / Extended timeline (4+ days)
    const totalMs = dispatchDay.getTime() - placedDay.getTime();
    const d1 = new Date(placedDay.getTime() + Math.min(86400000, Math.round(totalMs * 0.08)));
    const d2 = new Date(placedDay.getTime() + Math.round(totalMs * 0.28));
    const d3 = new Date(placedDay.getTime() + Math.round(totalMs * 0.65));
    const d4 = new Date(placedDay.getTime() + Math.round(totalMs * 0.85));

    return {
      0: placed,
      1: d1 > dispatchDay ? dispatchDay : d1,
      2: d2 > dispatchDay ? dispatchDay : d2,
      3: d3 > dispatchDay ? dispatchDay : d3,
      4: d4 > dispatchDay ? dispatchDay : d4,
      5: effectiveDispatch,
    };
  })();

  // Map Shopify, custom ERP & ClickPost live courier tracking to stage index
  let currentStageIndex = 0;
  const isCancelled = Boolean(
    order.cancelledAt || 
    order.cancelled_at || 
    order.cancelReason || 
    order.cancel_reason || 
    order.status === 'Cancelled' || 
    order.status === 'Canceled' ||
    (typeof order.status === 'string' && order.status.toUpperCase() === 'CANCELLED')
  );
  const status = (order.fulfillmentStatus || "").toUpperCase();
  const fStatus = (order.financialStatus || "").toUpperCase();
  const rawStatus = (order.reason_status_description || order.status || "").toLowerCase();
  const normalizedStatus = rawStatus.replace(/[^a-z0-9]/g, '');
  const nowTime = Date.now();

  const cpBucket = clickpostData?.tracking?.status_bucket;
  const cpDesc = (clickpostData?.tracking?.status_description || clickpostData?.tracking?.latest_status?.status || "").toLowerCase().replace(/[^a-z0-9]/g, '');

  const hasCourierPickup = Boolean(
    (cpBucket && cpBucket >= 2) || 
    cpDesc.includes('pickedup') || 
    cpDesc.includes('dispatched') || 
    clickpostScanDates[5]
  );
  const isFulfilled = status === 'FULFILLED' || status === 'SHIPPED';

  // Upcoming dispatch date guard (e.g. 10 Oct for MTO placed on 22 Sept):
  // Courier hasn't moved yet (cpBucket <= 1). Crafting milestones apply.
  const isBeforeDispatchDate = Boolean(targetDispatchDate && nowTime < stageDates[5]?.getTime());

  // ClickPost live tracking & ERP status checks:
  const isDelivered = status === 'DELIVERED' || cpBucket === 6 || (cpDesc.includes('deliver') && !cpDesc.includes('outfordelivery')) || (normalizedStatus.includes('deliver') && !normalizedStatus.includes('outfordelivery'));
  const isOutForDelivery = cpBucket === 4 || cpDesc.includes('outfordelivery') || normalizedStatus.includes('outfordelivery');
  const isInTransit = cpBucket === 3 || cpDesc.includes('intransit') || cpDesc.includes('transit') || cpDesc.includes('reachedhub') || cpDesc.includes('departed') || (!isBeforeDispatchDate && (normalizedStatus.includes('transit') || status === 'IN_TRANSIT'));
  const isDispatched = cpBucket === 2 || cpDesc.includes('pickedup') || cpDesc.includes('dispatched') || hasCourierPickup || isFulfilled || normalizedStatus.includes('dispatched') || normalizedStatus.includes('shipped');

  if (isCancelled) {
    currentStageIndex = 0;
  } else if (isDelivered) {
    currentStageIndex = 8; // Delivered (from ClickPost bucket 6)
  } else if (isOutForDelivery) {
    currentStageIndex = 7; // Out For Delivery (from ClickPost bucket 4)
  } else if (isInTransit) {
    currentStageIndex = 6; // In Transit (from ClickPost bucket 3)
  } else if (isDispatched) {
    currentStageIndex = 5; // Dispatch (from ClickPost bucket 2)
  } 
  // Proportional manufacturing & crafting milestones
  else if (normalizedStatus.includes('certif') || normalizedStatus.includes('hallmark') || (stageDates[4] && nowTime >= stageDates[4].getTime())) {
    currentStageIndex = 4; // Certification (~85%)
  } 
  else if (normalizedStatus.includes('quality') || normalizedStatus.includes('qc') || (stageDates[3] && nowTime >= stageDates[3].getTime())) {
    currentStageIndex = 3; // Quality Control (~65%)
  } 
  else if (normalizedStatus.includes('manufactur') || normalizedStatus.includes('production') || normalizedStatus.includes('making') || (stageDates[2] && nowTime >= stageDates[2].getTime())) {
    currentStageIndex = 2; // Manufacturing (~28%)
  } 
  else if (
    normalizedStatus.includes('process') || 
    normalizedStatus.includes('pogenerated') ||
    normalizedStatus.includes('orderplaced') ||
    normalizedStatus.includes('inprogress') ||
    status === 'IN_PROGRESS' ||
    fStatus === 'PAID' ||
    fStatus === 'PARTIALLY_PAID' ||
    (stageDates[1] && nowTime >= stageDates[1].getTime())
  ) {
    currentStageIndex = 1; // Processing / PO Generated
  } else {
    currentStageIndex = 0; // Order Confirmed
  }

  // Ensure index is within bounds
  const progressPct = Math.min(100, (currentStageIndex / (stages.length - 1)) * 100);

  return (
    <div className="font-figtree space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <Link prefetch={false} href="/admin/orders" className="size-10 bg-white border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-900 hover:bg-zinc-50 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-primary tracking-tight">Order #{order.orderNumber}</h2>
          <p className="text-zinc-500 font-medium text-sm md:text-base">Placed on {new Date(order.processedAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
        </div>
      </div>

      {isCancelled && (
        <div className="bg-red-50/70 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs md:text-sm font-medium flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <span>
            This order was cancelled{order.cancelledAt ? ` on ${new Date(order.cancelledAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}` : ""}.
            {order.cancelReason ? ` Reason: ${order.cancelReason}` : ""}
          </span>
        </div>
      )}

      {/* Order Status Timeline */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 sm:p-8 md:p-9 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        {/* Header: Status Headline & Action */}
        <div className="flex items-center justify-between gap-4 pb-6 mb-8 border-b border-zinc-100">     
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                isCancelled
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : isDelivered 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                    : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                {isCancelled ? <AlertCircle size={12} /> : isDelivered ? <CheckCircle2 size={12} /> : <Clock size={12} />}      
                {isCancelled ? "Cancelled" : stages[currentStageIndex]}
              </span>
              {clickpostData?.courierName && (
                <span className="text-[11px] text-zinc-400 font-normal">via {clickpostData.courierName}</span>
              )}
            </div>
            {isDelivered && (
              <p className="text-xs text-zinc-500 font-medium mt-1">
                Delivered on {order.documentDate ? new Date(order.documentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : (order.processedAt ? new Date(order.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently')}
              </p>
            )}
          </div>

          {/* Desktop action button */}
          <div className="hidden md:flex items-center gap-2.5">
            {clickpostData?.clickpostUrl ? (
              <a
                href={clickpostData.clickpostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
              >
                <Truck size={13} />
                <span>Track Your Order</span>
                <ExternalLink size={12} className="text-zinc-400" />
              </a>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200/60 rounded-xl text-xs font-medium text-zinc-500">
                <Truck size={14} className="text-zinc-400" />
                <span>Live tracking available</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Timeline (md and up) */}
        <div className="hidden md:block pt-2 pb-2">
          {/* 8 Milestone Steps with perfectly centered connecting lines */}
          <div className="flex w-full">
            {stages.map((stage, index) => {
              const isCompleted = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;

              return (
                <div key={stage} className="flex-1 min-w-0 flex flex-col items-center text-center px-1">
                  {/* Circle Node & Connecting Line Row - guarantees circles are 100% centered on the line */}
                  <div className="relative w-full h-6 flex items-center justify-center mb-2.5">
                    {/* Connecting line to the next circle */}
                    {index < stages.length - 1 && (
                      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 w-full h-[2px] bg-zinc-100 z-0">
                        <div
                          className={`h-full transition-all duration-500 ease-out ${
                            index < currentStageIndex
                              ? isDelivered
                                ? "bg-emerald-600"
                                : "bg-zinc-900"
                              : "w-0"
                          }`}
                          style={{ width: index < currentStageIndex ? "100%" : "0%" }}
                        />
                      </div>
                    )}

                    {/* The Circle - positioned with z-10 directly ON the line */}
                    <div
                      className={`relative z-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                        isCompleted
                          ? isDelivered
                            ? "size-4 bg-emerald-600 text-white"
                            : "size-4 bg-zinc-900 text-white"
                          : "size-2.5 bg-white border-2 border-zinc-200"
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={9} strokeWidth={3} className="text-white" />
                      ) : null}
                    </div>
                  </div>

                  {/* Clean Title Case Stage Label */}
                  <p
                    className={`text-[11px] leading-tight transition-colors ${
                      isCurrent
                        ? "text-zinc-900 font-semibold"
                        : isCompleted
                          ? "text-zinc-700 font-medium"
                          : "text-zinc-400 font-normal"
                    }`}
                  >
                    {stage}
                  </p>

                  {/* Calculated Milestone Date (0-5) or ClickPost Courier Scan Date (5-8) */}
                  {index <= 5 && stageDates[index] ? (
                    <span className={`text-[10px] ${isCurrent ? 'text-zinc-800 font-semibold' : 'text-zinc-400 font-normal'} mt-1`}>
                      {(index === 5 && clickpostScanDates[5])
                        ? clickpostScanDates[5].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                        : stageDates[index].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  ) : index >= 6 && clickpostScanDates[index] ? (
                    <span className={`text-[10px] ${isCurrent ? 'text-zinc-800 font-semibold' : 'text-zinc-500 font-medium'} mt-1`}>
                      {clickpostScanDates[index].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  ) : isCurrent && order.documentDate ? (
                    <span className="text-[10px] text-zinc-500 font-medium mt-1">
                      {new Date(order.documentDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Stepper Timeline (below md) */}
        <div className="md:hidden pt-1">
          <div className="relative pl-2">
            {/* Vertical Track Line - strictly bounded to the step nodes */}
            <div className="absolute left-[17px] top-2.5 bottom-2.5 w-[2px] bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`w-full transition-all duration-700 ease-out ${
                  isDelivered ? "bg-emerald-600" : "bg-zinc-900"
                }`}
                style={{ height: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
              />
            </div>

            <div className="space-y-4 relative z-10">
              {stages.map((stage, index) => {
                const isCompleted = index <= currentStageIndex;
                const isCurrent = index === currentStageIndex;

                return (
                  <div key={stage} className="flex items-center gap-3.5">
                    <div className="w-5 flex items-center justify-center shrink-0">
                      <div
                        className={`rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                          isCompleted
                            ? isDelivered
                              ? "size-4 bg-emerald-600 text-white"
                              : "size-4 bg-zinc-900 text-white"
                            : "size-2.5 bg-white border-2 border-zinc-200"
                        }`}
                      >
                        {isCompleted ? (
                          <Check size={9} strokeWidth={3} className="text-white" />
                        ) : null}
                      </div>
                    </div>

                    <div className="flex-1 flex items-baseline justify-between gap-2">
                      <p
                        className={`text-xs ${
                          isCurrent
                            ? "text-zinc-900 font-semibold"
                            : isCompleted
                              ? "text-zinc-700 font-medium"
                              : "text-zinc-400 font-normal"
                        }`}
                      >
                        {stage}
                      </p>

                      {index <= 5 && stageDates[index] ? (
                        <span className={`text-[11px] ${isCurrent ? 'text-zinc-800 font-semibold' : 'text-zinc-400 font-normal'}`}>
                          {(index === 5 && clickpostScanDates[5])
                            ? clickpostScanDates[5].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                            : stageDates[index].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      ) : index >= 6 && clickpostScanDates[index] ? (
                        <span className={`text-[11px] ${isCurrent ? 'text-zinc-800 font-semibold' : 'text-zinc-500 font-medium'}`}>
                          {clickpostScanDates[index].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      ) : isCurrent && order.documentDate ? (
                        <span className="text-[11px] text-zinc-500 font-medium">
                          {new Date(order.documentDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Track on ClickPost button - clean spacing with NO lines intersecting */}
          {clickpostData?.clickpostUrl ? (
            <div className="mt-6">
              <a
                href={clickpostData.clickpostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
              >
                <Truck size={13} />
                <span>Track Your Order</span>
                <ExternalLink size={12} className="text-zinc-400" />
              </a>
            </div>
          ) : (
            <div className="mt-6">
              <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-200/60 rounded-xl text-xs font-medium text-zinc-500">
                <Truck size={14} className="text-zinc-400" />
                <span>Live tracking available</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ClickPost Courier & Delivery Tracking Details */}
      {(clickpostData?.waybill || clickpostData?.clickpostUrl || clickpostData?.tracking) && (
        currentStageIndex >= 5 || (clickpostData.tracking?.scans && clickpostData.tracking.scans.length > 0 && clickpostData.tracking.status_bucket > 1) ? (
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
              <div className="flex items-center gap-3.5">
                <div className="size-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                  <Truck size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-zinc-900">
                      {clickpostData.courierName || clickpostData.tracking?.courier_name || "Courier"} Tracking
                    </h4>
                    {clickpostData.tracking?.latest_status?.status && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-zinc-100 text-zinc-700">
                        {clickpostData.tracking.latest_status.status}
                      </span>
                    )}
                  </div>
                  {clickpostData.waybill && (
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                      <span>AWB: <strong className="text-zinc-800 font-mono font-medium">{clickpostData.waybill}</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopyWaybill(clickpostData.waybill)}
                        className="text-zinc-400 hover:text-zinc-700 transition-colors p-0.5"
                        title="Copy AWB number"
                      >
                        {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {clickpostData.clickpostUrl && (
                <a
                  href={clickpostData.clickpostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0"
                >
                  <span>Track Your Order</span>
                  <ExternalLink size={13} className="text-zinc-400" />
                </a>
              )}
            </div>

            {/* Live Scans Timeline if available */}
            {clickpostData.tracking?.scans && clickpostData.tracking.scans.length > 0 ? (
              <div className="mt-6 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-5">Latest Courier Activity</p>
                <div className="space-y-5 border-l border-zinc-200 ml-3 pl-5 relative">
                  {clickpostData.tracking.scans.map((scan, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-white ${
                        idx === 0 ? "bg-emerald-600 ring-4 ring-emerald-100" : "bg-zinc-300"
                      }`} />
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <p className={`text-xs font-semibold ${idx === 0 ? "text-zinc-900" : "text-zinc-700"}`}>
                          {scan.status || scan.clickpost_status_description || "Update"}
                          {scan.location ? ` — ${scan.location}` : ""}
                        </p>
                        {scan.timestamp && (
                          <span className="text-[11px] text-zinc-400 font-normal shrink-0">
                            {new Date(scan.timestamp).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        )}
                      </div>
                      {scan.remark && (
                        <p className="text-xs text-zinc-500 mt-0.5">{scan.remark}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-1 text-xs text-zinc-500">
                Shipment is registered with the courier. Click above to view live tracking milestones on ClickPost.
              </div>
            )}
          </div>
        ) : null
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items */}
          <div className="bg-white rounded-[8px] border border-zinc-100 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-primary uppercase tracking-tight">Items in this order</h3>  
            </div>
            <div className="divide-y divide-zinc-100">
              {sortedLineItems.map((item, index) => {
                 const isInsurance = (item.variantId || item.variant?.id) === INSURANCE_VARIANT_ID || (item.title || "").toLowerCase().includes("insurance");
                 const handle = item.handle || item.productHandle || item.product_handle || item.variant?.product?.handle;
                 const variantId = (item.variantId || item.variant?.id || "").split("/").pop();
                 const productUrl = handle ? `/products/${handle}${variantId ? `?variant=${variantId}` : ""}` : `/search?q=${encodeURIComponent(item.title)}`;

                 // BYJ Logic
                 const rawProps = item.properties || item.customAttributes || [];
                 const properties = Array.isArray(rawProps) 
                   ? rawProps.reduce((acc, p) => ({ ...acc, [p.key || p.name]: p.value }), {})
                   : rawProps;
                 
                 const isBYJ = properties['_byj_preview'];
                 const byjCharms = properties['_byj_charms_json'] ? JSON.parse(properties['_byj_charms_json']) : [];
                 const displayImage = isBYJ ? properties['_byj_preview'] : getOrderImage(item.image || item.variant?.image?.url);

                 return (
                  <div key={index} className="p-8 flex flex-col gap-6">
                    <div className="flex gap-6 items-center">
                      {displayImage && (
                        <div className="size-24 bg-zinc-50 rounded-2xl overflow-hidden shrink-0 border border-zinc-100">
                          <Image loader={shopifyLoader} src={displayImage} alt={item.title} width={96} height={96} className="object-cover w-full h-full" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-zinc-900">{item.title}</h4>
                        <p className="text-xs text-zinc-500 font-medium mt-1">Quantity: {item.quantity}</p>
                        <p className="text-lg font-bold text-primary mt-2">
                          {formatCurrency(item.price?.amount || item.price, item.price?.currencyCode || item.variant?.price?.currencyCode)}
                        </p>
                      </div>
                      {!isInsurance && handle && (
                        <div className="hidden sm:block">
                          <Link prefetch={false} href={productUrl} className="px-6 py-2 border-2 border-zinc-100 text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-50 transition-colors">
                            View Product
                          </Link>
                        </div>
                      )}
                    </div>

                    {isBYJ && (
                      <div className="mt-4 bg-[#fef5f1] p-6 rounded-md space-y-4 border border-[#e0d0ba]/30">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-b border-[#e0d0ba] pb-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c4f3a] mb-1">Style</p>
                            <p className="text-sm font-medium text-zinc-800">{properties['Style']}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c4f3a] mb-1">Material</p>
                            <p className="text-sm font-medium text-zinc-800">{properties['Material']}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c4f3a] mb-1">Length</p>
                            <p className="text-sm font-medium text-zinc-800">{properties['Length']}</p>
                          </div>
                          {properties['_byj_preview'] && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c4f3a] mb-1">Preview Design</p>
                              <a href={properties['_byj_preview']} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                                View Full Image
                              </a>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c4f3a] mb-3">Charms Selection</p>
                          <div className="space-y-3">
                            {byjCharms.map((charm, idx) => (
                              <div key={idx} className="flex justify-between items-center gap-4">
                                <div className="flex gap-3 items-center">
                                  <div className="w-8 h-8 bg-white border border-[#e0d0ba]/50 rounded-sm overflow-hidden p-1">
                                    <img src={charm.img} alt={charm.title} className="w-full h-full object-contain" />
                                  </div>
                                  <span className="text-sm font-medium text-zinc-800">{idx + 1}. {charm.title} {charm.qty > 1 ? `x ${charm.qty}` : ''}</span>
                                </div>
                                <span className="text-sm font-bold text-[#1c1810]">₹ {(parseFloat(charm.price * charm.qty / 100)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                 );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment Details */}
            <div className="bg-white rounded-[8px] border border-zinc-100 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">  
                  <CreditCard size={20} />
                </div>
                <h3 className="text-lg font-bold text-primary uppercase tracking-tight">Payment</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</span>     
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {order.financialStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Amount</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(order.totalPrice?.amount || order.totalPrice, order.totalPrice?.currencyCode)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-[8px] border border-zinc-100 p-8 shadow-sm h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <h3 className="text-lg font-bold text-primary uppercase tracking-tight">Delivery Address</h3>   
              </div>
              {order.shippingAddress && order.shippingAddress.address1 ? (
                <div className="space-y-1 text-sm text-zinc-600 font-medium">
                  <p className="text-zinc-900 font-bold">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  <p>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}</p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && <p className="mt-2 text-zinc-400">{order.shippingAddress.phone}</p>}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-zinc-100 rounded-2xl">
                   <p className="text-sm text-zinc-400 font-medium italic text-center">No delivery address provided<br/>for this order.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Order Summary */}
          <div className="bg-white rounded-[8px] border border-zinc-100 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-primary uppercase tracking-tight mb-6">Order Summary</h3>     
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">Subtotal</span>
                <span className="text-zinc-900 font-bold">{formatCurrency(order.subtotalPrice?.amount || order.subtotalPrice, order.subtotalPrice?.currencyCode)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">Shipping</span>
                <span className="text-emerald-600 font-bold">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">Estimated Tax</span>
                <span className="text-zinc-900 font-bold">{formatCurrency(order.totalTax?.amount || order.totalTax, order.totalTax?.currencyCode)}</span>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                <span className="text-lg font-bold text-primary uppercase tracking-tight">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(order.totalPrice?.amount || order.totalPrice, order.totalPrice?.currencyCode)}
                </span>
              </div>
            </div>
          </div>

          {/* Help Center */}
          <div className="bg-zinc-900 rounded-[4px] p-8 text-white relative overflow-hidden shadow-xl shadow-zinc-200">
            <div className="absolute -right-10 -bottom-10 size-40 bg-white/5 rounded-full blur-2xl" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <HelpCircle size={20} />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight">Need Help?</h3>
              </div>
              <p className="text-sm text-zinc-400 font-medium">Have questions about your order or our delivery process?</p>
              <div className="space-y-3">
                <button
                  onClick={handleReturnClick}
                  disabled={order.fulfillmentStatus !== 'FULFILLED' || isCancelled}
                  title={isCancelled ? "This order has been cancelled" : order.fulfillmentStatus !== 'FULFILLED' ? "Available once your order is delivered" : "Request a return"}
                  className="w-full flex items-center justify-between p-4 bg-white/5 rounded-sm hover:bg-white/10 transition-colors border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center gap-3">
                    <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-base font-bold">{isCancelled ? "Order Cancelled" : "Request a Return"}</span>
                  </div>
                  <ChevronLeft className="rotate-180 size-6" />
                </button>
                <a href="https://wa.me/+917208934782" target="_blank" className="flex items-center justify-between p-4 bg-white/5 rounded-sm hover:bg-white/10 transition-colors border border-white/5">
                  <span className="text-base font-bold">Chat with Support</span>
                  <ChevronLeft className="rotate-180 size-6" />
                </a>
                <Link prefetch={false} href="/pages/shipping-policy" className="flex items-center justify-between p-4 bg-white/5 rounded-sm hover:bg-white/10 transition-colors border border-white/5">
                  <span className="text-base font-bold">Shipping Policy</span>
                  <ChevronLeft className="rotate-180 size-6" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}