export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin, hashPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone') || '';
    const status = searchParams.get('status') || ''; // 'audited' | 'pending'
    const search = searchParams.get('search') || '';

    const db = getDb();

    // Query all dealers joined with their most recent audit
    let query = `
      SELECT 
        d.*,
        a.id as latest_audit_id,
        a.total_score,
        a.max_possible,
        a.percentage,
        a.grade,
        a.approval_status,
        a.created_at as audit_date,
        a.rep_mobile,
        a.rep_name,
        COALESCE((
          SELECT COUNT(*) 
          FROM audit_reupload_requests r 
          JOIN audits a_all ON r.audit_id = a_all.id 
          WHERE a_all.cms_code = d.cms_code AND r.status = 'PENDING'
        ), 0) as pending_reuploads,
        COALESCE((
          SELECT COUNT(*) 
          FROM audit_reupload_requests r 
          WHERE r.audit_id = a.id AND r.status = 'RESOLVED'
        ), 0) as resolved_reuploads,
        dr.progress_percent as draft_progress,
        dr.updated_at as draft_updated_at
      FROM dealers_ro d
      LEFT JOIN audit_drafts dr ON (d.cms_code = dr.cms_code AND (julianday('now') - julianday(dr.updated_at)) <= 1.0)
      LEFT JOIN (
        SELECT a1.id, a1.cms_code, a1.total_score, a1.max_possible, a1.percentage, a1.grade, a1.approval_status, a1.created_at,
               a1.rep_mobile, a1.rep_name
        FROM audits a1
        WHERE a1.id = (
          SELECT a2.id FROM audits a2 
          WHERE a2.cms_code = a1.cms_code 
          ORDER BY 
            CASE 
              WHEN a2.approval_status = 'REVISION_REQUIRED' THEN 0 
              WHEN a2.approval_status = 'APPROVED' THEN 1 
              ELSE 2 
            END ASC,
            a2.created_at DESC 
          LIMIT 1
        )
      ) a ON d.cms_code = a.cms_code
      WHERE d.is_active = 1
    `;

    const params: any[] = [];

    if (zone && zone !== 'All') {
      query += ` AND d.zone = ?`;
      params.push(zone);
    }

    if (search) {
      query += ` AND (d.ro_name LIKE ? OR d.cms_code LIKE ? OR d.dealer_name LIKE ? OR d.sales_area LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status === 'audited') {
      query += ` AND a.id IS NOT NULL`;
    } else if (status === 'pending') {
      query += ` AND a.id IS NULL`;
    } else if (status === 'reupload_pending') {
      query += ` AND a.id IS NOT NULL AND (
        a.approval_status = 'REVISION_REQUIRED' OR 
        (SELECT COUNT(*) FROM audit_reupload_requests r JOIN audits a_all ON r.audit_id = a_all.id WHERE a_all.cms_code = d.cms_code AND r.status = 'PENDING') > 0
      )`;
    } else if (status === 'reupload_completed') {
      query += ` AND a.id IS NOT NULL AND (
        (SELECT COUNT(*) FROM audit_reupload_requests r JOIN audits a_all ON r.audit_id = a_all.id WHERE a_all.cms_code = d.cms_code AND r.status = 'RESOLVED') > 0 AND
        (SELECT COUNT(*) FROM audit_reupload_requests r JOIN audits a_all ON r.audit_id = a_all.id WHERE a_all.cms_code = d.cms_code AND r.status = 'PENDING') = 0 AND
        a.approval_status = 'PENDING_APPROVAL'
      )`;
    } else if (status === 'pending_approval') {
      query += ` AND a.id IS NOT NULL AND (a.approval_status IS NULL OR a.approval_status = 'PENDING_APPROVAL')`;
    } else if (status === 'approved') {
      query += ` AND a.id IS NOT NULL AND a.approval_status = 'APPROVED'`;
    }

    query += `
      ORDER BY 
        CASE 
          WHEN a.id IS NOT NULL AND (a.approval_status = 'REVISION_REQUIRED' OR (SELECT COUNT(*) FROM audit_reupload_requests r JOIN audits a_all ON r.audit_id = a_all.id WHERE a_all.cms_code = d.cms_code AND r.status = 'PENDING') > 0) THEN 1
          WHEN a.id IS NOT NULL AND (SELECT COUNT(*) FROM audit_reupload_requests r JOIN audits a_all ON r.audit_id = a_all.id WHERE a_all.cms_code = d.cms_code AND r.status = 'RESOLVED') > 0 AND a.approval_status = 'PENDING_APPROVAL' THEN 2
          WHEN a.id IS NOT NULL AND (a.approval_status IS NULL OR a.approval_status = 'PENDING_APPROVAL') THEN 3
          WHEN a.id IS NOT NULL AND a.approval_status = 'APPROVED' THEN 4
          WHEN a.id IS NOT NULL AND a.approval_status = 'REJECTED' THEN 5
          WHEN dr.progress_percent IS NOT NULL AND dr.progress_percent > 0 THEN 6
          ELSE 7
        END ASC,
        d.zone ASC,
        d.ro_name ASC
    `;

    const dealers = db.prepare(query).all(...params);

    // Compute zone summaries
    const zoneStats = db.prepare(`
      SELECT 
        d.zone,
        COUNT(d.id) as total_ro,
        COUNT(a.id) as audited_ro,
        ROUND(AVG(a.percentage), 1) as avg_score
      FROM dealers_ro d
      LEFT JOIN audits a ON d.cms_code = a.cms_code
      WHERE d.is_active = 1
      GROUP BY d.zone
    `).all();

    return NextResponse.json({
      success: true,
      dealers,
      zoneStats
    });
  } catch (error: any) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.errorResponse) return auth.errorResponse;

    const data = await request.json();
    const db = getDb();

    const roId = 'RO_' + Date.now() + '_' + crypto.randomBytes(2).toString('hex');

    db.prepare(`
      INSERT INTO dealers_ro (
        id, cms_code, ro_name, dealer_name, dealer_mobile, zone, sales_area, latitude, longitude, address, brand_type, has_canopy, tsm_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      roId,
      data.cmsCode.trim(),
      data.roName.trim().toUpperCase(),
      data.dealerName.trim(),
      data.dealerMobile.trim(),
      data.zone || 'North',
      data.salesArea || '',
      parseFloat(data.latitude) || 28.6139,
      parseFloat(data.longitude) || 77.2090,
      data.address || '',
      data.brandType || 'Nayara Retail',
      data.hasCanopy || 'Yes',
      data.tsmName || 'Unassigned TSM'
    );

    // Create user login credential for dealer with scrypt hashed password
    const rawPass = data.dealerMobile.trim().slice(-6) || '123456';
    const hashedPass = hashPassword(rawPass);
    const userId = 'USR_' + crypto.randomBytes(3).toString('hex');

    db.prepare(`
      INSERT OR REPLACE INTO users (id, username, password_hash, full_name, role, zone, ro_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      data.cmsCode.trim(),
      hashedPass,
      data.dealerName.trim(),
      'DEALER',
      data.zone || 'North',
      roId
    );

    return NextResponse.json({ success: true, roId });
  } catch (error: any) {
    console.error('Error creating dealer:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
