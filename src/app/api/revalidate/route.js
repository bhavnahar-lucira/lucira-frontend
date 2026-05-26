import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { handle } = body;

    console.log(`[Next.js Revalidate] Triggered ISR revalidation. Product Handle: ${handle || 'none'}`);

    // Revalidate the global layout to flush the cache completely, ensuring all pages 
    // (collections, home, product) get the latest product prices and data.
    revalidatePath('/', 'layout');

    // Optionally revalidate specific paths explicitly
    if (handle) {
      revalidatePath(`/products/${handle}`);
    }

    return NextResponse.json({ revalidated: true, now: Date.now(), handle });
  } catch (error) {
    console.error('[Next.js Revalidate] Error during revalidation:', error);
    return NextResponse.json({ revalidated: false, message: 'Error revalidating' }, { status: 500 });
  }
}
