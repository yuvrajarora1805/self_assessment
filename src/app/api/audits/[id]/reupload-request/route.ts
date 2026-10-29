export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

// GET: Fetch all reupload requests for this audit
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const requests = db.prepare(`
      SELECT * FROM audit_reupload_requests
      WHERE audit_id = ?
      ORDER BY requested_at DESC
    `).all(id);

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Admin creates a photo re-upload request
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const { category, targetId, photoTitle, currentPhotoUrl, reason } = body;

    if (!targetId || !reason || !photoTitle) {
      return NextResponse.json(
        { success: false, error: 'targetId, photoTitle, and reason are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const audit = db.prepare('SELECT id, cms_code, ro_name FROM audits WHERE id = ?').get(id) as any;
    if (!audit) {
      return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });
    }

    const reqId = 'REQ_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    const reviewer = auth.user.fullName || 'Operations HQ';

    const runTx = db.transaction(() => {
      // Upsert request for this target item
      db.prepare(`
        DELETE FROM audit_reupload_requests
        WHERE audit_id = ? AND target_id = ? AND status = 'PENDING'
      `).run(id, targetId);

      db.prepare(`
        INSERT INTO audit_reupload_requests (
          id, audit_id, cms_code, category, target_id, photo_title, current_photo_url, reason, status, requested_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
      `).run(
        reqId,
        id,
        audit.cms_code,
        category || 'PHOTO',
        targetId,
        photoTitle,
        currentPhotoUrl || '',
        reason,
        reviewer
      );

      // Transition audit status to REVISION_REQUIRED so dealer sees it prominently
      db.prepare(`
        UPDATE audits
        SET approval_status = 'REVISION_REQUIRED',
            admin_remarks = COALESCE(admin_remarks || ' | ', '') || ?
        WHERE id = ?
      `).run(`Image re-upload requested: ${photoTitle} (${reason})`, id);
    });

    runTx();

    return NextResponse.json({
      success: true,
      requestId: reqId,
      message: `Re-upload requested for ${photoTitle}`
    });
  } catch (error: any) {
    console.error('Error creating re-upload request:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
