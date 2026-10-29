export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const user = auth.user;
    const { id } = await params;
    const audit = getDb().prepare('SELECT * FROM audits WHERE id = ?').get(id) as any;

    if (!audit) {
      return NextResponse.json({ success: false, error: 'Audit report not found' }, { status: 404 });
    }

    // Role check: Dealer can only view audits that belong to their CMS Code
    if (user.role === 'DEALER' && audit.cms_code.toUpperCase() !== user.username.toUpperCase()) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to view this report' },
        { status: 403 }
      );
    }

    const tanks = getDb().prepare('SELECT * FROM audit_tanks WHERE audit_id = ? ORDER BY product, tank_index ASC').all(id);
    const responses = getDb().prepare('SELECT * FROM audit_responses WHERE audit_id = ? ORDER BY question_id ASC').all(id);
    const photos = getDb().prepare('SELECT * FROM audit_photos WHERE audit_id = ? ORDER BY photo_index ASC').all(id);
    const statutory = getDb().prepare('SELECT * FROM audit_statutory WHERE audit_id = ?').all(id);
    const reuploadRequests = getDb().prepare('SELECT * FROM audit_reupload_requests WHERE audit_id = ? ORDER BY requested_at DESC').all(id);

    return NextResponse.json({
      success: true,
      audit: {
        ...audit,
        action_items: audit.action_items ? JSON.parse(audit.action_items) : [],
        segment_summary: audit.segment_summary ? JSON.parse(audit.segment_summary) : {},
        tanks,
        responses,
        photos,
        statutory,
        reupload_requests: reuploadRequests
      }
    });
  } catch (error: any) {
    console.error('Error fetching audit details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Deletion is strictly reserved for Admin users
    const auth = await requireAdmin(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    getDb().prepare('DELETE FROM audits WHERE id = ?').run(id);
    return NextResponse.json({ success: true, message: 'Audit deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting audit:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
