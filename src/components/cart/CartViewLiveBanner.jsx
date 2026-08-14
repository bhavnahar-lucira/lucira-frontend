"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { pushPromoClick } from "@/lib/gtm";
import { Video, X } from "lucide-react";
import shopifyLoader from "@/utils/shopifyLoader";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";

// Builds the WhatsApp "schedule video call" link, listing every product picked.
function buildVideoCallUrl(selectedItems) {
  let message = "Hi, I'm on the cart page and want to schedule a video call";
  if (selectedItems.length === 1) {
    message += ` for : ${selectedItems[0].title}`;
  } else if (selectedItems.length > 1) {
    const list = selectedItems.map((item) => `- ${item.title}`).join("\n");
    message += ` for these products:\n${list}`;
  }
  return `https://api.whatsapp.com/send/?phone=919004435760&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
}

const itemKey = (item) => item.id || item.variantId;

export default function CartViewLiveBanner({ items }) {
  const [open, setOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const handleContinue = (selectedItems) => {
    if (selectedItems.length === 0) return;
    try {
      pushPromoClick({
        creative_name: "view_live_cta_checkout",
        location_id: "checkout page",
        promo_id: selectedItems.map((item) => item.title || item.sku).join(", "),
        promo_name: "View Live",
      });
    } catch (e) {
      console.error("promoClick push failed", e);
    }
    const url = buildVideoCallUrl(selectedItems);
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  // Only show items that are in stock and not free gifts
  // Some items might not have isAvailable explicitly set to false if they are in the cart, but usually free gifts have `isFreeGift`
  const validItems = items.filter(
    (item) => !item.isFreeGift && item.inStock !== false
  );

  // Start unchecked; shopper must actively select what they want to see live.
  useEffect(() => {
    if (open) setSelectedKeys(new Set());
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (validItems.length === 0) {
    return null; // Don't render banner if no valid items
  }

  const selectedItems = validItems.filter((item) => selectedKeys.has(itemKey(item)));

  const toggleSelected = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Handle a single valid item (just open whatsapp directly instead of drawer)
  const handleBannerClick = (e) => {
    if (validItems.length === 1) {
      e.preventDefault();
      handleContinue(validItems);
    } else {
      setOpen(true);
    }
  };

  const continueLabel =
    selectedItems.length === 0
      ? "Select a Product"
      : "Continue with Live View";

  return (
    <Drawer open={open} onOpenChange={setOpen} direction={isDesktop ? "right" : "bottom"}>
      <DrawerTrigger asChild>
        <button
          onClick={handleBannerClick}
          className="flex w-full items-center gap-2.5 lg:gap-3 p-2 lg:p-2 transition-opacity hover:opacity-95 rounded-[6px] mb-[20px] cursor-pointer"
          style={{ background: "linear-gradient(89.31deg, #FEF5F1 0%, #F1E4D1 100%)" }}
        >
          <span className="relative h-10 w-10 lg:h-12 lg:w-12 shrink-0 overflow-hidden rounded-full bg-white border border-black/5">
            <Image
              src="/images/explore/VirtualTryOn.jpg"
              alt="Lucira consultant"
              fill
              sizes="40px"
              className="object-cover"
            />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="font-figtree font-medium text-[0.75rem] lg:text-[1rem] leading-[1.3] text-black lg:text-[#3D2B28] mb-[1px] lg:mb-[2px] truncate">
              Shop with Complete Confidence
            </p>
            <p className="font-figtree font-normal text-[0.75rem] lg:text-[0.85rem] lg:mt-1 leading-[1.3] text-[#000000] truncate">
              See every detail before you buy.
            </p>
          </div>
          <span className="flex shrink-0 items-center justify-center gap-1.5 lg:gap-2 rounded-[4px] bg-[#5A413F] h-9 lg:h-11 px-4 lg:px-5 font-figtree font-medium text-[0.75rem] lg:text-[0.85rem] leading-none tracking-[0px] align-middle uppercase text-white transition-transform active:scale-95">
            <Video size={14} className="lg:hidden" />
            <Video size={16} className="hidden lg:block" />
            View Live
          </span>
        </button>
      </DrawerTrigger>

      <DrawerContent className="lg:w-[440px] lg:min-w-[440px] lg:!rounded-none">
        <div className="mx-auto flex max-h-[80vh] w-full max-w-lg flex-1 flex-col lg:h-full lg:max-h-none lg:max-w-none">
          <DrawerHeader className="relative shrink-0 pb-4 border-b border-zinc-100 text-left">
            <DrawerTitle className="text-left font-figtree text-lg font-bold tracking-tight text-zinc-900">
              Select Products to View Live
            </DrawerTitle>
            <p className="text-left font-figtree text-xs text-zinc-500 mt-1">
              We&apos;ll connect you live for the pieces you choose
            </p>
            <DrawerClose asChild>
              <button className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700">
                <X size={18} />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="min-h-0 flex-1 grid grid-cols-2 gap-3 overflow-y-auto p-4 lg:p-5">
            {validItems.map((item) => {
              const displayImage = item.properties?._display_image || item.image;
              const isShopifyImage = displayImage?.includes("cdn.shopify.com");
              const key = itemKey(item);
              const isSelected = selectedKeys.has(key);

              return (
                <div
                  key={key}
                  onClick={() => toggleSelected(key)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && toggleSelected(key)}
                  className={`relative flex flex-col w-full items-start justify-start gap-3 rounded-[4px] border p-3 text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-accent bg-accent/[0.06]"
                      : "border-zinc-100 bg-white hover:border-zinc-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelected(key)}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-[14px] top-[14px] z-10 size-4 shrink-0 rounded-sm accent-primary shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
                  />
                  <div className="relative w-full h-auto aspect-square shrink-0 overflow-hidden rounded-[4px] border border-zinc-100 bg-[#F9F9F9]">
                    <Image
                      loader={isShopifyImage ? shopifyLoader : undefined}
                      src={displayImage || "/images/product/1.jpg"}
                      alt={item.title}
                      fill
                      className="object-contain p-1 mix-blend-multiply"
                    />
                  </div>
                  <div className="flex-1 w-full min-w-0">
                    <h3 className="truncate font-figtree text-[0.75rem] font-semibold text-zinc-900 leading-tight">
                      {item.title}
                    </h3>
                    <p className="truncate font-figtree text-xs text-zinc-500 font-medium uppercase tracking-tight mt-1">
                      SKU: {item.sku || "N/A"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="shrink-0 border-t border-zinc-100 p-4 lg:p-5 pb-[35px] lg:pb-[35px]">
            <button
              onClick={() => handleContinue(selectedItems)}
              disabled={selectedItems.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#5A413F] px-4 h-12 font-figtree font-medium uppercase tracking-wider text-[0.8125rem] text-white transition-opacity disabled:opacity-40"
            >
              <Video size={15} className="shrink-0" />
              <span className="truncate">{continueLabel}</span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
