import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { handle } = body;

    console.log(`[Next.js Revalidate] Triggered ISR revalidation. Product Handle: ${handle || 'none'}`);

    // Revalidate the homepage to update featured products/sections.
    revalidatePath('/');

    if (handle) {
      // Revalidate the specific product page that was updated in Shopify.
      revalidatePath(`/products/${handle}`);

      // Revalidate ALL collection pages using the dynamic route pattern.
      // This ensures product grids reflect stock/price changes after a Shopify webhook.
      // 'page' scope tells Next.js to revalidate every page matching this dynamic segment.
      // NOTE: This marks them stale — Vercel re-renders each on the NEXT user visit (ISR write),
      //       not all 22 at once. So this is cost-efficient — only visited pages get re-rendered.
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

