"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  ShoppingBag, ChevronRight, Package, Truck,
  CheckCircle2, Clock, Loader2, ChevronDown, RefreshCcw
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import { shopifyStorefrontFetch, CUSTOMER_ORDERS_QUERY } from "@/lib/shopify-client";
import { apiFetch } from "@/lib/api";

export default function MyOrdersPage() {
  const { accessToken } = useSelector((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [returnLoading, setReturnLoading] = useState(null); // Track which order is loading return

  useEffect(() => {
    async function fetchOrders() {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Hybrid Strategy: Try backend first, fallback to Storefront API
        let storefrontOrders = [];
        try {
          const data = await apiFetch("/api/customer/orders");
          if (data && data.orders) {
            storefrontOrders = data.orders.map((order) => {
              const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
              const items = order.lineItems || [];

              let displayProduct = order.product;
              let displayImage = order.image;

              if (items.length > 0) {
                const sortedItems = [...items].sort((a, b) => {
                  const isAInsurance = (a.variantId || a.variant?.id) === INSURANCE_VARIANT_ID ||
                    (a.title || "").toLowerCase().includes("insurance");
                  const isBInsurance = (b.variantId || b.variant?.id) === INSURANCE_VARIANT_ID ||
                    (b.title || "").toLowerCase().includes("insurance");

                  if (isAInsurance && !isBInsurance) return 1;
                  if (!isAInsurance && isBInsurance) return -1;

                  const priceA = parseFloat(a.price?.amount || a.variant?.price?.amount || 0);
                  const priceB = parseFloat(b.price?.amount || b.variant?.price?.amount || 0);
                  return priceB - priceA;
                });
                displayProduct = sortedItems[0]?.title || displayProduct;
                
                // BYJ Preview Priority
                const mainItem = sortedItems[0];
                const rawProps = mainItem?.properties || mainItem?.customAttributes || [];
                const props = Array.isArray(rawProps) 
                  ? rawProps.reduce((acc, p) => ({ ...acc, [p.key || p.name]: p.value }), {})
                  : rawProps;
                
                displayImage = props['_byj_preview'] || sortedItems[0]?.image || sortedItems[0]?.variant?.image?.url || displayImage;
              }

              const fStatus = (order.fulfillmentStatus || order.status || "").toUpperCase();
              return {
                ...order,
                id: order.id,
                orderNumber: (order.orderNumber || order.order_number || "").toString(),
                date: order.date || (order.processedAt || order.processed_at ? new Date(order.processedAt || order.processed_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "N/A"),
                status: (fStatus === 'FULFILLED' || fStatus === 'DELIVERED') ? 'Delivered' :
                  (fStatus === 'PARTIAL' || fStatus === 'IN_TRANSIT' || fStatus === 'IN_PROGRESS') ? 'In Transit' : 'Processing',
                amount: order.amount || new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: order.totalPrice?.currencyCode || order.currency || 'INR',
                }).format(parseFloat(order.totalPrice?.amount || order.total_price || order.totalPrice || 0)),
                product: displayProduct || "Jewelry Item",
                image: displayImage || "/images/product/1.jpg",
                customerEmail: order.customerEmail || order.customer?.email || ""
              };
            });
          } else {
            throw new Error("Empty backend orders");
          }
        } catch (backendErr) {
          console.warn("[MyOrdersPage] Backend orders fetch failed, falling back to Storefront API:", backendErr);

          if (!accessToken.startsWith("simulated_")) {
            const data = await shopifyStorefrontFetch(CUSTOMER_ORDERS_QUERY, {
              customerAccessToken: accessToken,
              first: 20
            });

            storefrontOrders = data?.customer?.orders?.edges?.map(({ node }) => {
              const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
              const items = node.lineItems?.edges?.map(e => e.node) || [];

              // Sort items by price DESC, but keep non-insurance items as priority for "mainItem"
              const sortedItems = [...items].sort((a, b) => {
                const isAInsurance = a.variant?.id === INSURANCE_VARIANT_ID;
                const isBInsurance = b.variant?.id === INSURANCE_VARIANT_ID;
                if (isAInsurance && !isBInsurance) return 1;
                if (!isAInsurance && isBInsurance) return -1;

                const priceA = parseFloat(a.variant?.price?.amount || 0);
                const priceB = parseFloat(b.variant?.price?.amount || 0);
                return priceB - priceA;
              });

              const mainItem = sortedItems[0];
              const fStatus = (node.fulfillmentStatus || "").toUpperCase();

              // BYJ Preview Priority
              const props = mainItem?.customAttributes?.reduce((acc, a) => ({ ...acc, [a.key]: a.value }), {}) || {};
              const displayImage = props['_byj_preview'] || mainItem?.variant?.image?.url || "/images/product/1.jpg";

              return {
                id: node.id,
                orderNumber: node.orderNumber.toString(),
                date: new Date(node.processedAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                status: (fStatus === 'FULFILLED' || fStatus === 'DELIVERED') ? 'Delivered' :
                  fStatus === 'PARTIAL' ? 'In Transit' : 'Processing',
                amount: new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: node.totalPrice.currencyCode,
                }).format(node.totalPrice.amount),
                product: mainItem?.title || "Jewelry Item",
                image: displayImage,
                customerEmail: data?.customer?.email || ""
              };
            }) || [];
          }
        }

        setOrders(storefrontOrders);
        setFilteredOrders(storefrontOrders);
      } catch (err) {
        console.error("Orders Fetch Error:", err);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [accessToken]);

  const handleReturnClick = async (e, order) => {
    e.preventDefault();
    if (order.status !== 'Delivered') {
      toast.info("Returns are only available after delivery");
      return;
    }

    try {
      setReturnLoading(order.id);
      const data = await apiFetch('/api/customer/returns', {
        method: 'POST',
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          customerEmail: order.customerEmail,
        }),
      });
      if (data.success) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || "Failed to initiate return");
      }
    } catch (err) {
      toast.error("Failed to connect to Return Prime");
    } finally {
      setReturnLoading(null);
    }
  };

  useEffect(() => {
    let result = orders;
    if (searchQuery) {
      result = result.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.product.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter) {
      result = result.filter((order) => order.status === statusFilter);
    }
    setFilteredOrders(result);
  }, [searchQuery, statusFilter, orders]);

  if (loading) {
    return (
      <div className="font-figtree flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-white rounded-[2rem] md:rounded-[3rem] border border-zinc-100">
        <Loader2 className="size-8 md:size-10 animate-spin text-primary" />
        <p className="font-figtree text-zinc-400 font-semibold uppercase tracking-[0.13em] text-xs">
          Loading your history...
        </p>
      </div>
    );
  }

  const uniqueStatuses = [...new Set(orders.map((o) => o.status))];

  return (
    <div className="font-figtree space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-figtree text-xl md:text-2xl font-bold text-primary tracking-tight mb-1">
            My Orders
          </h2>
          <p className="font-figtree text-sm md:text-base text-zinc-500 font-medium leading-relaxed">
            View your order history and track active deliveries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orders.length > 0 && (
            <div className="font-figtree px-4 py-2 bg-white border border-zinc-100 rounded-xl text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {orders.length} Total Orders
            </div>
          )}
        </div>
      </div>

      {/* ── Monsoon Delay Banner ── */}
      <div className="relative w-full rounded-xl md:rounded-2xl overflow-hidden flex items-center justify-center py-4 px-4 shadow-sm">
        <img 
          src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/image_3526.jpg?v=1783507410" 
          alt="Monsoon Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center gap-3">
          <img 
            src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437257686.png?v=1783507437" 
            alt="Rain Cloud Icon" 
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
          />
          <span className="text-white font-figtree text-sm md:text-base font-medium">
            Orders are delayed due to the monsoon.
          </span>
        </div>
      </div>

      {/* ── Filters ── */}
      {orders.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by order # or product..."
              className="font-figtree w-full pl-11 md:pl-12 pr-4 py-3.5 md:py-4 bg-white border border-zinc-100 rounded-2xl text-sm font-normal text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-zinc-300">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="w-full md:w-56 relative">
            <select
              className="font-figtree w-full px-4 py-3.5 md:py-4 bg-white border border-zinc-100 rounded-2xl text-sm font-normal text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none shadow-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
              <ChevronDown size={18} />
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Order Cards ── */}
      <div className="space-y-6 md:space-y-6">
        {filteredOrders.map((order) => {
          const isDelivered = order.status === "Delivered";
          const isInTransit = order.status === "In Transit";

          return (
            <div
              key={order.id}
              className="bg-white rounded-[2.5rem] md:rounded-[2rem] border border-zinc-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 group"
            >
              <div className="p-5 md:p-8 flex flex-col md:flex-row gap-5 md:gap-10 md:items-center">

                {/* Top Section: Image + Info Row on Mobile */}
                <div className="flex flex-row gap-4 md:gap-10 flex-1 items-start md:items-center">
                  {/* Product image - Left aligned on mobile */}
                  <div className="size-24 md:size-36 bg-[#FBFBFB] rounded-2xl md:rounded-[2.25rem] overflow-hidden shrink-0 border border-zinc-50 relative flex items-center justify-center p-2 md:p-4">
                    <Image
                      src={order.image}
                      alt={order.product}
                      width={140}
                      height={140}
                      className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  </div>

                  {/* Order info - Right of image on mobile */}
                  <div className="flex-1 space-y-2 md:space-y-4 text-left">

                    {/* Order # + Status badges */}
                    <div className="flex flex-wrap justify-start items-center gap-2">
                      <span className="font-figtree text-[9px] md:text-[11px] font-bold text-zinc-400 bg-zinc-50/80 px-2.5 md:px-4 py-1 rounded-full uppercase tracking-[0.1em] border border-zinc-100/50">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`font-figtree px-2.5 md:px-4 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-[0.05em] flex items-center gap-1.5 border ${isDelivered
                          ? "text-emerald-600 bg-emerald-50/40 border-emerald-100/60"
                          : isInTransit
                            ? "text-blue-600 bg-blue-50/40 border-blue-100/60"
                            : "text-orange-600 bg-orange-50/40 border-orange-100/60"
                          }`}
                      >
                        <div className={`size-1 md:size-1.5 rounded-full ${isDelivered ? "bg-emerald-500" : isInTransit ? "bg-blue-500" : "bg-orange-500"
                          } animate-pulse`} />
                        {order.status}
                      </span>
                    </div>

                    {/* Product name + date */}
                    <div className="space-y-0.5 md:space-y-1.5">
                      <h4 className="font-figtree text-sm md:text-xl font-bold text-zinc-900 leading-tight tracking-tight">
                        {order.product}
                      </h4>
                      <p className="font-figtree text-[10px] md:text-sm text-zinc-400 font-medium">
                        Ordered on {order.date}
                      </p>
                    </div>

                    {/* Price Section */}
                    <div className="pt-1 md:pt-2">
                      <p className="font-figtree text-[9px] md:text-[10px] font-bold text-zinc-300 uppercase tracking-[0.15em] mb-0.5 md:mb-1.5">
                        Price Paid
                      </p>
                      <p className="font-figtree text-base md:text-2xl font-bold text-[#3F2A28] tracking-tight">
                        {order.amount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons - Row on mobile, Column on desktop */}
                <div className="flex flex-row md:flex-col gap-3 w-full md:w-64 shrink-0 pt-2 md:pt-0">
                  <button
                    type="button"
                    title="Return/Exchange portal is currently under maintenance. Please contact support."
                    className="font-figtree flex-1 md:w-full py-3 md:py-4 border-[1.5px] border-zinc-200 text-zinc-400 text-[9px] md:text-[11px] text-center font-bold uppercase tracking-[0.05em] md:tracking-[0.15em] rounded-xl md:rounded-[1.25rem] cursor-not-allowed flex items-center justify-center gap-1.5 md:gap-2.5 transition-colors"
                  >
                    <RefreshCcw size={13} className="opacity-40" />
                    <span className="truncate">Return / Exchange</span>
                  </button>
                  <Link prefetch={false}
                    href={`/admin/orders/${order.id.split("/").pop()}`}
                    className="font-figtree flex-1 md:w-full py-3 md:py-4 bg-[#5A413F] text-white text-[9px] md:text-[11px] text-center font-bold uppercase tracking-[0.05em] md:tracking-[0.15em] rounded-xl md:rounded-[1.25rem] hover:bg-[#4A3533] transition-all duration-300 shadow-md md:shadow-[0_10px_20px_rgba(90,65,63,0.15)] active:scale-[0.98] flex items-center justify-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Empty State ── */}
        {orders.length === 0 && (
          <div className="py-16 md:py-20 text-center space-y-5 md:space-y-6 bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-zinc-100">
            <div className="size-16 md:size-20 bg-zinc-50 text-zinc-300 rounded-3xl flex items-center justify-center mx-auto">
              <ShoppingBag size={34} />
            </div>
            <div className="space-y-2">
              <h3 className="font-figtree text-lg md:text-2xl font-bold text-zinc-900">
                No orders yet
              </h3>
              <p className="font-figtree text-sm text-zinc-500 font-normal max-w-sm mx-auto leading-relaxed">
                Once you make your first purchase, it will appear here for you to track and manage.
              </p>
            </div>
            <Link prefetch={false}
              href="/collections/jewelry"
              className="font-figtree inline-block px-8 md:px-10 py-3.5 md:py-4 bg-primary text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>

      {/* ── Continue Shopping Banner ── */}
      <div className="bg-white rounded-[2rem] md:rounded-[4px] p-8 md:p-10 border border-zinc-100 relative overflow-hidden shadow-sm">
        <div className="absolute -right-20 -bottom-20 size-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="space-y-3 md:space-y-4 text-center md:text-left">
            <div className="size-12 md:size-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto md:mx-0">
              <ShoppingBag size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="font-figtree text-lg md:text-2xl font-bold text-zinc-900">
                Looking for something else?
              </h3>
              <p className="font-figtree text-sm text-zinc-500 font-normal max-w-md mt-1.5 leading-relaxed">
                Explore our latest collections and find the perfect piece to add to your exquisite collection.
              </p>
            </div>
          </div>
          <Link prefetch={false}
            href="/collections/jewelry"
            className="font-figtree px-8 md:px-10 py-4 md:py-5 bg-primary text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-[1.25rem] md:rounded-[1.5rem] hover:scale-105 transition-transform shadow-2xl shadow-primary/20 whitespace-nowrap"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
