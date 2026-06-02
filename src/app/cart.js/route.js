import { NextResponse } from 'next/server';

export const runtime = 'edge';

const MOCK_CART = {
  token: "headless_cart_00000000000000000000000000000000",
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

// Aggressive caching for the Edge CDN and browser
const CACHE_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  // Cache for 1 hour in browser and CDN, serve stale up to 24h
  'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
  'CDN-Cache-Control': 'public, s-maxage=3600',
};

/**
 * Mock Shopify Cart AJAX API
 */
export async function GET() {
  const response = NextResponse.json(MOCK_CART, {
    headers: CACHE_HEADERS
  });

  // Set the standard Shopify cart cookie to stop trackers from looping
  response.cookies.set('cart', MOCK_CART.token, { 
    path: '/', 
    maxAge: 3600 * 24 * 14, // 14 days
    sameSite: 'lax',
    httpOnly: false 
  });

  return response;
}

/**
 * Handle POST by returning the same object and setting the cookie.
 */
export async function POST() {
  const response = NextResponse.json(MOCK_CART, {
    headers: CACHE_HEADERS
  });

  response.cookies.set('cart', MOCK_CART.token, { 
    path: '/', 
    maxAge: 3600 * 24 * 14,
    sameSite: 'lax',
    httpOnly: false 
  });

  return response;
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
