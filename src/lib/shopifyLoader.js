/**
 * Custom loader for Shopify images to use their CDN for resizing.
 * This bypasses Vercel's image optimization and uses Shopify's instead (which is free).
 */
export default function shopifyLoader({ src, width, quality }) {
  // If not a shopify image, return as is
  if (!src.includes('cdn.shopify.com') && !src.includes('myshopify.com')) {
    return src;
  }

  const url = new URL(src);
  
  // Shopify CDN supports width and quality parameters
  // quality is 1-100, Next.js default is 75
  url.searchParams.set('width', width.toString());
  if (quality) {
    url.searchParams.set('quality', quality.toString());
  }
  
  // Ensure we get a good format
  url.searchParams.set('format', 'webp');

  return url.toString();
}
