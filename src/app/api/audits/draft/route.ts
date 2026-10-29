export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: Retrieve a draft for a given CMS code or list all active drafts (for admins)
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const user = auth.user;
    const { searchParams } = new URL(request.url);
    const cmsCode = searchParams.get('cmsCode') || searchParams.get('cms_code');
    const db = getDb();

    // If cmsCode is specified
    if (cmsCode) {
      // If dealer, ensure matching cms
      if (user.role === 'DEALER' && user.username !== cmsCode) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }

      const row = db.prepare('SELECT * FROM audit_drafts WHERE cms_code = ?').get(cmsCode) as any;
      if (!row) {
        return NextResponse.json({ success: true, draft: null });
      }

      let parsedData = null;
      try {
        parsedData = JSON.parse(row.draft_data);
      } catch (e) {
        parsedData = row.draft_data;
      }

      return NextResponse.json({
        success: true,
        draft: {
          cmsCode: row.cms_code,
          roName: row.ro_name,
          progressPercent: row.progress_percent,
          data: parsedData,
          updatedAt: row.updated_at
        }
      });
    }

    // Otherwise, Admin or TSM viewing all active filling drafts
    if (user.role === 'DEALER') {
      const row = db.prepare('SELECT * FROM audit_drafts WHERE cms_code = ?').get(user.username) as any;
      return NextResponse.json({ success: true, drafts: row ? [row] : [] });
    }

    const drafts = db.prepare(`
      SELECT cms_code, ro_name, progress_percent, updated_at 
      FROM audit_drafts 
      ORDER BY updated_at DESC 
      LIMIT 20
    `).all();

    return NextResponse.json({ success: true, drafts });
  } catch (error: any) {
    console.error('Error in /api/audits/draft GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Save or update draft as dealer fills the form
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cmsCode, roName, progressPercent, data } = body;

    if (!cmsCode) {
      return NextResponse.json({ success: false, error: 'CMS Code is required' }, { status: 400 });
    }

    const db = getDb();
    const resolvedName = roName || 'Retail Outlet';
    const percent = Math.min(100, Math.max(0, parseInt(progressPercent, 10) || 0));
    const draftPayload = typeof data === 'string' ? data : JSON.stringify(data || {});

    const stmt = db.prepare(`
      INSERT INTO audit_drafts (cms_code, ro_name, progress_percent, draft_data, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(cms_code) DO UPDATE SET
        ro_name = excluded.ro_name,
        progress_percent = excluded.progress_percent,
        draft_data = excluded.draft_data,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(cmsCode, resolvedName, percent, draftPayload);

    return NextResponse.json({ success: true, message: 'Draft saved' });
  } catch (error: any) {
    console.error('Error saving draft:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove draft once finalized
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cmsCode = searchParams.get('cmsCode') || searchParams.get('cms_code');

    if (!cmsCode) {
      return NextResponse.json({ success: false, error: 'CMS Code is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM audit_drafts WHERE cms_code = ?').run(cmsCode);

    return NextResponse.json({ success: true, message: 'Draft cleared' });
  } catch (error: any) {
    console.error('Error clearing draft:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
