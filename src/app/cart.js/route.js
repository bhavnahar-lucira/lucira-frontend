import { NextResponse } from 'next/server';

export const runtime = 'edge';

const MOCK_CART = {
  token: "headless-cart-sync-active",
  note: null,
  attributes: {},
  original_total_price: 0,
  total_price: 0,
  total_discount: 0,
  total_weight: 0,
  item_count: 0,
  items: [],
  requires_shipping: false,
  currency: "INR",
  items_subtotal_price: 0,
  cart_level_discount_applications: []
};

// Aggressive caching for the Edge CDN to prevent repeated invocations
const CACHE_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  // Cache for 1 hour, serve stale up to 24h
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  // Explicitly tell Vercel to cache even if cookies are present
  'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
  'CDN-Cache-Control': 'public, s-maxage=3600',
};

/**
 * Mock Shopify Cart AJAX API
 * Trackers like WebEngage often POST to /cart.js to sync session data.
 */
export async function GET() {
  return NextResponse.json(MOCK_CART, {
    headers: CACHE_HEADERS
  });
}

/**
 * Shopify's AJAX API returns the full cart object even on POST.
 * Trackers expect this to update their internal state.
 */
export async function POST() {
  return NextResponse.json(MOCK_CART, {
    headers: CACHE_HEADERS
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
