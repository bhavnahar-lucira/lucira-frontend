// next/image custom loader that resizes via Shopify's own CDN (`?width=`)
// instead of routing the image through Vercel's /_next/image proxy.
//
// Only Shopify CDN hosts understand the `width`/`quality` query params, so any
// other src (local `/images/...` assets, data: URIs, third-party hosts, or the
// local fallback strings that helpers like getValidSrc can return) is passed
// through untouched. That makes the loader safe to attach to an <Image> whose
// src is dynamic and only *usually* a Shopify URL.
const SHOPIFY_HOST = /^https?:\/\/(cdn\.shopify\.com|[^/]+\.myshopify\.com)\//i;

export default function shopifyLoader({ src, width, quality }) {
  if (typeof src !== 'string' || !SHOPIFY_HOST.test(src)) {
    return src;
  }
  const url = new URL(src);
  url.searchParams.set('width', width.toString());
  if (quality) {
    url.searchParams.set('quality', quality.toString());
  }
  return url.toString();
}
