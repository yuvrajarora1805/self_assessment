export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/db';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (token) {
      deleteSession(token);
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    // Clear session cookies
    response.cookies.set('session_token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0
    });

    response.cookies.set('fuel_role', '', {
      httpOnly: false,
      path: '/',
      maxAge: 0
    });

    response.cookies.set('fuel_user', '', {
      httpOnly: false,
      path: '/',
      maxAge: 0
    });

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
