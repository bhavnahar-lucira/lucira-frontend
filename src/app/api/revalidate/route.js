import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { handle, type } = body;

    console.log(`[Next.js Revalidate] Triggered ISR revalidation. Type: ${type || 'single'}, Handle: ${handle || 'none'}`);

    if (type === 'all') {
      // Global revalidation - use sparingly as this triggers many background renders
      revalidatePath('/', 'layout');
      console.log(`[Next.js Revalidate] Global layout revalidation triggered`);
      return NextResponse.json({ revalidated: true, type: 'all' });
    }

    // Always revalidate the homepage for any product change to keep featured sections fresh.
    revalidatePath('/');

    if (handle) {
      // Revalidate only the specific product page.
      revalidatePath(`/products/${handle}`);

      // OPTIMIZATION: Removed revalidatePath('/collections/[handle]', 'page')
      // Instead of marking ALL collections as stale on every single product update,
      // we rely on either:
      // 1. Live pricing in the ProductCard (client-side)
      // 2. A separate 'collection' type revalidation when specifically needed.
      // 3. The default 24h background revalidation.
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

    return NextResponse.json({ revalidated: true, now: Date.now(), handle });
  } catch (error) {
    console.error('[Next.js Revalidate] Error during revalidation:', error);
    return NextResponse.json({ revalidated: false, message: 'Error revalidating' }, { status: 500 });
  }
}

