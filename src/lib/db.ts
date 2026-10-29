import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'audits.db');

let dbInstance: Database.Database | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(dbPath, { timeout: 15000 });
    try {
      dbInstance.pragma('journal_mode = DELETE');
      dbInstance.pragma('busy_timeout = 15000');
    } catch (e) {}
    
    // Initialize database tables
    dbInstance.exec(`
      -- Users & Credentials
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL, -- 'ADMIN', 'TSM', 'AUDITOR', 'DEALER'
        zone TEXT,
        ro_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Retail Outlets / Dealers Master Table
      CREATE TABLE IF NOT EXISTS dealers_ro (
        id TEXT PRIMARY KEY,
        cms_code TEXT UNIQUE NOT NULL,
        ro_name TEXT NOT NULL,
        dealer_name TEXT NOT NULL,
        dealer_mobile TEXT NOT NULL,
        zone TEXT NOT NULL,
        sales_area TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT,
        brand_type TEXT DEFAULT 'Nayara Retail',
        has_canopy TEXT DEFAULT 'Yes',
        tsm_name TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Audits Main Table
      CREATE TABLE IF NOT EXISTS audits (
        id TEXT PRIMARY KEY,
        ro_id TEXT,
        ro_name TEXT NOT NULL,
        cms_code TEXT NOT NULL,
        brand_type TEXT,
        has_canopy TEXT,
        tsm_name TEXT,
        rep_name TEXT,
        rep_mobile TEXT,
        fsm_total INTEGER,
        fsm_male INTEGER,
        fsm_female INTEGER,
        last_cra_date TEXT,
        days_since_cra INTEGER,
        gps_lat REAL,
        gps_lng REAL,
        gps_coords TEXT,
        gps_address TEXT,
        assessment_lang TEXT,
        
        total_score REAL,
        max_possible REAL,
        percentage REAL,
        grade TEXT,
        action_items TEXT,
        segment_summary TEXT,
        
        signature_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_tanks (
        id TEXT PRIMARY KEY,
        audit_id TEXT NOT NULL,
        product TEXT,
        tank_index INTEGER,
        capacity TEXT,
        manual_dip REAL,
        auto_dip REAL,
        delta REAL,
        is_compliant INTEGER,
        photo_data TEXT,
        FOREIGN KEY(audit_id) REFERENCES audits(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audit_responses (
        id TEXT PRIMARY KEY,
        audit_id TEXT NOT NULL,
        question_id INTEGER,
        segment TEXT,
        question_text TEXT,
        response TEXT,
        earned_score REAL,
        max_score REAL,
        FOREIGN KEY(audit_id) REFERENCES audits(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audit_photos (
        id TEXT PRIMARY KEY,
        audit_id TEXT NOT NULL,
        photo_index INTEGER,
        title TEXT,
        photo_data TEXT,
        FOREIGN KEY(audit_id) REFERENCES audits(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audit_statutory (
        id TEXT PRIMARY KEY,
        audit_id TEXT NOT NULL,
        key_name TEXT,
        status_text TEXT,
        date_val TEXT,
        photo_data TEXT,
        is_approved_for_reuse INTEGER DEFAULT 1,
        FOREIGN KEY(audit_id) REFERENCES audits(id) ON DELETE CASCADE
      );

      -- User Sessions Table
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Retail Outlet Fixed Underground Storage Tanks Master
      CREATE TABLE IF NOT EXISTS ro_fixed_tanks (
        id TEXT PRIMARY KEY,
        cms_code TEXT NOT NULL,
        tank_index INTEGER NOT NULL,
        product TEXT NOT NULL, -- 'MS' or 'HSD'
        capacity_kl REAL NOT NULL, -- e.g. 20
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Active drafts in progress
      CREATE TABLE IF NOT EXISTS audit_drafts (
        cms_code TEXT PRIMARY KEY,
        ro_name TEXT,
        progress_percent INTEGER DEFAULT 0,
        draft_data TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Admin photo re-upload requests for dealers
      CREATE TABLE IF NOT EXISTS audit_reupload_requests (
        id TEXT PRIMARY KEY,
        audit_id TEXT NOT NULL,
        cms_code TEXT NOT NULL,
        category TEXT NOT NULL, -- 'STATUTORY' | 'PHOTO' | 'TANK'
        target_id TEXT NOT NULL, -- e.g. statutory ID, photo ID, tank ID
        photo_title TEXT NOT NULL,
        current_photo_url TEXT,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING', -- 'PENDING' | 'RESOLVED'
        requested_by TEXT NOT NULL,
        requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        replacement_photo_url TEXT,
        FOREIGN KEY(audit_id) REFERENCES audits(id) ON DELETE CASCADE
      );
    `);

    // Schema Migrations
    try {
      dbInstance.exec("ALTER TABLE audits ADD COLUMN audit_month TEXT;");
    } catch (e) {}

    try {
      dbInstance.exec("ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 1;");
    } catch (e) {}

    try {
      dbInstance.exec("ALTER TABLE audits ADD COLUMN approval_status TEXT DEFAULT 'PENDING_APPROVAL';");
    } catch (e) {}

    try {
      dbInstance.exec("ALTER TABLE audits ADD COLUMN approved_by TEXT;");
    } catch (e) {}

    try {
      dbInstance.exec("ALTER TABLE audits ADD COLUMN approved_at DATETIME;");
    } catch (e) {}

    try {
      dbInstance.exec("ALTER TABLE audits ADD COLUMN admin_remarks TEXT;");
    } catch (e) {}

    try {
      dbInstance.exec("ALTER TABLE audits ADD COLUMN increment_confirmed INTEGER DEFAULT 0;");
    } catch (e) {}

    // One-time migration system to run cleanup exactly once across server restarts / Docker deployments
    try {
      dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version TEXT PRIMARY KEY,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const hasRunCleanReset = dbInstance.prepare("SELECT 1 FROM schema_migrations WHERE version = '20261030_fresh_audit_reset'").get();
      if (!hasRunCleanReset) {
        // Clear all previous audit submissions, responses, photos, and drafts for a completely fresh start
        dbInstance.exec(`
          DELETE FROM audit_responses;
          DELETE FROM audit_statutory;
          DELETE FROM audit_photos;
          DELETE FROM audit_tanks;
          DELETE FROM audit_reupload_requests;
          DELETE FROM audit_drafts;
          DELETE FROM audits;
          DELETE FROM sessions;
          UPDATE users SET must_change_password = 1 WHERE role = 'DEALER';
          INSERT INTO schema_migrations (version) VALUES ('20261030_fresh_audit_reset');
        `);
      }
    } catch (e) {
      console.error('Migration 20261030_fresh_audit_reset error:', e);
    }

    // Seed default fixed tanks if empty
    const tankMasterCount = (dbInstance.prepare('SELECT COUNT(*) as count FROM ro_fixed_tanks').get() as any)?.count || 0;
    if (tankMasterCount === 0) {
      const insertFixedTank = dbInstance.prepare(`
        INSERT INTO ro_fixed_tanks (id, cms_code, tank_index, product, capacity_kl)
        VALUES (?, ?, ?, ?, ?)
      `);

      const defaultRoTanks: Array<[string, string, number, string, number]> = [
        // 10842 - Highway Service Station (2 MS, 2 HSD)
        ['FT_1', '10842', 1, 'MS', 20],
        ['FT_2', '10842', 2, 'MS', 20],
        ['FT_3', '10842', 3, 'HSD', 20],
        ['FT_4', '10842', 4, 'HSD', 20],

        // 10915 - Capital Fuels & Care (1 MS, 2 HSD)
        ['FT_5', '10915', 1, 'MS', 20],
        ['FT_6', '10915', 2, 'HSD', 20],
        ['FT_7', '10915', 3, 'HSD', 20],

        // 20104 - Western Petro Express
        ['FT_8', '20104', 1, 'MS', 20],
        ['FT_9', '20104', 2, 'HSD', 25],

        // 20455 - Sahyadri Fuels
        ['FT_10', '20455', 1, 'MS', 15],
        ['FT_11', '20455', 2, 'HSD', 20],

        // 30219 - Deccan Energy Station
        ['FT_12', '30219', 1, 'MS', 20],
        ['FT_13', '30219', 2, 'HSD', 20],

        // 30788 - Coastal Link Fuels
        ['FT_14', '30788', 1, 'MS', 20],
        ['FT_15', '30788', 2, 'HSD', 20],

        // 40112 - Central Highway Point
        ['FT_16', '40112', 1, 'MS', 20],
        ['FT_17', '40112', 2, 'HSD', 20],

        // 50331 - Eastern Star Station
        ['FT_18', '50331', 1, 'MS', 20],
        ['FT_19', '50331', 2, 'HSD', 20]
      ];

      for (const t of defaultRoTanks) {
        insertFixedTank.run(...t);
      }
    }

    // Seed initial admin user if empty
    const adminUser = dbInstance.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'").get() as any;
    if (!adminUser || adminUser.count === 0) {
      // Default initial password '123456' hashed with scrypt
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync('123456', salt, 64).toString('hex');
      const initialAdminHash = `scrypt:${salt}:${hash}`;

      dbInstance.prepare(`
        INSERT INTO users (id, username, password_hash, full_name, role, zone, must_change_password)
        VALUES ('USR_ADMIN', 'admin', ?, 'System Administrator', 'ADMIN', 'All', 0)
      `).run(initialAdminHash);
    }
  }
  return dbInstance;
}

