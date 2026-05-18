"use client";

import { useEffect } from "react";

const PINCODE_COOKIE = "user_pincode";
const FBC_COOKIE = "_fbc";
const PINCODE_MAX_AGE = 60 * 60 * 24 * 30;
const FBC_MAX_AGE = 60 * 60 * 24 * 90;

function getCookie(name) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return value ? decodeURIComponent(value.split("=").slice(1).join("=")) : "";
}

function setCookie(name, value, maxAge) {
  if (!value) return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function storeFacebookClickId() {
  if (getCookie(FBC_COOKIE)) return;

  const params = new URLSearchParams(window.location.search);
  const fbc = params.get(FBC_COOKIE);
  const fbclid = params.get("fbclid");

  if (fbc) {
    setCookie(FBC_COOKIE, fbc, FBC_MAX_AGE);
    return;
  }

  if (fbclid) {
    setCookie(FBC_COOKIE, `fb.1.${Date.now()}.${fbclid}`, FBC_MAX_AGE);
  }
}

async function fetchPincodeFromCoordinates(latitude, longitude) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18",
    addressdetails: "1",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
  if (!response.ok) return "";

  const data = await response.json();
  return String(data?.address?.postcode || "").match(/\b\d{6}\b/)?.[0] || "";
}

function requestAndStorePincode() {
  if (getCookie(PINCODE_COOKIE) || !navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const pincode = await fetchPincodeFromCoordinates(coords.latitude, coords.longitude);
        if (pincode) {
          setCookie(PINCODE_COOKIE, pincode, PINCODE_MAX_AGE);
          window.dispatchEvent(new CustomEvent("lucira:user-pincode", { detail: { pincode } }));
        }
      } catch (error) {
        console.error("Unable to fetch pincode from location:", error);
      }
    },
    () => {},
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60 * 60 * 1000,
    }
  );
}

export default function VisitorTracking() {
  useEffect(() => {
    storeFacebookClickId();
    requestAndStorePincode();
  }, []);

  return null;
}
