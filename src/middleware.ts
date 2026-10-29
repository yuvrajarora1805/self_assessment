import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('session_token')?.value;
  const roleCookie = request.cookies.get('fuel_role')?.value;
  const userCookie = request.cookies.get('fuel_user')?.value;

  // Helper: redirect to a path on the same origin
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url, 302);
  };

  // Helper: extract user role and dealer info
  let role: string | null = roleCookie || null;
  let dealerCms: string | null = null;
  let roName: string | null = null;
  let tsm: string | null = null;
  let brand: string | null = null;
  let canopy: string | null = null;

  if (userCookie) {
    try {
      let raw = userCookie;
      try {
        raw = decodeURIComponent(userCookie);
      } catch (e) {}
      const u = typeof raw === 'object' ? raw : JSON.parse(raw);
      if (!role) role = u?.role || null;
      dealerCms = u?.username || null;
      roName = u?.ro?.ro_name || u?.fullName || null;
      tsm = u?.ro?.tsm_name || null;
      brand = u?.ro?.brand_type || 'Nayara Retail';
      canopy = u?.ro?.has_canopy || 'Yes';
    } catch (e) {}
  }

  const dealerFormUrl = `/audit-form?cmsCode=${encodeURIComponent(dealerCms || '')}&roName=${encodeURIComponent(roName || '')}&tsm=${encodeURIComponent(tsm || '')}&brand=${encodeURIComponent(brand || 'Nayara Retail')}&canopy=${encodeURIComponent(canopy || 'Yes')}`;

  // ── Public Routes (Never blocked) & Large Body Endpoints (handled directly by API routes) ──
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/audits') ||
    pathname.startsWith('/api/dealer') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Legacy dealer portal alias → redirect to audit form or login
  if (pathname === '/dealer-login' || pathname === '/dealer-portal') {
    if (token && role === 'DEALER') {
      return NextResponse.redirect(new URL(dealerFormUrl, request.url));
    }
    return redirectTo('/login');
  }

  // ── 1. Unauthenticated Users ──────────────────────────────────────────────
  if (!token) {
    // API routes return 401 JSON instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Session token missing or expired' },
        { status: 401 }
      );
    }

    // If already on /login, let them stay
    if (pathname === '/login') {
      return NextResponse.next();
    }
    // Any other page (/ or /dealers or /map or /legacy/index.html) → /login
    return redirectTo('/login');
  }

  // ── 2. Authenticated Users on /login ──────────────────────────────────────
  if (pathname === '/login') {
    // If user explicitly navigated to login with reset/expired query, let them view login and clear stale cookies
    if (request.nextUrl.searchParams.has('reset') || request.nextUrl.searchParams.has('logout') || request.nextUrl.searchParams.has('expired')) {
      const res = NextResponse.next();
      res.cookies.set('session_token', '', { path: '/', maxAge: 0 });
      res.cookies.set('fuel_role', '', { path: '/', maxAge: 0 });
      res.cookies.set('fuel_user', '', { path: '/', maxAge: 0 });
      return res;
    }

    if (role === 'DEALER') {
      return NextResponse.redirect(new URL(dealerFormUrl, request.url));
    }
    // Admin or others → Admin Dashboard
    return redirectTo('/');
  }

  // ── 3. Role-Based Access Control (RBAC) ───────────────────────────────────
  if (role === 'DEALER') {
    // Dealers cannot access general admin pages (/, /dealers, /map, /new-audit, /audits table)
    // BUT they ARE allowed to view their specific audit report at /audits/[id]
    const isTryingAdmin = 
      pathname === '/' ||
      pathname.startsWith('/dealers') ||
      pathname.startsWith('/map') ||
      pathname === '/audits';

    if (isTryingAdmin) {
      return NextResponse.redirect(new URL(dealerFormUrl, request.url));
    }

    if (pathname.startsWith('/legacy/index.html') || pathname === '/legacy') {
      return NextResponse.redirect(new URL(dealerFormUrl, request.url));
    }

    // Allow dealers on /audit-form, /legacy/* and /api/*
    const response = NextResponse.next();
    if (pathname.startsWith('/legacy') || pathname.startsWith('/audit-form')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
    return response;
  }

  // ── 4. Admins have full access to everything ──────────────────────────────
  const response = NextResponse.next();
  if (pathname.startsWith('/legacy')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static assets)
     * - _next/image   (image optimisation)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
