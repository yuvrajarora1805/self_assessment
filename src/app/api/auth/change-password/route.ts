import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, getSession, createSession } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    let username = '';
    let userId = '';

    if (token) {
      const session = getSession(token);
      if (session) {
        username = session.username;
        userId = session.userId;
      }
    }

    const { newPassword, confirmPassword, cmsCode, currentPassword } = await request.json();

    // If no session token, require cmsCode and currentPassword
    const targetUser = (username || cmsCode || '').trim();
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User session or CMS code is required' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    if (newPassword === '123456') {
      return NextResponse.json({ success: false, error: 'New password cannot be the default password (123456)' }, { status: 400 });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'New passwords do not match' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE UPPER(username) = UPPER(?)').get(targetUser) as any;
    if (!user) {
      return NextResponse.json({ success: false, error: 'User account not found' }, { status: 404 });
    }

    // If not authenticated via session token, verify current password
    if (!token && currentPassword && !verifyPassword(currentPassword.trim(), user.password_hash)) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
    }

    // Hash new password using scrypt and clear must_change_password
    const newHashedPassword = hashPassword(newPassword.trim());
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, must_change_password = 0 
      WHERE id = ?
    `).run(newHashedPassword, user.id);

    const activeSession = token ? getSession(token) : createSession(user.id, user.username, user.role, 7);
    const sessionToken = activeSession?.token || token;

    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isHttps = forwardedProto === 'https' || process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      message: 'Password updated successfully. You can now proceed to your assessment.'
    });

    if (sessionToken) {
      response.cookies.set('session_token', sessionToken, {
        httpOnly: true,
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
        secure: isHttps
      });

      response.cookies.set('fuel_role', user.role, {
        httpOnly: false,
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
        secure: isHttps
      });
    }

    return response;
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
