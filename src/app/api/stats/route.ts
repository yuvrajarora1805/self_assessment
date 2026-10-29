export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const user = auth.user;
    const db = getDb();

    // If DEALER, return dealer's own localized stats
    if (user.role === 'DEALER') {
      const cms = user.username;
      const totalCount = (db.prepare('SELECT COUNT(*) as count FROM audits WHERE cms_code = ?').get(cms) as any)?.count || 0;
      const avgScore = (db.prepare('SELECT AVG(percentage) as avg FROM audits WHERE cms_code = ?').get(cms) as any)?.avg || 0;
      const recentAudits = db.prepare(`
        SELECT id, ro_name, cms_code, percentage, grade, created_at 
        FROM audits 
        WHERE cms_code = ?
        ORDER BY created_at DESC 
        LIMIT 5
      `).all(cms);

      return NextResponse.json({
        success: true,
        stats: {
          totalAudits: totalCount,
          averageCompliance: avgScore ? parseFloat(avgScore).toFixed(1) : '0.0',
          gradeBreakdown: [],
          recentAudits
        }
      });
    }

    // Admins and TSMs see full enterprise operations stats
    const totalCount = (db.prepare('SELECT COUNT(*) as count FROM audits').get() as any)?.count || 0;
    const avgScore = (db.prepare('SELECT AVG(percentage) as avg FROM audits').get() as any)?.avg || 0;

    const grades = db.prepare(`
      SELECT grade, COUNT(*) as count 
      FROM audits 
      WHERE grade IS NOT NULL AND grade != '' 
      GROUP BY grade
    `).all();

    const recentAudits = db.prepare(`
      SELECT id, ro_name, cms_code, percentage, grade, created_at 
      FROM audits 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    // Active drafts updated within the last 24 hours that are not yet submitted or approved
    const activeDrafts = db.prepare(`
      SELECT d.cms_code, d.ro_name, d.progress_percent, d.draft_data, d.updated_at 
      FROM audit_drafts d
      WHERE (julianday('now') - julianday(d.updated_at)) <= 1.0
        AND NOT EXISTS (
          SELECT 1 FROM audits a 
          WHERE a.cms_code = d.cms_code 
            AND (a.approval_status = 'APPROVED' OR a.approval_status = 'PENDING_APPROVAL')
        )
      ORDER BY d.updated_at DESC 
      LIMIT 10
    `).all();

    // Re-uploaded photos awaiting Admin review
    const pendingReuploadReviews = db.prepare(`
      SELECT 
        r.id as request_id,
        r.audit_id,
        r.cms_code,
        r.category,
        r.photo_title,
        r.reason,
        r.replacement_photo_url,
        r.resolved_at,
        r.status,
        a.ro_name,
        a.grade,
        a.percentage,
        a.approval_status
      FROM audit_reupload_requests r
      JOIN audits a ON r.audit_id = a.id
      WHERE r.status = 'RESOLVED' AND a.approval_status = 'PENDING_APPROVAL'
      ORDER BY r.resolved_at DESC
      LIMIT 10
    `).all();

    return NextResponse.json({
      success: true,
      stats: {
        totalAudits: totalCount,
        averageCompliance: avgScore ? parseFloat(avgScore).toFixed(1) : '0.0',
        gradeBreakdown: grades,
        recentAudits,
        activeDrafts,
        pendingReuploadReviews
      }
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
