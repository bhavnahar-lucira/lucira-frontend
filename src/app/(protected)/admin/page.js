"use client";

import {
  ShoppingBag,
  Heart,
  Star,
  Clock,
  ArrowRight,
  ChevronRight,
  Gift,
  Copy,
  CheckCircle2,
  Info,
} from "lucide-react";
import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectUser } from "@/redux/features/user/userSlice";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchCustomerDashboardStats, fetchCustomerOrders, fetchRewardCoupon } from "@/lib/api";
import { shopifyStorefrontFetch, CUSTOMER_ORDERS_QUERY } from "@/lib/shopify-client";
import { getOrderImage } from "@/lib/utils";
import { COUPONS, COUPON_DISCLAIMER } from "@/lib/coupons";

export default function CustomerDashboard() {
  const { user, accessToken } = useSelector((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    points: "0",
    tier: "Member",
    nextTierPoints: "0",
    progress: 0,
    wishlistCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [rewardCoupon, setRewardCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showRewardInfo, setShowRewardInfo] = useState(false);

  useEffect(() => {
    if (!user?.id && !user?.email && !user?.mobile) return;

    async function fetchReward() {
      try {
        const [rewardData, dynamicCouponsData] = await Promise.all([
          fetchRewardCoupon({
            customerId: user?.id,
            email: user?.email,
            mobile: user?.mobile,
          }),
          apiFetch("/api/cart/coupons/active", { suppressErrorLog: true }).catch(() => null)
        ]);

        if (rewardData?.hasCoupon && rewardData?.code) {
          const dynamicCoupons = dynamicCouponsData?.coupons || [];
          const allCoupons = [...dynamicCoupons, ...COUPONS];
          const coupon = allCoupons.find((c) => c.code === rewardData.code);
          if (coupon) {
            setRewardCoupon(coupon);
          } else {
            // Fallback if coupon is missing from both lists
            setRewardCoupon({
              code: rewardData.code,
              title: "Exclusive Discount",
              condition: "Applicable on your purchase",
            });
          }
        }
      } catch (err) {
        console.warn("[CustomerDashboard] Reward coupon fetch failed:", err);
      }
    }
    fetchReward();
  }, [user?.id, user?.email, user?.mobile]);

  const handleCopyRewardCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    if (!showRewardInfo) return;
    const closeOnOutsideClick = () => setShowRewardInfo(false);
    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, [showRewardInfo]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch stats from backend (Authenticated)
        try {
          const statsData = await fetchCustomerDashboardStats(accessToken);
          if (statsData) setStats(statsData);
        } catch (e) {
          console.warn("[CustomerDashboard] Stats fetch failed:", e);
        }

        // Fetch recent orders - Hybrid Strategy
        let storefrontOrders = [];
        try {
          // Use authenticated helper
          const ordersData = await fetchCustomerOrders(accessToken);
          if (ordersData && ordersData.orders) {
            // Backend orders pass through as-is apart from the thumbnail, which can
            // come back as a generic placeholder — drop it so no image renders.
            storefrontOrders = ordersData.orders.slice(0, 5).map((order) => ({
              ...order,
              image: getOrderImage(order?.image),
            }));
          } else {
            throw new Error("Empty backend orders");
          }
        } catch (err) {
          console.warn("[CustomerDashboard] Backend orders fetch failed, falling back to Storefront API:", err);
          
          if (accessToken && !accessToken.startsWith("simulated_")) {
            const data = await shopifyStorefrontFetch(CUSTOMER_ORDERS_QUERY, {
              customerAccessToken: accessToken,
              first: 5
            });

            storefrontOrders = data?.customer?.orders?.edges?.map(({ node }) => {
              if (!node) return null;
              const mainItem = node.lineItems?.edges?.[0]?.node;
              return {
                id: node.id,
                orderNumber: node.orderNumber ? node.orderNumber.toString() : "N/A",
                date: node.processedAt ? new Date(node.processedAt).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'long', day: 'numeric'
                }) : "Date Unknown",
                status: node.fulfillmentStatus === 'FULFILLED' ? 'Delivered' : 
                        node.fulfillmentStatus === 'PARTIAL' ? 'In Transit' : 'Processing',
                amount: node.totalPrice ? new Intl.NumberFormat('en-IN', {
                  style: 'currency', currency: node.totalPrice.currencyCode || 'INR',
                }).format(node.totalPrice.amount) : "0.00",
                product: mainItem?.title || "Jewelry Item",
                image: getOrderImage(mainItem?.variant?.image?.url)
              };
            }).filter(Boolean) || [];
          }
        }
        
        setOrders(storefrontOrders);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const fName = user?.firstName || user?.first_name || "";
  const lName = user?.lastName || user?.last_name || "";
  const displayName = (user ? `${fName} ${lName}`.trim() : "") || user?.name || "";

  const customerStats = [
    {
      title: "Orders Placed",
      value: loading ? "..." : String(orders?.length ?? 0),
      subtitle: "Total history",
      icon: ShoppingBag,
      color: "from-primary to-primary/80",
      shadow: "shadow-primary/20",
      link: "/admin/orders"
    },
    {
      title: "Wishlist Items",
      value: loading ? "..." : String(stats?.wishlistCount ?? 0),
      subtitle: "Saved for later",
      icon: Heart,
      color: "from-primary to-primary/80",
      shadow: "shadow-primary/20",
      link: "/admin/wishlist"
    },
    {
      title: "Loyalty Points",
      value: loading ? "..." : stats.points,
      subtitle: stats.tier,
      icon: Star,
      color: "from-primary to-primary/80",
      shadow: "shadow-primary/20",
      link: "/pages/rewards"
    },
    {
      title: "Active Returns",
      value: "00",
      subtitle: "In progress",
      icon: Clock,
      color: "from-primary to-primary/80",
      shadow: "shadow-primary/20",
      link: "/admin/orders"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 [&_a]:outline-none [&_a:focus]:outline-none [&_a:focus-visible]:outline-none">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-primary tracking-tight mb-1">
            {displayName ? `Hello, ${displayName}` : "Account Overview"}
          </h2>
          <p className="text-zinc-500 font-medium text-sm md:text-base">
            Manage your orders, track deliveries, and view your rewards.
          </p>
        </div>
      </div>

      {/* Welcome Reward Coupon */}
      {rewardCoupon && (
        <div className="relative rounded-2xl shadow-lg shadow-primary/20">
          {/* Gradient + dot texture live in their own clipped layer so the tooltip
              below (a sibling, not clipped) isn't cut off by overflow-hidden. */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#4A3230] via-primary to-[#7C5A45]">
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "14px 14px" }}
            />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4">
            <div className="hidden sm:flex shrink-0 size-10 rounded-full bg-white/15 items-center justify-center ring-1 ring-white/20">
              <Gift className="size-5 text-white" strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Gift className="size-4 text-white sm:hidden" strokeWidth={2} />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Your Welcome Reward</h3>
                <span className="text-[11px] font-semibold text-white/80">{rewardCoupon.title}</span>

                <div className="relative group/info" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setShowRewardInfo((v) => !v)}
                    className="flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                    aria-label="Coupon terms"
                  >
                    <Info className="size-3.5" strokeWidth={2.5} />
                  </button>
                  <div
                    className={`absolute z-30 top-full left-0 mt-2 w-64 rounded-lg bg-white text-zinc-700 text-[11px] font-medium leading-relaxed p-3 shadow-xl transition-opacity ${
                      showRewardInfo ? "opacity-100" : "opacity-0 pointer-events-none"
                    } group-hover/info:opacity-100 group-hover/info:pointer-events-auto`}
                  >
                    {rewardCoupon.condition}. {COUPON_DISCLAIMER}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleCopyRewardCode(rewardCoupon.code)}
              className="shrink-0 flex items-center justify-between sm:justify-start gap-3 h-10 pl-4 pr-2 rounded-xl bg-white/95 hover:bg-white transition-colors font-bold text-[13px] tracking-[0.15em] text-primary cursor-pointer"
            >
              {rewardCoupon.code}
              <span className="flex items-center justify-center size-6 rounded-lg bg-primary/10">
                {copiedCode === rewardCoupon.code ? (
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5 text-primary" />
                )}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {customerStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link prefetch={false}
              key={index}
              href={stat.link}
              className="bg-white rounded-3xl p-4 border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-6 gap-2">
                <div className={`size-6 md:size-12 rounded-2xl bg-gradient-to-br ${stat.color} ${stat.shadow} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="size-4 md:size-[22px]" strokeWidth={2.5} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stat.title}</p>
                  <h3 className="text-xl md:text-2xl font-bold text-primary">{stat.value}</h3>
                </div>
              </div>
              <p className="text-sm sm:text-base font-bold text-primary flex items-center gap-1 cursor-pointer hover:underline">
                {stat.subtitle} <ChevronRight size={14} />
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1">
        {/* Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-primary uppercase tracking-tight">Recent Orders</h3>
            <Link prefetch={false}
              href="/admin/orders"
              className="text-xs font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              View all orders <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10 text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading orders...</div>
            ) : orders.length > 0 ? (
              orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-center"
                >
                  {order.image && (
                    <div className="size-20 bg-zinc-50 rounded-2xl overflow-hidden shrink-0 border border-zinc-100">
                      <Image loader={shopifyLoader}
                        src={order.image}
                        alt={order.product}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-2 mb-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/5 rounded-full">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`w-fit mx-auto md:mx-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === "Delivered"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-zinc-900">{order.product}</h4>
                    <p className="text-xs text-zinc-500 font-bold">{order.date}</p>
                  </div>
                  <div className="text-right flex flex-col items-center md:items-end gap-3">
                    <p className="text-lg font-bold text-primary">{order.amount}</p>
                    <Link prefetch={false}
                      href={`/admin/orders/${order.id.split("/").pop()}`}
                      className="px-5 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.15em] rounded-xl hover:opacity-90 transition-colors shadow-lg shadow-primary/10"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl border border-zinc-100 p-10 text-center shadow-sm">
                <ShoppingBag size={40} className="mx-auto mb-4 text-zinc-200" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">No orders found yet</p>
                <Link prefetch={false}
                  href="/collections/jewelry"
                  className="text-primary text-xs font-bold uppercase tracking-widest mt-2 block hover:underline"
                >
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
