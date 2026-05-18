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
  RefreshCcw
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returnLoading, setReturnLoading] = useState(false);

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/customer/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        } else {
          toast.error("Order not found");
        }
      } catch (err) {
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    }
    fetchOrderDetails();
  }, [id]);

  const handleReturnClick = async () => {
    if (order.fulfillmentStatus !== 'FULFILLED') {
      toast.info("Returns are only available after delivery");
      return;
    }

    try {
      setReturnLoading(true);
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
      setReturnLoading(false);
    }
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
        <Link href="/admin/orders" className="text-primary hover:underline mt-4 block font-bold uppercase tracking-widest text-xs">
          Back to all orders
        </Link>
      </div>
    );
  }

  const formatCurrency = (amount, currencyCode) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode || 'INR',
    }).format(amount);
  };

  const stages = [
    "Order Confirmed",
    "Processing",
    "Manufacturing",
    "Quality Control",
    "Certification",
    "Dispatch",
    "In Transit",
    "Delivered"
  ];

  // Map Shopify status to stage index
  let currentStageIndex = 0;
  const status = (order.fulfillmentStatus || "").toUpperCase();
  const fStatus = (order.financialStatus || "").toUpperCase();

  if (status === 'FULFILLED' || status === 'DELIVERED') {
    currentStageIndex = stages.length - 1;
  } else if (status === 'IN_PROGRESS' || status === 'IN_TRANSIT') {
    currentStageIndex = 6;
  } else if (fStatus === 'PAID') {
    currentStageIndex = 1;
  }

  // Ensure index is within bounds
  const progressPct = Math.min(100, (currentStageIndex / (stages.length - 1)) * 100);

  return (
    <div className="font-figtree space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="size-10 bg-white border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-900 hover:bg-zinc-50 transition-colors">
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

      {/* Order Status Timeline */}
      <div className="bg-white rounded-[8px] border border-zinc-100 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
              order.fulfillmentStatus === 'FULFILLED' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
            }`}>
              {order.fulfillmentStatus === 'FULFILLED' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
              {order.fulfillmentStatus === 'FULFILLED' ? "Delivered" : "In Progress"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <Truck size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Live tracking available</span>
          </div>
        </div>

        <div className="relative">
          {/* Desktop Timeline Track */}
          <div className="absolute top-5 left-[20px] right-[20px] h-1 bg-zinc-100 hidden md:block rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-[width] duration-1000 ease-out" 
              style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }} 
            />
          </div>

          {/* Mobile Timeline Track */}
          <div className="absolute left-[20px] top-5 bottom-5 w-1 bg-zinc-100 md:hidden rounded-full overflow-hidden">
            <div 
              className="w-full bg-primary transition-[height] duration-1000 ease-out" 
              style={{ height: `${(currentStageIndex / (stages.length - 1)) * 100}%` }} 
            />
          </div>
          
          <div className="flex flex-col md:flex-row relative z-10 w-full gap-4">
            {stages.map((stage, index) => {
              const isCompleted = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;
              
              return (
                <div key={stage} className={`flex flex-row md:flex-col gap-4 flex-1 items-center ${
                  index === 0 ? "md:items-start" : 
                  index === stages.length - 1 ? "md:items-end" : 
                  "md:items-center"
                }`}>
                  <div className={`size-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 shrink-0 z-20 ${
                    isCompleted ? "bg-primary border-primary text-white" : "bg-white border-zinc-100 text-zinc-300"
                  } ${isCurrent ? "scale-125 shadow-lg shadow-primary/20 ring-4 ring-primary/10" : ""}`}>
                    {isCompleted ? <CheckCircle2 size={16} /> : <div className="size-2 bg-current rounded-full" />}
                  </div>
                  <div className={`space-y-1 ${
                    index === 0 ? "md:text-left" : 
                    index === stages.length - 1 ? "md:text-right" : 
                    "md:text-center"
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isCompleted ? "text-zinc-900" : "text-zinc-400"}`}>
                      {stage}
                    </p>
                    {index === 0 && (
                      <p className="text-[12px] text-zinc-900 font-medium">
                        {new Date(order.processedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items */}
          <div className="bg-white rounded-[8px] border border-zinc-100 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-primary uppercase tracking-tight">Items in this order</h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {order.lineItems.map((item, index) => (
                <div key={index} className="p-8 flex gap-6 items-center">
                  <div className="size-24 bg-zinc-50 rounded-2xl overflow-hidden shrink-0 border border-zinc-100">
                    <Image src={item.image || "/images/product/1.jpg"} alt={item.title} width={96} height={96} className="object-cover w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-900">{item.title}</h4>
                    <p className="text-xs text-zinc-500 font-medium mt-1">Quantity: {item.quantity}</p>
                    <p className="text-lg font-bold text-primary mt-2">
                      {formatCurrency(item.price.amount, item.price.currencyCode)}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <Link href={item.handle ? `/products/${item.handle}` : "/products/all"} className="px-6 py-2 border-2 border-zinc-100 text-zinc-900 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-50 transition-colors">
                      View Product
                    </Link>
                  </div>
                </div>
              ))}
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
                    {formatCurrency(order.totalPrice.amount, order.totalPrice.currencyCode)}
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
                <span className="text-zinc-900 font-bold">{formatCurrency(order.subtotalPrice.amount, order.subtotalPrice.currencyCode)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">Shipping</span>
                <span className="text-emerald-600 font-bold">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">Estimated Tax</span>
                <span className="text-zinc-900 font-bold">{formatCurrency(order.totalTax.amount, order.totalTax.currencyCode)}</span>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                <span className="text-lg font-bold text-primary uppercase tracking-tight">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(order.totalPrice.amount, order.totalPrice.currencyCode)}
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
                  disabled={returnLoading || order.fulfillmentStatus !== 'FULFILLED'}
                  className="w-full flex items-center justify-between p-4 bg-white/5 rounded-sm hover:bg-white/10 transition-colors border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center gap-3">
                    {returnLoading ? <Loader2 className="size-5 animate-spin" /> : <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />}
                    <span className="text-base font-bold">Returns & Exchange</span>
                  </div>
                  <ChevronLeft className="rotate-180 size-6" />
                </button>
                <a href="https://wa.me/919004435760" target="_blank" className="flex items-center justify-between p-4 bg-white/5 rounded-sm hover:bg-white/10 transition-colors border border-white/5">
                  <span className="text-base font-bold">Chat with Support</span>
                  <ChevronLeft className="rotate-180 size-6" />
                </a>
                <Link href="/pages/shipping-policy" className="flex items-center justify-between p-4 bg-white/5 rounded-sm hover:bg-white/10 transition-colors border border-white/5">
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

