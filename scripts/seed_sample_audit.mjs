import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data/audits.db');
const db = new Database(dbPath);

const cmsCode = '51976NA976';
const roName = 'B.R. Filling Station';
const tsmName = 'Area TSM';
const auditId = 'AUD_51976NA976_OCT2026';
const auditMonth = '2026-10';

console.log('Seeding sample audit for CMS Code:', cmsCode);

// Remove any existing audit for this id if re-run
db.prepare('DELETE FROM audits WHERE id = ?').run(auditId);
db.prepare('DELETE FROM audit_tanks WHERE audit_id = ?').run(auditId);
db.prepare('DELETE FROM audit_responses WHERE audit_id = ?').run(auditId);
db.prepare('DELETE FROM audit_photos WHERE audit_id = ?').run(auditId);
db.prepare('DELETE FROM audit_statutory WHERE audit_id = ?').run(auditId);

// Ensure ro_fixed_tanks exists for 51976NA976
const existingTanks = db.prepare('SELECT count(*) as count FROM ro_fixed_tanks WHERE cms_code = ?').get(cmsCode);
if (!existingTanks || existingTanks.count === 0) {
  const insertFixed = db.prepare('INSERT INTO ro_fixed_tanks (id, cms_code, tank_index, product, capacity_kl) VALUES (?, ?, ?, ?, ?)');
  insertFixed.run(`FT_${cmsCode}_1`, cmsCode, 1, 'MS', 20);
  insertFixed.run(`FT_${cmsCode}_2`, cmsCode, 2, 'MS', 20);
  insertFixed.run(`FT_${cmsCode}_3`, cmsCode, 3, 'HSD', 20);
  insertFixed.run(`FT_${cmsCode}_4`, cmsCode, 4, 'HSD', 20);
}

// 1. Insert Master Audit
const insertAudit = db.prepare(`
  INSERT INTO audits (
    id, ro_name, cms_code, brand_type, has_canopy, tsm_name,
    rep_name, rep_mobile, fsm_total, fsm_male, fsm_female,
    last_cra_date, days_since_cra, gps_lat, gps_lng, gps_coords, gps_address,
    assessment_lang, total_score, max_possible, percentage, grade,
    action_items, segment_summary, signature_data, audit_month,
    approval_status, approved_by, approved_at, admin_remarks, increment_confirmed,
    created_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    CURRENT_TIMESTAMP
  )
`);

insertAudit.run(
  auditId,
  roName,
  cmsCode,
  'Nayara Retail',
  'Yes',
  tsmName,
  'Gurpreet Singh (Franchisee Manager)',
  '9876543210',
  6, 5, 1,
  '2026-09-15',
  40,
  29.816759,
  75.346340,
  '29.816759, 75.346340',
  'NH-54, Near Mandi, District Mansa, Punjab - 151505',
  'en',
  92.5,
  100.0,
  92.5,
  'A',
  JSON.stringify([
    'Ensure all FSMs wear branded Nayara safety shoes and caps at all times.',
    'Renew Water Test Certificate before expiry in December 2026.'
  ]),
  JSON.stringify({
    'Forecourt & Driveway': { earned: 24, max: 25 },
    'Customer Convenience & Washroom': { earned: 19, max: 20 },
    'Statutory & Safety Compliance': { earned: 25, max: 25 },
    'Stock & Automation Verification': { earned: 24.5, max: 30 }
  }),
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><text x="10" y="35" font-family="cursive" font-size="24" fill="%23002855">Gurpreet Singh</text></svg>',
  auditMonth,
  'PENDING_APPROVAL', // Set to PENDING_APPROVAL so the user can test the admin approval button
  null,
  null,
  null,
  0
);

