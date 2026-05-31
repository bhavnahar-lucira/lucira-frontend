import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Mock Shopify Cart AJAX API
 * Trackers like WebEngage often POST to /cart.js to sync session data.
 * Serving this via an API route instead of a static file allows handling POST
 * and prevents 405/404 errors that cause trackers to retry in loops.
 */
export async function GET() {
  return NextResponse.json({
    token: "headless-cart",
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
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    }
  });
}

export async function POST() {
  // Always return success to satisfy trackers attempting to sync data
  return NextResponse.json({ success: true });
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
