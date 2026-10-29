export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';
import { saveBase64Image } from '@/lib/image-storage';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const user = auth.user;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const grade = searchParams.get('grade') || '';
    const tsm = searchParams.get('tsm') || '';
    const cmsCodeParam = searchParams.get('cms_code') || searchParams.get('cmsCode') || '';

    let query = `
      SELECT 
        id, ro_name, cms_code, brand_type, tsm_name, rep_name, 
        total_score, max_possible, percentage, grade, 
        approval_status, approved_by, approved_at, admin_remarks, increment_confirmed,
        audit_month, created_at,
        COALESCE((SELECT COUNT(*) FROM audit_reupload_requests r WHERE r.audit_id = audits.id AND r.status = 'PENDING'), 0) as pending_reuploads,
        COALESCE((SELECT COUNT(*) FROM audit_reupload_requests r WHERE r.audit_id = audits.id AND r.status = 'RESOLVED'), 0) as resolved_reuploads
      FROM audits 
      WHERE 1=1
    `;
    const params: any[] = [];

    // Dealer scope enforcement: dealer can only see their own audits
    if (user.role === 'DEALER') {
      query += ' AND cms_code = ?';
      params.push(user.username);
    } else if (cmsCodeParam) {
      query += ' AND cms_code = ?';
      params.push(cmsCodeParam);
    }

    if (search) {
      query += ' AND (ro_name LIKE ? OR cms_code LIKE ? OR rep_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (grade) {
      query += ' AND grade = ?';
      params.push(grade);
    }

    if (tsm) {
      query += ' AND tsm_name = ?';
      params.push(tsm);
    }

    query += ' ORDER BY created_at DESC LIMIT 200';

    const audits = getDb().prepare(query).all(...params);
    return NextResponse.json({ success: true, audits });
  } catch (error: any) {
    console.error('Error fetching audits:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;

    const user = auth.user;
    const data = await request.json();

    // If DEALER, enforce that the audit submission cmsCode matches their login session
    let cmsCode = String(data.cmsCode || '').trim();
    if (user.role === 'DEALER') {
      if (cmsCode && cmsCode.toUpperCase() !== user.username.toUpperCase()) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You cannot submit assessments for another retail outlet' },
          { status: 403 }
        );
      }
      cmsCode = user.username;
    } else if (!cmsCode) {
      cmsCode = 'RO_GENERAL';
    }

    const auditId = 'AUD_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    const now = new Date();
    const auditMonth = data.auditMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Prepare organized directory subpath
    const auditSubDir = `audits/${auditMonth}/${cmsCode}/${auditId}`;

    // 1. Process Signature
    let signatureUrl = '';
    if (data.signatureData) {
      signatureUrl = saveBase64Image(data.signatureData, auditSubDir, 'signature.png');
    }

    const insertAudit = getDb().prepare(`
      INSERT INTO audits (
        id, ro_name, cms_code, brand_type, has_canopy, tsm_name, rep_name, rep_mobile,
        fsm_total, fsm_male, fsm_female, last_cra_date, days_since_cra,
        gps_lat, gps_lng, gps_coords, gps_address, assessment_lang,
        total_score, max_possible, percentage, grade, action_items, segment_summary, signature_data, audit_month
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTank = getDb().prepare(`
      INSERT INTO audit_tanks (
        id, audit_id, product, tank_index, capacity, manual_dip, auto_dip, delta, is_compliant, photo_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertResponse = getDb().prepare(`
      INSERT INTO audit_responses (
        id, audit_id, question_id, segment, question_text, response, earned_score, max_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPhoto = getDb().prepare(`
      INSERT INTO audit_photos (
        id, audit_id, photo_index, title, photo_data
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const insertStatutory = getDb().prepare(`
      INSERT INTO audit_statutory (
        id, audit_id, key_name, status_text, date_val, photo_data
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const runTransaction = getDb().transaction(() => {
      insertAudit.run(
        auditId,
        data.roName || '',
        cmsCode,
        data.brandType || '',
        data.hasCanopy || 'No',
        data.tsmName || '',
        data.repName || '',
        data.repMobile || '',
        parseInt(data.fsmTotal) || 0,
        parseInt(data.fsmMale) || 0,
        parseInt(data.fsmFemale) || 0,
        data.lastCraDate || '',
        parseInt(data.daysSinceCra) || 0,
        parseFloat(data.gpsLat) || null,
        parseFloat(data.gpsLng) || null,
        data.gpsCoords || '',
        data.gpsAddress || '',
        data.assessmentLang || 'en',
        parseFloat(data.totalScore) || 0,
        parseFloat(data.maxPossible) || 0,
        parseFloat(data.percentage) || 0,
        data.grade || '',
        JSON.stringify(data.actionItems || []),
        JSON.stringify(data.segmentSummary || {}),
        signatureUrl,
        auditMonth
      );

      if (Array.isArray(data.tanks)) {
        for (const tank of data.tanks) {
          const tankId = 'TNK_' + crypto.randomBytes(4).toString('hex');
          const cleanProduct = (tank.product || 'FUEL').replace(/[^a-zA-Z0-9]/g, '_');
          const tankPhotoUrl = tank.photoData
            ? saveBase64Image(tank.photoData, `${auditSubDir}/tanks`, `tank_${cleanProduct}_${tank.index || 1}_dip.jpg`)
            : '';

          insertTank.run(
            tankId,
            auditId,
            tank.product,
            tank.index,
            tank.capacity || '',
            parseFloat(tank.manualDip) || 0,
            parseFloat(tank.autoDip) || 0,
            parseFloat(tank.delta) || 0,
            tank.isCompliant ? 1 : 0,
            tankPhotoUrl
          );
        }
      }

      if (Array.isArray(data.responses)) {
        for (const resp of data.responses) {
          const respId = 'RES_' + crypto.randomBytes(4).toString('hex');
          insertResponse.run(
            respId,
            auditId,
            resp.questionId,
            resp.segment || '',
            resp.questionText || '',
            resp.response || '',
            parseFloat(resp.earnedScore) || 0,
            parseFloat(resp.maxScore) || 0
          );
        }
      }

      if (Array.isArray(data.photos)) {
        for (const photo of data.photos) {
          const photoId = 'PHT_' + crypto.randomBytes(4).toString('hex');
          const safeTitle = (photo.title || 'photo').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 30);
          const photoUrl = photo.data
            ? saveBase64Image(photo.data, `${auditSubDir}/photos`, `photo_${photo.index}_${safeTitle}.jpg`)
            : '';

          insertPhoto.run(
            photoId,
            auditId,
            photo.index,
            photo.title || '',
            photoUrl
          );
        }
      }

      if (Array.isArray(data.statutory)) {
        for (const stat of data.statutory) {
          const statId = 'STA_' + crypto.randomBytes(4).toString('hex');
          const safeKey = (stat.keyName || 'cert').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 30);
          const statPhotoUrl = stat.photoData
            ? saveBase64Image(stat.photoData, `${auditSubDir}/certificates`, `cert_${safeKey}.jpg`)
            : '';

          insertStatutory.run(
            statId,
            auditId,
            stat.keyName || '',
            stat.statusText || '',
            stat.dateVal || '',
            statPhotoUrl
          );
        }
      }
    });

    runTransaction();

    // Clear active draft for this outlet once final report is submitted
    try {
      getDb().prepare('DELETE FROM audit_drafts WHERE cms_code = ?').run(data.cmsCode);
    } catch (e) {
      console.warn('Failed to clear audit draft after submission:', e);
    }

    return NextResponse.json({ success: true, auditId });
  } catch (error: any) {
    console.error('Error saving audit:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