// ── Session Helpers ───────────────────────────────────────────────────────────
import crypto from 'crypto';

export function createSession(userId: string, username: string, role: string, daysValid = 7) {
  const db = getDb();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();
  
  db.prepare(`
    INSERT INTO sessions (token, user_id, username, role, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(token, userId, username, role, expiresAt);

  return { token, expiresAt };
}

export function getSession(token: string) {
  if (!token) return null;
  const db = getDb();
  const session = db.prepare(`
    SELECT s.*, u.full_name, u.zone, u.ro_id 
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token) as any;

  if (!session) return null;

  let ro = null;
  if (session.role === 'DEALER') {
    ro = db.prepare('SELECT * FROM dealers_ro WHERE cms_code = ? OR id = ?').get(session.username, session.ro_id) as any;
  }

  return {
    token: session.token,
    userId: session.user_id,
    username: session.username,
    fullName: session.full_name,
    role: session.role,
    zone: session.zone,
    expiresAt: session.expires_at,
    ro
  };
}

export function deleteSession(token: string) {
  if (!token) return;
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// ── Monthly Dealer Profile & Statutory Documents Helper ──────────────────────
export function getMonthlyDealerProfile(cmsCode: string) {
  const db = getDb();
  const ro = db.prepare('SELECT * FROM dealers_ro WHERE cms_code = ?').get(cmsCode) as any;
  if (!ro) return null;

  // 1. Fixed tanks
  let tanks = db.prepare('SELECT tank_index, product, capacity_kl FROM ro_fixed_tanks WHERE cms_code = ? ORDER BY tank_index ASC').all(cmsCode) as any[];
  if (!tanks || tanks.length === 0) {
    tanks = [
      { tank_index: 1, product: 'MS', capacity_kl: 20 },
      { tank_index: 2, product: 'HSD', capacity_kl: 20 }
    ];
  }

  // 2. Current Month (YYYY-MM)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 3. Check if completed this month
  const currentMonthAudit = db.prepare(`
    SELECT id, created_at, total_score, percentage, grade 
    FROM audits 
    WHERE cms_code = ? AND (audit_month = ? OR strftime('%Y-%m', created_at) = ?)
    ORDER BY created_at DESC LIMIT 1
  `).get(cmsCode, currentMonth, currentMonth) as any;

  // 4. Fetch latest certificate dates from statutory table across past audits
  const latestAudit = db.prepare(`
    SELECT id, created_at FROM audits WHERE cms_code = ? ORDER BY created_at DESC LIMIT 1
  `).get(cmsCode) as any;

  const certificates: Record<string, any> = {
    earthing: null,
    water: null,
    fire: null,
    wm_jar: null,
    wm_du: []
  };

  if (latestAudit) {
    const stats = db.prepare(`
      SELECT key_name, status_text, date_val 
      FROM audit_statutory 
      WHERE audit_id = ?
    `).all(latestAudit.id) as any[];

    const todayStr = now.toISOString().split('T')[0];

    for (const s of stats) {
      const isStillValid = s.date_val && s.date_val >= todayStr;
      const certInfo = {
        keyName: s.key_name,
        status: s.status_text,
        validUntil: s.date_val,
        isValid: !!isStillValid,
        isExpired: s.date_val ? s.date_val < todayStr : false
      };

      if (s.key_name.includes('Earthing')) certificates.earthing = certInfo;
      else if (s.key_name.includes('Water')) certificates.water = certInfo;
      else if (s.key_name.includes('Fire') || s.key_name.includes('Extinguisher')) certificates.fire = certInfo;
      else if (s.key_name.includes('5 Ltr') || s.key_name.includes('Jar')) certificates.wm_jar = certInfo;
      else if (s.key_name.includes('W&M DU') || s.key_name.includes('DU Certificate')) {
        certificates.wm_du.push(certInfo);
      }
    }
  }

  return {
    ro: {
      cms_code: ro.cms_code,
      ro_name: ro.ro_name,
      dealer_name: ro.dealer_name,
      dealer_mobile: ro.dealer_mobile,
      brand_type: ro.brand_type,
      has_canopy: ro.has_canopy,
      tsm_name: ro.tsm_name,
      zone: ro.zone,
      address: ro.address
    },
    tanks,
    currentAuditMonth: currentMonth,
    hasCompletedThisMonth: !!currentMonthAudit,
    completedAudit: currentMonthAudit || null,
    certificates
  };
}

export default getDb;

