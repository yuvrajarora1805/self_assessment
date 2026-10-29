export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { saveBase64Image } from '@/lib/image-storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const { requestId, targetId, category, newPhotoData } = body;

    if (!requestId || !targetId || !newPhotoData) {
      return NextResponse.json(
        { success: false, error: 'requestId, targetId, and newPhotoData are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const audit = db.prepare('SELECT id, cms_code, audit_month FROM audits WHERE id = ?').get(id) as any;
    if (!audit) {
      return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });
    }

    // Role check: Dealer can only resubmit their own outlet's audit
    if (auth.user.role === 'DEALER' && audit.cms_code.toUpperCase() !== auth.user.username.toUpperCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const monthStr = audit.audit_month || 'current';
    const subDir = `audits/${monthStr}/${audit.cms_code}/${audit.id}/replacements`;
    const photoUrl = saveBase64Image(newPhotoData, subDir, `resubmit_${targetId}_${Date.now()}.jpg`);

    const nowIso = new Date().toISOString();

    const runTx = db.transaction(() => {
      // 1. Mark request as RESOLVED
      db.prepare(`
        UPDATE audit_reupload_requests
        SET status = 'RESOLVED',
            resolved_at = ?,
            replacement_photo_url = ?
        WHERE id = ? AND audit_id = ?
      `).run(nowIso, photoUrl, requestId, id);

      // 2. Update target table with fresh photo URL
      if (category === 'STATUTORY') {
        db.prepare('UPDATE audit_statutory SET photo_data = ? WHERE id = ?').run(photoUrl, targetId);
      } else if (category === 'TANK') {
        db.prepare('UPDATE audit_tanks SET photo_data = ? WHERE id = ?').run(photoUrl, targetId);
      } else {
        db.prepare('UPDATE audit_photos SET photo_data = ? WHERE id = ?').run(photoUrl, targetId);
      }

      // 3. Check if all pending reupload requests for this audit are now resolved
      const remainingPending = db.prepare(`
        SELECT COUNT(*) as count FROM audit_reupload_requests
        WHERE audit_id = ? AND status = 'PENDING'
      `).get(id) as any;

      if (remainingPending.count === 0) {
        // Return audit status to PENDING_APPROVAL so Admin can sign off
        db.prepare(`
          UPDATE audits
          SET approval_status = 'PENDING_APPROVAL'
          WHERE id = ?
        `).run(id);
      }
    });

    runTx();

    return NextResponse.json({
      success: true,
      message: 'Photo re-uploaded successfully!',
      photoUrl
    });
  } catch (error: any) {
    console.error('Error submitting replacement photo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
