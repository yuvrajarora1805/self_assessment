export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin, hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { cmsCode, customPassword } = await request.json();

    if (!cmsCode) {
      return NextResponse.json({ success: false, error: 'CMS Code is required' }, { status: 400 });
    }

    const cleanCms = cmsCode.trim().toUpperCase();
    const db = getDb();

    // 1. Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE UPPER(username) = UPPER(?)').get(cleanCms) as any;
    if (!user) {
      return NextResponse.json({ success: false, error: `No user account found for CMS Code: ${cleanCms}` }, { status: 404 });
    }

    // 2. Fetch linked dealer contact info
    const ro = db.prepare('SELECT ro_name, dealer_name, dealer_mobile FROM dealers_ro WHERE UPPER(cms_code) = UPPER(?)').get(cleanCms) as any;

    // 3. Set temporary password (either custom or default '123456') and set must_change_password = 1
    const newPassword = (customPassword || '123456').trim();
    const newHash = hashPassword(newPassword);

    db.prepare(`
      UPDATE users 
      SET password_hash = ?, must_change_password = 1 
      WHERE UPPER(username) = UPPER(?)
    `).run(newHash, cleanCms);

    // Invalidate existing sessions for this user so they must log in again
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

    // 4. Generate WhatsApp notification link
    let whatsappUrl = null;
    if (ro?.dealer_mobile && ro.dealer_mobile !== 'Not Specified') {
      const cleanMobile = ro.dealer_mobile.replace(/[^0-9]/g, '');
      const fullMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
      const message = `Hello ${ro.dealer_name || 'Dealer'},\n\nYour login password for Nayara RO Self-Assessment (${cleanCms} - ${ro.ro_name}) has been reset by Admin.\n\nTemporary Password: ${newPassword}\nPortal Link: https://self.yarora.dev/login\n\nPlease log in and set your new secure password.`;
      whatsappUrl = `https://api.whatsapp.com/send?phone=${fullMobile}&text=${encodeURIComponent(message)}`;
    }

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for CMS: ${cleanCms}. Temporary password is '${newPassword}'.`,
      temporaryPassword: newPassword,
      dealerMobile: ro?.dealer_mobile || null,
      whatsappUrl
    });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
