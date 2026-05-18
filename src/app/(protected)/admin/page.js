"use client";

import { 
  ShoppingBag, 
  Heart, 
  Star, 
  Clock, 
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectUser } from "@/redux/features/user/userSlice";
import { useEffect, useState } from "react";

export default function CustomerDashboard() {
  const user = useSelector(selectUser);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    points: "0",
    tier: "Member",
    nextTierPoints: "0",
    progress: 0,
    wishlistCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, statsRes] = await Promise.all([
          fetch("/api/customer/orders"),
          fetch("/api/customer/dashboard-stats")
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders || []);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const fName = user?.first_name || user?.firstName || "";
  const lName = user?.last_name || user?.lastName || "";
  const displayName = (user ? `${fName} ${lName}`.trim() : "") || user?.name || "";

  const customerStats = [
    {
      title: "Orders Placed",
      value: loading ? "..." : orders.length.toString(),
      subtitle: "Total history",
      icon: ShoppingBag,
      color: "from-primary to-primary/80",
      shadow: "shadow-primary/20",
      link: "/admin/orders"
    },
    {
      title: "Wishlist Items",
      value: loading ? "..." : stats.wishlistCount.toString(),
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {customerStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
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
            <Link
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
                  <div className="size-20 bg-zinc-50 rounded-2xl overflow-hidden shrink-0 border border-zinc-100">
                    <Image
                      src={order.image}
                      alt={order.product}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
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
                    <Link
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
                <Link
                  href="/collections/all"
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
