export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb, createSession } from '@/lib/db';
import { verifyPassword, hashPassword, isLegacyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username (or CMS Code) and password are required' },
        { status: 400 }
      );
    }

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    const db = getDb();
    // Case-insensitive query so '50085na085', '50085Na085', '50085NA085', etc. all match seamlessly
    const user = db.prepare('SELECT * FROM users WHERE UPPER(username) = UPPER(?)').get(cleanUser) as any;

    if (!user || !verifyPassword(cleanPass, user.password_hash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Default password is 123456' },
        { status: 401 }
      );
    }

    // Auto-upgrade plain password to scrypt if legacy
    if (isLegacyPassword(user.password_hash)) {
      try {
        const upgradedHash = hashPassword(cleanPass);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(upgradedHash, user.id);
      } catch (upgradeErr) {
        console.warn('Password upgrade warning:', upgradeErr);
      }
    }

    // If dealer, fetch full linked RO details
    let dealerRo = null;
    if (user.role === 'DEALER') {
      dealerRo = db.prepare('SELECT * FROM dealers_ro WHERE cms_code = ? OR id = ?').get(user.username, user.ro_id) as any;
    }

    // 1. Create a persistent session in the database
    const session = createSession(user.id, user.username, user.role, 7);

    // 2. Prepare payload
    const sessionPayload = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      zone: user.zone,
      ro: dealerRo
    };

    // 3. Check if dealer must change initial password
    const mustChangePassword = user.role === 'DEALER' && (user.must_change_password === 1 || cleanPass === '123456');

    // 4. Determine redirect URL based on role
    let redirectUrl = '/';
    if (user.role === 'DEALER') {
      const cms = encodeURIComponent(user.username || '');
      const roName = encodeURIComponent(dealerRo?.ro_name || user.full_name || '');
      const tsm = encodeURIComponent(dealerRo?.tsm_name || '');
      const brand = encodeURIComponent(dealerRo?.brand_type || 'Nayara Retail');
      const canopy = encodeURIComponent(dealerRo?.has_canopy || 'Yes');
      redirectUrl = `/audit-form?cmsCode=${cms}&roName=${roName}&tsm=${tsm}&brand=${brand}&canopy=${canopy}`;
    }

    // Detect if client request arrived over HTTPS (e.g. via Cloudflare Tunnel)
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isHttps = forwardedProto === 'https' || process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      success: true,
      token: session.token,
      user: {
        ...sessionPayload,
        mustChangePassword
      },
      mustChangePassword,
      redirectUrl
    });

    // 4. Set HttpOnly session token cookie
    response.cookies.set('session_token', session.token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'lax',
      secure: isHttps
    });

    // 5. Set plain fuel_role cookie for instant RBAC without JSON parsing
    response.cookies.set('fuel_role', user.role, {
      httpOnly: false,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: isHttps
    });

    // 6. Set client-readable fuel_user cookie for quick client state sync
    response.cookies.set('fuel_user', JSON.stringify(sessionPayload), {
      httpOnly: false,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: isHttps
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
