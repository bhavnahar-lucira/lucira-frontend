import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dashboard.lucirajewelry.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { handle, type } = body;

    console.log(`[Next.js Revalidate] Triggered ISR revalidation. Type: ${type || 'single'}, Handle: ${handle || 'none'}`);

    if (type === 'all') {
      // Global revalidation - use sparingly as this triggers many background renders
      revalidatePath('/', 'layout');
      console.log(`[Next.js Revalidate] Global layout revalidation triggered`);
      return NextResponse.json({ revalidated: true, type: 'all' }, { headers: corsHeaders });
    }

    if (type === 'batch') {
      // Sent by the backend's revalidation queue (lucira-backend
      // lib/storefrontRevalidation.js): every page touched by one debounce
      // window of webhooks / dashboard saves, in a single invocation. The
      // backend clears its own memory cache, so no /api/clear-cache ping here.
      const MAX_ITEMS = 200;
      const handles = (v) => (Array.isArray(v) ? v : [])
        .filter((h) => typeof h === 'string' && /^[^/\s?#]+$/.test(h))
        .slice(0, MAX_ITEMS);
      const products = handles(body.products);
      const collections = handles(body.collections);
      const paths = (Array.isArray(body.paths) ? body.paths : [])
        .filter((p) => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//'))
        .slice(0, MAX_ITEMS);

      if (body.home) revalidatePath('/');
      products.forEach((h) => revalidatePath(`/products/${h}`));
      collections.forEach((h) => revalidatePath(`/collections/${h}`));
      if (body.collectionsAll) revalidatePath('/collections/[handle]', 'page');
      paths.forEach((p) => revalidatePath(p));

      console.log(`[Next.js Revalidate] Batch: ${products.length} products, ${collections.length} collections, ${paths.length} paths, allCollections=${!!body.collectionsAll}, home=${!!body.home}`);
      return NextResponse.json({
        revalidated: true,
        type: 'batch',
        counts: { products: products.length, collections: collections.length, paths: paths.length },
      }, { headers: corsHeaders });
    }

    if (type === 'path' && body.path) {
      // Revalidate a specific path
      revalidatePath(body.path);
      console.log(`[Next.js Revalidate] Path revalidation triggered for: ${body.path}`);
      return NextResponse.json({ revalidated: true, type: 'path', path: body.path }, { headers: corsHeaders });
    }

    // Always revalidate the homepage for any product change to keep featured sections fresh.
    revalidatePath('/');

    if (handle) {
      // Revalidate only the specific product page.
      revalidatePath(`/products/${handle}`);
    }

    if (type === 'collection' && handle) {
       revalidatePath(`/collections/${handle}`);
    } else if (type === 'collections') {
       revalidatePath('/collections/[handle]', 'page');
    }

    // Ping the Fastify backend to clear its memory cache as well
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8080';
      await fetch(`${backendUrl}/api/clear-cache`);
      console.log(`[Next.js Revalidate] Successfully pinged backend to clear cache`);
    } catch (e) {
      console.error('[Next.js Revalidate] Failed to ping backend cache clear:', e);
    }

    return NextResponse.json({ revalidated: true, now: Date.now(), handle }, { headers: corsHeaders });
  } catch (error) {
    console.error('[Next.js Revalidate] Error during revalidation:', error);
    return NextResponse.json({ revalidated: false, message: 'Error revalidating' }, { status: 500, headers: corsHeaders });
  }
}

