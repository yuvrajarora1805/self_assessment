import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getSession } from './db';
import { NextResponse } from 'next/server';

// ── Password Hashing & Verification (scrypt + salt) ──────────────────────────
const SCRYPT_KEYLEN = 64;
const SCRYPT_PREFIX = 'scrypt';

/**
 * Computes a secure salted cryptographic hash of a password using scrypt.
 * Output format: scrypt:<saltHex>:<hashHex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${SCRYPT_PREFIX}:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Securely verifies a plain password against stored hash or fallback plain password.
 * Uses timingSafeEqual to avoid timing attack vulnerabilities.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // If already hashed with scrypt format: scrypt:<salt>:<hash>
  if (storedHash.startsWith(`${SCRYPT_PREFIX}:`)) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, expectedHashHex] = parts;
    const expectedBuffer = Buffer.from(expectedHashHex, 'hex');
    const actualBuffer = crypto.scryptSync(password, salt, expectedBuffer.length);
    if (actualBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
  }

  // Fallback for legacy plain text entries during seamless migration
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(storedHash);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return password === storedHash;
  }
}

/**
 * Checks whether a stored password string needs to be upgraded to a scrypt hash.
 */
export function isLegacyPassword(storedHash: string): boolean {
  return !storedHash || !storedHash.startsWith(`${SCRYPT_PREFIX}:`);
}

// ── API Authorization & Session Helpers ──────────────────────────────────────

export interface AuthenticatedUser {
  token: string;
  userId: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'DEALER' | 'TSM' | 'AUDITOR' | string;
  zone: string | null;
  expiresAt: string;
  ro: any;
}

/**
 * Extracts and validates the session token from cookies or Authorization Bearer header.
 */
export async function getAuthenticatedUser(request?: Request): Promise<AuthenticatedUser | null> {
  let token: string | undefined;

  // 1. Try Bearer header
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // 2. Try cookie store
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('session_token')?.value;
    } catch {
      // In non-cookie contexts
    }
  }

  if (!token) return null;

  const session = getSession(token);
  if (!session) return null;

  return session as AuthenticatedUser;
}

/**
 * Guard: Requires authentication for API route.
 * Returns either { user: AuthenticatedUser } or { errorResponse: NextResponse }.
 */
export async function requireAuth(request?: Request): Promise<
  { user: AuthenticatedUser; errorResponse?: never } | { user?: never; errorResponse: NextResponse }
> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Valid session token required' },
        { status: 401 }
      )
    };
  }
  return { user };
}

/**
 * Guard: Requires ADMIN, AUDITOR, or TSM role.
 */
export async function requireAdmin(request?: Request): Promise<
  { user: AuthenticatedUser; errorResponse?: never } | { user?: never; errorResponse: NextResponse }
> {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth;

  const role = auth.user.role;
  if (role !== 'ADMIN' && role !== 'TSM' && role !== 'AUDITOR') {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Forbidden: Administrator or Operations HQ privileges required' },
        { status: 403 }
      )
    };
  }
  return { user: auth.user };
}

/**
 * Guard: Permits Admin/TSM unconditionally, or a DEALER if operating on their own CMS Code.
 */
export async function requireDealerOrAdmin(request: Request, requestedCmsCode?: string | null): Promise<
  { user: AuthenticatedUser; errorResponse?: never } | { user?: never; errorResponse: NextResponse }
> {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth;

  const user = auth.user;
  if (user.role === 'ADMIN' || user.role === 'TSM' || user.role === 'AUDITOR') {
    return { user };
  }

  if (user.role === 'DEALER') {
    if (requestedCmsCode && requestedCmsCode.trim().toUpperCase() !== user.username.trim().toUpperCase()) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: 'Forbidden: You can only access your own retail outlet data' },
          { status: 403 }
        )
      };
    }
    return { user };
  }

  return {
    errorResponse: NextResponse.json(
      { success: false, error: 'Forbidden: Access denied' },
      { status: 403 }
    )
  };
}
