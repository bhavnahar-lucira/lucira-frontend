"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function FloatingActionButton() {
  const pathname = usePathname();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [tooltipShown, setTooltipShown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isZohoActive, setIsZohoActive] = useState(false);
  
  const fabTooltipRef = useRef(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getPageContext = () => {
    const globalProduct = typeof window !== 'undefined' ? window.__LUCIRA_PRODUCT__ : null;
    const title = globalProduct?.title || (typeof document !== 'undefined' ? document.title.split('|')[0].trim() : "FAB Enquiry");
    const sku = globalProduct?.sku || "N/A";
    
    if (pathname === "/") return { type: "index", title, sku };
    if (pathname.startsWith("/collections")) return { type: "collection", title, sku };
    if (pathname.startsWith("/products")) return { type: "product", title, sku };
    if (pathname.startsWith("/blogs")) return { type: "blog", title, sku };
    if (pathname.includes("gold-rate")) return { type: "gold-rate", title, slug: pathname.split('/').pop() };
    if (pathname.includes("platinum-rate")) return { type: "platinum-rate", title, slug: pathname.split('/').pop() };
    
    return { type: "other", title, sku };
  };

  const getWhatsAppUrl = () => {
    const ctx = getPageContext();
    let message = "Hi, I want to get more information about Lucira";

    if (ctx.type === "index") {
      message = "Hi! Can you tell me more about Lucira Jewelry's collection and designs?";
    } else if (ctx.type === "collection") {
      message = `Hi, I want to get more information about this collection: ${ctx.title}`;
    } else if (ctx.type === "product") {
      message = `Hi, I want to get more information about this product: ${ctx.title}`;
    } else if (ctx.type === "blog") {
      message = pathname.split('/').length > 2 
        ? `Hi, can you tell me more about this blog: ${ctx.title}`
        : "Hi, Can you Tell me more about Lucira Blogs";
    } else if (ctx.type === "gold-rate") {
      const city = ctx.slug.replace('gold-rate-', '').replace(/-/g, ' ');
      message = `Tell me more about ${city} gold rate`;
    } else if (ctx.type === "platinum-rate") {
      const city = ctx.slug.replace('platinum-rate-', '').replace(/-/g, ' ');
      message = `Tell me more about ${city} platinum rate`;
    }

    return `https://wa.me/919004435760?text=${encodeURIComponent(message)}`;
  };

  const pushPromoClick = (creativeName) => {
    const ctx = getPageContext();
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "promoClick",
      promoClick: {
        promo_id: ctx.sku,
        promo_name: ctx.title,
        creative_name: creativeName,
        location_id: pathname
      }
    });
  };

  // ── Zoho Logic ───────────────────────────────────────────────────────────

  const checkZohoState = () => {
    const chatWrap = document.getElementById("zsiq_chat_wrap");
    const floatWindow = document.getElementById("zsiq_float_container");

    const iframeOpen = chatWrap && chatWrap.classList.contains("chat-iframe-open");
    const floatOpen = floatWindow && floatWindow.style.display !== "none" && !floatWindow.classList.contains("siqhide");

    const isActive = !!(iframeOpen || floatOpen);
    setIsZohoActive(isActive);
    return isActive;
  };

  useEffect(() => {
    // 1. Tooltip Logic
    const timer = setTimeout(() => {
      setTooltipShown(true);
    }, 5000);

    // 2. Observer for Zoho Unread Indicator
    const watchZsiqIndicator = () => {
      const zsiqEl = document.getElementById('zsiq-indicator');
      if (!zsiqEl) return false;

      const updateBadge = () => {
        const count = parseInt(zsiqEl.textContent.trim()) || 0;
        setUnreadCount(count);
      };

      updateBadge();
      const observer = new MutationObserver(updateBadge);
      observer.observe(zsiqEl, { childList: true, characterData: true, subtree: true });
      return observer;
    };

    // 3. Observer for Zoho UI State
    const observeZoho = () => {
      const chatWrap = document.getElementById("zsiq_chat_wrap");
      if (!chatWrap) return;

      checkZohoState();

      const observer1 = new MutationObserver(checkZohoState);
      observer1.observe(chatWrap, { attributes: true, attributeFilter: ["class"] });

      const floatWatcher = new MutationObserver(() => {
        const floatWindow = document.getElementById("zsiq_float_container");
        if (floatWindow) {
          const observer2 = new MutationObserver(checkZohoState);
          observer2.observe(floatWindow, { attributes: true, attributeFilter: ["class", "style"] });
          floatWatcher.disconnect();
        }
      });

      floatWatcher.observe(document.body, { childList: true, subtree: true });
    };

    let indicatorObserver;
    const zohoLoader = new MutationObserver((_, obs) => {
      if (document.getElementById("zsiq_chat_wrap")) {
        observeZoho();
      }
      if (document.getElementById('zsiq-indicator')) {
        indicatorObserver = watchZsiqIndicator();
      }
      if (document.getElementById("zsiq_chat_wrap") && document.getElementById('zsiq-indicator')) {
        obs.disconnect();
      }
    });

    zohoLoader.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      zohoLoader.disconnect();
      if (indicatorObserver) indicatorObserver.disconnect();
    };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleFabClick = () => {
    if (isZohoActive && window.$zoho && window.$zoho.salesiq) {
      window.$zoho.salesiq.floatwindow.visible("hide");
      setIsFabOpen(false);
      setIsZohoActive(false);
      return;
    }

    const nextState = !isFabOpen;
    setIsFabOpen(nextState);
    setTooltipShown(false);

    pushPromoClick("salesiq");
  };

  const handleChatClick = (e) => {
    e.preventDefault();
    if (window.$zoho && window.$zoho.salesiq) {
      window.$zoho.salesiq.floatwindow.visible("show");
    }
    setIsFabOpen(false);
    setIsZohoActive(true);
    pushPromoClick("salesiq-liveChat");
  };

  const handlePhoneClick = () => {
    pushPromoClick("salesiq-callUs");
  };

  const handleWhatsAppClick = () => {
    pushPromoClick("chatWithExperts");
  };

  const isProductPage = pathname.startsWith('/products');
  const isCollectionPage = pathname.startsWith('/collections');

  return (
    <div className={`fixed 
      ${isProductPage ? 'bottom-22 md:bottom-22' : isCollectionPage ? 'bottom-16 md:bottom-10' : 'bottom-10'} 
      ${isCollectionPage ? 'right-[20px] md:right-[30px]' : 'right-[30px]'} 
      z-[499] flex flex-col items-center`}>
      {/* Tooltip */}
      {!isFabOpen && !isZohoActive && tooltipShown && (
        <div className="absolute right-5 bottom-16 bg-white text-black text-xs py-1.5 px-3 rounded-md whitespace-nowrap shadow-md border border-[#b76f79] animate-fab-tooltip pointer-events-none z-[1]
          after:content-[''] after:absolute after:right-[10px] after:bottom-[-6px] after:w-3 after:height-3 after:bg-white after:rotate-45 after:shadow-[1px_1px_0_rgba(183,111,121,1)] after:z-[1]">
          At your Service
        </div>
      )}

      {/* Actions Menu */}
      <div className={`flex flex-col items-center absolute bottom-[50px] right-0 transition-all duration-300 ${isFabOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* WhatsApp (Inside menu for mobile product pages) */}
        {isProductPage && (
          <a 
            href={getWhatsAppUrl()} 
            onClick={handleWhatsAppClick}
            target="_blank"
            rel="noopener noreferrer"
            className={`md:hidden w-[50px] h-[50px] rounded-full mb-2.5 flex items-center justify-center bg-[#32d950] text-white shadow-lg transition-all duration-350 hover:scale-110 ${isFabOpen ? 'translate-y-0 opacity-100 delay-[100ms]' : 'translate-y-[180px] opacity-0'}`}
            title="WhatsApp"
          >
            <img src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/whatsapp_3_1.png?v=1772105856" width={20} height={20} alt="WhatsApp" />
          </a>
        )}

        {/* Chat */}
        <Link 
          href="#" 
          onClick={handleChatClick}
          className={`w-[50px] h-[50px] rounded-full mb-2.5 flex items-center justify-center bg-[#0066cc] text-white shadow-lg transition-all duration-350 hover:scale-110 ${isFabOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120px] opacity-0'}`}
          title="Live Chat"
        >
          <img src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/chat_1.png?v=1772104883" width="20" height="20" alt="Chat" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -left-1 bg-[#ff0600] text-white text-[10px] font-medium min-w-[20px] h-5 rounded-full flex items-center justify-center leading-none">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Phone */}
        <a 
          href="tel:+918976773659" 
          onClick={handlePhoneClick}
          className={`w-[50px] h-[50px] rounded-full mb-2.5 flex items-center justify-center bg-[#DA3779] text-white shadow-lg transition-all duration-350 hover:scale-110 ${isFabOpen ? 'translate-y-0 opacity-100 delay-[50ms]' : 'translate-y-[60px] opacity-0'}`}
          title="Call"
        >
          <img src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/phone-call_1.png?v=1772105479" width="20" height="20" alt="Call" />
        </a>

      </div>

      {/* WhatsApp (Outside menu - persistent unless mobile product page) */}
      <a 
        href={getWhatsAppUrl()} 
        onClick={handleWhatsAppClick}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-[50px] h-[50px] rounded-full mb-2.5 flex items-center justify-center bg-[#29a319] text-white shadow-lg transition-all duration-350 hover:scale-110 z-[3] ${isProductPage ? 'hidden md:flex' : 'flex'} ${isFabOpen ? '-translate-y-[120px]' : 'translate-y-0'}`}
        title="WhatsApp"
      >
        <img src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/whatsapp_3_1.png?v=1772105856" width={20} height={20} alt="WhatsApp" />
      </a>

      {/* Main FAB Toggle */}
      <div 
        className={`w-[50px] h-[50px] bg-[#b76f79] text-white rounded-full flex items-center justify-center cursor-pointer shadow-xl relative z-[4] transition-all duration-300 hover:scale-[1.08] ${isFabOpen || isZohoActive ? 'bg-[#B77767]' : ''}`}
        onClick={handleFabClick}
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          {/* Default Icon */}
          <svg className={`absolute transition-all duration-350 ${isFabOpen || isZohoActive ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} width="25" height="25" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id="mask0_fab_main" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
              <rect width="32" height="32" fill="#D9D9D9"/>
            </mask>
            <g mask="url(#mask0_fab_main)">
              <path d="M7.07708 26.0002C6.40353 26.0002 5.83341 25.7668 5.36675 25.3002C4.90008 24.8335 4.66675 24.2634 4.66675 23.5898V14.6668C4.66675 13.1079 4.96419 11.6413 5.55908 10.2668C6.15397 8.89238 6.96597 7.69072 7.99508 6.66183C9.02397 5.63272 10.2256 4.82072 11.6001 4.22583C12.9745 3.63094 14.4412 3.3335 16.0001 3.3335C17.559 3.3335 19.0256 3.63094 20.4001 4.22583C21.7745 4.82072 22.9762 5.63272 24.0051 6.66183C25.0342 7.69072 25.8462 8.89238 26.4411 10.2668C27.036 11.6413 27.3334 13.1079 27.3334 14.6668V27.1795C27.3334 27.8531 27.1001 28.4232 26.6334 28.8898C26.1667 29.3565 25.5966 29.5898 24.9231 29.5898H17.0001C16.7163 29.5898 16.4787 29.4941 16.2874 29.3025C16.0959 29.1112 16.0001 28.8736 16.0001 28.5898C16.0001 28.3061 16.0959 28.0685 16.2874 27.8772C16.4787 27.6856 16.7163 27.5898 17.0001 27.5898H24.9231C25.0429 27.5898 25.1412 27.5514 25.2181 27.4745C25.295 27.3976 25.3334 27.2993 25.3334 27.1795V26.0002H23.0257C22.3609 26.0002 21.793 25.7647 21.3221 25.2938C20.851 24.8227 20.6154 24.2547 20.6154 23.5898V18.9745C20.6154 18.3096 20.851 17.7417 21.3221 17.2708C21.793 16.7997 22.3609 16.5642 23.0257 16.5642H25.3334V14.6668C25.3334 12.0891 24.4223 9.88905 22.6001 8.06683C20.7779 6.24461 18.5779 5.3335 16.0001 5.3335C13.4223 5.3335 11.2223 6.24461 9.40008 8.06683C7.57786 9.88905 6.66675 12.0891 6.66675 14.6668V16.5642H8.97441C9.6393 16.5642 10.2072 16.7997 10.6781 17.2708C11.1492 17.7417 11.3847 18.3096 11.3847 18.9745V23.5898C11.3847 24.2547 11.1492 24.8227 10.6781 25.2938C10.2072 25.7647 9.6393 26.0002 8.97441 26.0002H7.07708ZM7.07708 24.0002H8.97441C9.09397 24.0002 9.1923 23.9617 9.26941 23.8848C9.3463 23.8079 9.38475 23.7096 9.38475 23.5898V18.9745C9.38475 18.8549 9.3463 18.7566 9.26941 18.6795C9.1923 18.6026 9.09397 18.5642 8.97441 18.5642H6.66675V23.5898C6.66675 23.7096 6.70519 23.8079 6.78208 23.8848C6.85897 23.9617 6.9573 24.0002 7.07708 24.0002ZM23.0257 24.0002H25.3334V18.5642H23.0257C22.9062 18.5642 22.8079 18.6026 22.7307 18.6795C22.6539 18.7566 22.6154 18.8549 22.6154 18.9745V23.5898C22.6154 23.7096 22.6539 23.8079 22.7307 23.8848C22.8079 23.9617 22.9062 24.0002 23.0257 24.0002ZM23.0257 18.5642H22.6154H25.3334H23.0257Z" fill="#fff"/>
            </g>
          </svg>

          {/* Close Icon */}
          <svg className={`absolute transition-all duration-350 ${isFabOpen || isZohoActive ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Main Badge */}
        {unreadCount > 0 && !isFabOpen && !isZohoActive && (
          <span className="absolute -top-1 -left-1 bg-[#ff0600] text-white text-[10px] font-medium min-w-[20px] h-5 rounded-full flex items-center justify-center leading-none">
            {unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}
