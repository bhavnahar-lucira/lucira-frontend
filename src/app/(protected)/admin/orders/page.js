"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBag, ChevronRight, Package, Truck,
  CheckCircle2, Clock, Loader2, ChevronDown, RefreshCcw
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [returnLoading, setReturnLoading] = useState(null); // Track which order is loading return

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await fetch("/api/customer/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
          setFilteredOrders(data.orders || []);
        }
      } catch (err) {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleReturnClick = async (e, order) => {
    e.preventDefault();
    if (order.status !== 'Delivered') {
      toast.info("Returns are only available after delivery");
      return;
    }

    try {
      setReturnLoading(order.id);
      const res = await fetch('/api/customer/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          customerEmail: order.customerEmail,
        }),
      });
      const data = await res.json();
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
      <div className="space-y-4 md:space-y-6">
        {filteredOrders.map((order) => {
          const isDelivered = order.status === "Delivered";
          const isInTransit = order.status === "In Transit";

          return (
            <div
              key={order.id}
              className="bg-white rounded-[1.75rem] md:rounded-[2rem] border border-zinc-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="p-5 md:p-8 flex flex-col md:flex-row gap-5 md:gap-8 items-center">

                {/* Product image */}
                <div className="size-24 md:size-32 bg-zinc-50 rounded-2xl md:rounded-3xl overflow-hidden shrink-0 border border-zinc-100 relative group">
                  <Image
                    src={order.image}
                    alt={order.product}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Order info */}
                <div className="flex-1 space-y-3 md:space-y-4 w-full text-center md:text-left">

                  {/* Order # + Status badges */}
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3">
                    <span className="font-figtree text-xs font-semibold text-primary uppercase tracking-[0.13em] px-3 py-1 bg-primary/5 rounded-full">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`font-figtree px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] flex items-center gap-1.5 ${
                        isDelivered
                          ? "text-emerald-600 bg-emerald-50"
                          : isInTransit
                          ? "text-blue-600 bg-blue-50"
                          : "text-orange-600 bg-orange-50"
                      }`}
                    >
                      {isDelivered ? (
                        <CheckCircle2 size={11} />
                      ) : isInTransit ? (
                        <Truck size={11} />
                      ) : (
                        <Clock size={11} />
                      )}
                      {order.status}
                    </span>
                  </div>

                  {/* Product name + date */}
                  <div>
                    <h4 className="font-figtree text-base md:text-xl font-bold text-zinc-900 leading-tight">
                      {order.product}
                    </h4>
                    <p className="font-figtree text-xs md:text-sm text-zinc-500 font-medium mt-1">
                      Ordered on {order.date}
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="font-figtree text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">
                      Price Paid
                    </p>
                    <p className="font-figtree text-lg md:text-xl font-bold text-primary">
                      {order.amount}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                  <button
                    onClick={(e) => handleReturnClick(e, order)}
                    disabled={returnLoading === order.id || order.status !== "Delivered"}
                    className="font-figtree w-full md:px-8 py-3 md:py-3.5 border-2 border-primary text-primary text-xs text-center font-bold uppercase tracking-[0.15em] rounded-2xl hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {returnLoading === order.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCcw size={14} />
                    )}
                    Return / Exchange
                  </button>
                  <Link
                    href={`/admin/orders/${order.id.split("/").pop()}`}
                    className="font-figtree w-full md:px-8 py-3 md:py-3.5 bg-primary text-white text-xs text-center font-semibold uppercase tracking-[0.15em] rounded-2xl hover:opacity-90 transition-colors shadow-lg shadow-primary/20"
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
            <Link
              href="/collections/all"
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
          <Link
            href="/collections/all"
            className="font-figtree px-8 md:px-10 py-4 md:py-5 bg-primary text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-[1.25rem] md:rounded-[1.5rem] hover:scale-105 transition-transform shadow-2xl shadow-primary/20 whitespace-nowrap"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}