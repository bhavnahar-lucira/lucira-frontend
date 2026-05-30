import { NextResponse } from 'next/server';

const emptyCart = {
  token: "headless-cart-mock",
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

function jsonResponse() {
  return NextResponse.json(emptyCart, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
}

export async function GET() { return jsonResponse(); }
export async function POST() { return jsonResponse(); }
export async function PUT() { return jsonResponse(); }
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
