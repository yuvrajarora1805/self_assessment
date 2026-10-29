export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireDealerOrAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cmsCode = searchParams.get('cmsCode');

    if (!cmsCode) {
      return NextResponse.json({ success: false, error: 'CMS code is required' }, { status: 400 });
    }

    const auth = await requireDealerOrAdmin(request, cmsCode);
    if (auth.errorResponse) return auth.errorResponse;

    const db = getDb();

    const ro = db.prepare('SELECT * FROM dealers_ro WHERE cms_code = ?').get(cmsCode) as any;
    if (!ro) {
      return NextResponse.json({ success: false, error: 'Dealer outlet not found' }, { status: 404 });
    }

    // 1. Fixed tanks
    let tanks = db.prepare('SELECT tank_index, product, capacity_kl FROM ro_fixed_tanks WHERE cms_code = ? ORDER BY tank_index ASC').all(cmsCode) as any[];
    if (!tanks || tanks.length === 0) {
      const defaultTanks = [
        { id: `FT_${cmsCode}_1`, cms: cmsCode, idx: 1, prod: 'MS', cap: 20 },
        { id: `FT_${cmsCode}_2`, cms: cmsCode, idx: 2, prod: 'MS', cap: 20 },
        { id: `FT_${cmsCode}_3`, cms: cmsCode, idx: 3, prod: 'HSD', cap: 20 },
        { id: `FT_${cmsCode}_4`, cms: cmsCode, idx: 4, prod: 'HSD', cap: 20 }
      ];
      const ins = db.prepare('INSERT OR IGNORE INTO ro_fixed_tanks (id, cms_code, tank_index, product, capacity_kl) VALUES (?, ?, ?, ?, ?)');
      for (const t of defaultTanks) {
        ins.run(t.id, t.cms, t.idx, t.prod, t.cap);
      }
      tanks = db.prepare('SELECT tank_index, product, capacity_kl FROM ro_fixed_tanks WHERE cms_code = ? ORDER BY tank_index ASC').all(cmsCode) as any[];
    }

    // 2. Current Month (YYYY-MM)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 3. Check if completed this month — prioritize audits with active revisions or approved audits
    const currentMonthAudit = db.prepare(`
      SELECT id, created_at, total_score, percentage, grade,
             approval_status, approved_by, approved_at, admin_remarks, increment_confirmed, audit_month
      FROM audits 
      WHERE UPPER(cms_code) = UPPER(?) AND (
        audit_month = ? 
        OR strftime('%Y-%m', created_at) = ? 
        OR created_at >= date('now', 'start of month')
        OR created_at >= date('now', '-30 days')
      )
      ORDER BY 
        CASE 
          WHEN approval_status = 'REVISION_REQUIRED' THEN 0 
          WHEN approval_status = 'APPROVED' THEN 1
          ELSE 2 
        END ASC,
        created_at DESC 
      LIMIT 1
    `).get(cmsCode, currentMonth, currentMonth) as any;

    // 4. Fetch latest certificate dates ONLY from the most recent APPROVED audit
    const latestApprovedAudit = db.prepare(`
      SELECT id, created_at, approved_at, approval_status 
      FROM audits 
      WHERE cms_code = ? AND approval_status = 'APPROVED' 
      ORDER BY approved_at DESC, created_at DESC LIMIT 1
    `).get(cmsCode) as any;

    const certificates: Record<string, any> = {
      earthing: null,
      water: null,
      fire: null,
      wm_jar: null,
      wm_du: []
    };

    if (latestApprovedAudit) {
      const stats = db.prepare(`
        SELECT key_name, status_text, date_val, photo_data, COALESCE(is_approved_for_reuse, 1) as is_approved_for_reuse
        FROM audit_statutory 
        WHERE audit_id = ?
      `).all(latestApprovedAudit.id) as any[];

      const todayStr = now.toISOString().split('T')[0];
      const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      for (const s of stats) {
        const isStillValid = s.date_val && s.date_val >= todayStr;
        const isExpiringSoon = isStillValid && s.date_val <= thirtyDaysAhead;
        const isExpired = s.date_val ? s.date_val < todayStr : true;
        const isApprovedForReuse = s.is_approved_for_reuse === 1;

        const certInfo = {
          keyName: s.key_name,
          status: s.status_text,
          validUntil: s.date_val,
          isValid: !!isStillValid,
          isExpiringSoon: !!isExpiringSoon,
          isExpired: !!isExpired,
          isApproved: true,
          isApprovedForReuse,
          // Only auto-fill image if still valid AND approved by admin for reuse
          photoUrl: (isStillValid && isApprovedForReuse) ? (s.photo_data || '') : ''
        };

        const k = (s.key_name || '').toLowerCase();
        if (k.includes('earthing')) certificates.earthing = certInfo;
        else if (k.includes('water')) certificates.water = certInfo;
        else if (k.includes('fire') || k.includes('extinguisher')) certificates.fire = certInfo;
        else if (k.includes('5 ltr') || k.includes('jar')) certificates.wm_jar = certInfo;
        else if (k.includes('w&m') || k.includes('du certificate')) {
          certificates.wm_du.push(certInfo);
        }
      }
    }

    // If no past certificates on record yet, populate master registered validities
    if (!certificates.earthing) {
      certificates.earthing = {
        keyName: 'Electrical Earthing Certificate Displayed!',
        status: 'Yes',
        validUntil: '2027-04-15',
        isValid: true,
        isExpired: false,
        isAutoFetched: true
      };
    }
    if (!certificates.water) {
      certificates.water = {
        keyName: 'Valid Framed Water Certificate Displayed',
        status: 'Yes',
        validUntil: '2026-12-31',
        isValid: true,
        isExpired: false,
        isAutoFetched: true
      };
    }
    if (!certificates.fire) {
      certificates.fire = {
        keyName: 'FIRE EXTINGUISHER CERTIFICATE AVAILABLE',
        status: 'Yes',
        validUntil: '2027-01-15',
        isValid: true,
        isExpired: false,
        isAutoFetched: true
      };
    }
    if (!certificates.wm_jar) {
      certificates.wm_jar = {
        keyName: '5 Ltr Jar Certificate',
        status: 'Yes',
        validUntil: '2027-03-31',
        isValid: true,
        isExpired: false,
        isAutoFetched: true
      };
    }
    if (certificates.wm_du.length === 0) {
      certificates.wm_du_count = 2;
      certificates.wm_du = [
        { keyName: 'W&M DU Certificate - 1', status: 'Yes', validUntil: '2027-03-31', isValid: true, isExpired: false, isAutoFetched: true },
        { keyName: 'W&M DU Certificate - 2', status: 'Yes', validUntil: '2027-03-31', isValid: true, isExpired: false, isAutoFetched: true }
      ];
    }

    return NextResponse.json({
      success: true,
      profile: {
        ro: {
          cms_code: ro.cms_code,
          ro_name: ro.ro_name,
          dealer_name: ro.dealer_name,
          dealer_mobile: ro.dealer_mobile,
          brand_type: ro.brand_type,
          has_canopy: ro.has_canopy,
          tsm_name: ro.tsm_name,
          zone: ro.zone,
          address: ro.address,
          latitude: ro.latitude,
          longitude: ro.longitude
        },
        tanks,
        currentAuditMonth: currentMonth,
        hasCompletedThisMonth: !!currentMonthAudit,
        completedAudit: currentMonthAudit || null,
        certificates,
        pendingReuploadRequests: db.prepare(`
          SELECT * FROM audit_reupload_requests
          WHERE cms_code = ? AND status = 'PENDING'
          ORDER BY requested_at DESC
        `).all(cmsCode)
      }
    });
  } catch (error: any) {
    console.error('Error fetching monthly dealer profile:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
