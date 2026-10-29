export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await request.json();
    const { action, remarks, incrementConfirmed, approvedBy, statutoryDocApprovals } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Audit ID is required' }, { status: 400 });
    }

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Action must be APPROVE or REJECT' }, { status: 400 });
    }

    // Get reviewer identity from verified session
    const reviewer = auth.user.fullName || approvedBy || 'Admin / Operations HQ';

    const db = getDb();
    const existing = db.prepare('SELECT id, cms_code, ro_name FROM audits WHERE id = ?').get(id) as any;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const incVal = (action === 'APPROVE' && incrementConfirmed) ? 1 : 0;
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE audits
      SET approval_status = ?,
          increment_confirmed = ?,
          approved_by = ?,
          approved_at = ?,
          admin_remarks = ?
      WHERE id = ?
    `).run(newStatus, incVal, reviewer, nowIso, remarks || '', id);

    // If APPROVE, synchronize any duplicate/older pending audits for this RO in the same month
    if (action === 'APPROVE') {
      db.prepare(`
        UPDATE audits
        SET approval_status = 'APPROVED',
            approved_by = ?,
            approved_at = ?
        WHERE cms_code = ? 
          AND approval_status = 'PENDING_APPROVAL'
          AND (audit_month = ? OR strftime('%Y-%m', created_at) = ?)
      `).run(reviewer, nowIso, existing.cms_code, existing.audit_month || '', existing.created_at ? existing.created_at.substring(0, 7) : '');

      // Also ensure any leftover reupload requests for this RO are resolved
      db.prepare(`
        UPDATE audit_reupload_requests
        SET status = 'RESOLVED',
            resolved_at = COALESCE(resolved_at, ?)
        WHERE cms_code = ? AND status = 'PENDING'
      `).run(nowIso, existing.cms_code);
    }

    // If statutory document reuse approvals provided by Admin, update individual certificate approval states
    if (statutoryDocApprovals && typeof statutoryDocApprovals === 'object') {
      const updateStatReuse = db.prepare(`
        UPDATE audit_statutory
        SET is_approved_for_reuse = ?
        WHERE id = ? AND audit_id = ?
      `);
      for (const [statId, canReuse] of Object.entries(statutoryDocApprovals)) {
        updateStatReuse.run(canReuse ? 1 : 0, statId, id);
      }
    }

    return NextResponse.json({
      success: true,
      auditId: id,
      approvalStatus: newStatus,
      incrementConfirmed: incVal === 1,
      approvedBy: reviewer,
      approvedAt: nowIso,
      remarks: remarks || ''
    });
  } catch (error: any) {
    console.error('Error approving audit:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
