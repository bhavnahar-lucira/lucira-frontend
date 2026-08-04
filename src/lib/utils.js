import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { apiFetch } from "./api";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie =
    name + "=" + (JSON.stringify(value) || "") + expires + "; path=/";
}

export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const val = decodeURIComponent(c.substring(nameEQ.length, c.length));
      try {
        return JSON.parse(val);
      } catch (e) {
        return val;
      }
    }
  }
  return null;
}

export async function uploadToShopify(file, customFilename = null) {
  try {
    const finalFilename = customFilename || file.name;
    // 1. Get staged target
    const { stagedTarget } = await apiFetch("/api/shopify/upload/staged", {
      method: "POST",
      body: JSON.stringify({
        filename: finalFilename,
        mimeType: file.type,
      }),
    });

    // 2. Upload to Shopify's URL
    const formData = new FormData();
    stagedTarget.parameters.forEach((param) => {
      formData.append(param.name, param.value);
    });
    formData.append("file", file);

    const uploadRes = await fetch(stagedTarget.url, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload file to Shopify storage");
    }

    // 3. Register file in Shopify
    const result = await apiFetch("/api/shopify/upload/register", {
      method: "POST",
      body: JSON.stringify({
        resourceUrl: stagedTarget.resourceUrl,
        mimeType: file.type,
        filename: finalFilename,
      }),
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to register file in Shopify");
    }

    return result.url;
  } catch (error) {
    console.error("Upload to Shopify error:", error);
    throw error;
  }
}

export function getValidSrc(src, fallback = "/images/product/1.jpg") {
  if (typeof src === "string" && src.trim() !== "") return src;
  if (src && typeof src === "object" && src.url) return src.url;
  return fallback;
}

// Generic stand-ins that some sources hand back in place of a real product shot.
const PLACEHOLDER_IMAGE_PATHS = ["/images/product/1.jpg"];

// Order/return thumbnails must show the actual item or nothing — a generic
// placeholder reads as "this is what you bought", which is worse than no image.
// Returns null when there's nothing real to show, so callers can skip the block.
export function getOrderImage(src) {
  let url = "";
  if (typeof src === "string") url = src.trim();
  else if (src && typeof src === "object" && src.url) url = String(src.url).trim();

  if (!url) return null;
  if (PLACEHOLDER_IMAGE_PATHS.some((path) => url === path || url.endsWith(path))) return null;
  return url;
}

export function getEstimatedDispatchDate(isInStock, leadTime = 12) {
  const today = new Date();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (isInStock) {
    const dispatchDate = new Date(today);
    dispatchDate.setDate(today.getDate() + 2);
    return `Estimated dispatch by ${
      months[dispatchDate.getMonth()]
    } ${dispatchDate.getDate()}, ${dispatchDate.getFullYear()}`;
  } else {
    const totalDays = (parseInt(leadTime) || 12) + 3;
    const dispatchDate = new Date(today);
    dispatchDate.setDate(today.getDate() + totalDays);
    return `Estimated dispatch by ${
      months[dispatchDate.getMonth()]
    } ${dispatchDate.getDate()}, ${dispatchDate.getFullYear()}`;
  }
}
