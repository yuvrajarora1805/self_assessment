export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = getSession(token);
    if (!session) {
      return NextResponse.json({ authenticated: false, error: 'Session expired or invalid' }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        username: session.username,
        fullName: session.fullName,
        role: session.role,
        zone: session.zone,
        ro: session.ro
      }
    });
  } catch (error: any) {
    console.error('Session verify error:', error);
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