// 2. Insert Tanks Dip Calibration Data
const insertTank = db.prepare(`
  INSERT INTO audit_tanks (
    id, audit_id, product, tank_index, capacity,
    manual_dip, auto_dip, delta, is_compliant, photo_data
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleGaugeSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" style="background:%230f172a;"><text x="20" y="40" fill="%2338bdf8" font-size="14" font-family="monospace">TANK DIP GAUGE READING</text><rect x="30" y="70" width="240" height="25" fill="%23334155" rx="4"/><rect x="30" y="70" width="168" height="25" fill="%2310b981" rx="4"/><text x="35" y="125" fill="%23ffffff" font-size="12" font-family="sans-serif">Physical Dip: 1420 mm | ATG: 1418 mm</text><text x="35" y="150" fill="%2310b981" font-size="12" font-family="sans-serif">Delta: -2 mm (COMPLIANT &lt; 3mm)</text></svg>';

insertTank.run('TNK_51976_1', auditId, 'MS', 1, '20 KL', 1420, 1418, -2, 1, sampleGaugeSvg);
insertTank.run('TNK_51976_2', auditId, 'MS', 2, '20 KL', 1285, 1284, -1, 1, sampleGaugeSvg);
insertTank.run('TNK_51976_3', auditId, 'HSD', 3, '20 KL', 1650, 1652, 2, 1, sampleGaugeSvg);
insertTank.run('TNK_51976_4', auditId, 'HSD', 4, '20 KL', 1510, 1508, -2, 1, sampleGaugeSvg);

// 3. Insert Statutory Compliance Certificates
const insertStatutory = db.prepare(`
  INSERT INTO audit_statutory (
    id, audit_id, key_name, status_text, date_val, photo_data
  ) VALUES (?, ?, ?, ?, ?, ?)
`);

const sampleCertSvg = (title, expiry) => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" style="background:%23f8fafc;border:2px solid %23002855;"><rect x="10" y="10" width="380" height="240" fill="none" stroke="%23cbd5e1" stroke-width="2"/><text x="30" y="50" font-family="sans-serif" font-weight="bold" font-size="16" fill="%23002855">${title}</text><text x="30" y="85" font-family="sans-serif" font-size="13" fill="%23334155">RO: B.R. Filling Station (CMS: 51976NA976)</text><text x="30" y="115" font-family="sans-serif" font-size="13" fill="%23334155">Issuer: Authorized Inspection Authority</text><rect x="30" y="140" width="340" height="40" fill="%23ecfdf5" rx="6"/><text x="45" y="165" font-family="sans-serif" font-weight="bold" font-size="13" fill="%23065f46">VALID UNTIL: ${expiry}</text><circle cx="330" cy="205" r="25" fill="%23002855"/><text x="315" y="210" fill="%23ffffff" font-size="10" font-family="sans-serif">VERIFIED</text></svg>`;

insertStatutory.run('STAT_51976_1', auditId, 'cc_earthing', 'Yes', '2027-04-15', sampleCertSvg('ELECTRICAL EARTHING CERTIFICATE', '15-Apr-2027'));
insertStatutory.run('STAT_51976_2', auditId, 'cc_water', 'Yes', '2026-12-31', sampleCertSvg('FRAMED WATER TEST CERTIFICATE', '31-Dec-2026'));
insertStatutory.run('STAT_51976_3', auditId, 'cc_fire', 'Yes', '2027-01-15', sampleCertSvg('FIRE EXTINGUISHER PRESSURE TEST', '15-Jan-2027'));
insertStatutory.run('STAT_51976_4', auditId, 'cc_wm', 'Yes', '2027-03-31', sampleCertSvg('WEIGHTS & MEASURES 5L JAR STAMP', '31-Mar-2027'));
insertStatutory.run('STAT_51976_5', auditId, 'W&M DU Certificate - 1', 'Yes', '2027-03-31', sampleCertSvg('DISPENSING UNIT CALIBRATION STAMP #1', '31-Mar-2027'));
insertStatutory.run('STAT_51976_6', auditId, 'W&M DU Certificate - 2', 'Yes', '2027-03-31', sampleCertSvg('DISPENSING UNIT CALIBRATION STAMP #2', '31-Mar-2027'));

// 4. Insert Essential Question Responses
const insertResponse = db.prepare(`
  INSERT INTO audit_responses (
    id, audit_id, question_id, segment, question_text, response, earned_score, max_score
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleQuestions = [
  { id: 1, seg: 'Forecourt & Cleanliness', q: 'Is the sales driveway free of potholes, oil stains, and debris?', r: 'Yes', earned: 5, max: 5 },
  { id: 2, seg: 'Forecourt & Cleanliness', q: 'Are all Nayara illuminated canopy lights, fascias, and logos functional?', r: 'Yes', earned: 5, max: 5 },
  { id: 3, seg: 'Customer Facilities', q: 'Is clean, potable drinking water available with a functional dispenser?', r: 'Yes', earned: 5, max: 5 },
  { id: 4, seg: 'Customer Facilities', q: 'Are customer washrooms clean, sanitized, with water supply and soap?', r: 'Yes', earned: 5, max: 5 },
  { id: 5, seg: 'Staff & Uniform', q: 'Are all Forecourt Service Men (FSM) wearing clean Nayara branded uniform & safety shoes?', r: 'Yes', earned: 5, max: 5 },
  { id: 6, seg: 'Safety & Automation', q: 'Are all fire buckets filled with clean, dry sand and unobstructed?', r: 'Yes', earned: 5, max: 5 },
  { id: 7, seg: 'Safety & Automation', q: 'Is the Emergency Stop Push Button operational and clearly marked?', r: 'Yes', earned: 5, max: 5 },
  { id: 8, seg: 'Stock & Calibration', q: 'Was 5-liter conical measure test conducted in front of representative?', r: 'Yes', earned: 5, max: 5 }
];

sampleQuestions.forEach((item, idx) => {
  insertResponse.run(`RESP_51976_${idx + 1}`, auditId, item.id, item.seg, item.q, item.r, item.earned, item.max);
});

// 5. Insert Station Evidence Photos
const insertPhoto = db.prepare(`
  INSERT INTO audit_photos (
    id, audit_id, photo_index, title, photo_data
  ) VALUES (?, ?, ?, ?, ?)
`);

const stationPhotoSvg = (label) => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" style="background:%23002855;"><rect x="15" y="15" width="330" height="210" fill="%230284c7" rx="8"/><circle cx="180" cy="100" r="40" fill="%23f59e0b"/><rect x="15" y="160" width="330" height="65" fill="%23334155" rx="4"/><text x="180" y="195" font-family="sans-serif" font-weight="bold" font-size="14" fill="%23ffffff" text-anchor="middle">${label}</text><text x="180" y="215" font-family="monospace" font-size="10" fill="%2394a3b8" text-anchor="middle">B.R. Filling Station (51976NA976)</text></svg>`;

insertPhoto.run('PH_51976_1', auditId, 1, 'Driveway & Canopy Panorama', stationPhotoSvg('FORECOURT & CANOPY'));
insertPhoto.run('PH_51976_2', auditId, 2, 'Customer Restroom & Handwash Area', stationPhotoSvg('CUSTOMER HYGIENE & WASHROOM'));
insertPhoto.run('PH_51976_3', auditId, 3, 'Air Gauge & Free Water Station', stationPhotoSvg('AIR WATER TYRE FACILITY'));
insertPhoto.run('PH_51976_4', auditId, 4, 'DU Island & FSM Deployment', stationPhotoSvg('DISPENSING ISLANDS'));

console.log('✅ Successfully seeded sample audit record for 51976NA976!');
db.close();
