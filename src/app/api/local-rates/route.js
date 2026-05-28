import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('lucira');
    const rates = await db.collection('rates').findOne({ _id: 'global-rates' });
    
    if (!rates) {
      return NextResponse.json({});
    }

    return NextResponse.json(rates);
  } catch (error) {
    console.error('Error fetching local rates:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
