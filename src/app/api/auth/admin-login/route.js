import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ username, password, role: 'admin' });

    // Hardcoded fallback for immediate access if DB record is missing
    const isHardcodedAdmin = username === 'admin' && password === 'Lucira@2026';

    if (!user && !isHardcodedAdmin) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    // In a real app, we'd use JWT. For simplicity and as per requirement, 
    // we'll set a basic session cookie.
    const response = NextResponse.json({ success: true, message: 'Admin authenticated' });
    
    // Set a cookie that expires in 24 hours
    response.cookies.set('admin_token', 'lucira_admin_authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req) {
  const adminToken = req.cookies.get('admin_token');
  
  if (adminToken?.value === 'lucira_admin_authenticated') {
    return NextResponse.json({ authenticated: true }, {
      headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
    });
  }
  
  return NextResponse.json({ authenticated: false }, { 
    status: 401,
    headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
  });
}
