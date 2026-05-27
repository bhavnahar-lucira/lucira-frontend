import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { handle } = body;

    console.log(`[Next.js Revalidate] Triggered ISR revalidation. Product Handle: ${handle || 'none'}`);

    // Revalidate only the homepage path to update featured products/sections.
    // We avoid 'layout' revalidation here because revalidating the root layout 
    // invalidates every single page in the application, leading to a massive 
    // spike in Vercel ISR writes and exceeding limits.
    revalidatePath('/');

    // Optionally revalidate specific paths explicitly
    if (handle) {
      revalidatePath(`/products/${handle}`);
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
