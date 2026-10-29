import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireDealerOrAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cmsCode, tanks } = body;

    if (!cmsCode || !Array.isArray(tanks)) {
      return NextResponse.json({ success: false, error: 'cmsCode and tanks array are required' }, { status: 400 });
    }

    // OWASP A01 BOLA Protection: Verify user is ADMIN or the dealer assigned to this CMS code
    const auth = await requireDealerOrAdmin(req, cmsCode);
    if (auth.errorResponse) return auth.errorResponse;

    const db = getDb();

    // Perform inside a transaction
    const updateTanks = db.transaction((code: string, tankList: any[]) => {
      // 1. Remove existing fixed tank master records for this CMS code
      db.prepare('DELETE FROM ro_fixed_tanks WHERE cms_code = ?').run(code);

      // 2. Insert updated fixed tanks
      const insertStmt = db.prepare(`
        INSERT INTO ro_fixed_tanks (cms_code, tank_index, product, capacity_kl, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `);

      for (let i = 0; i < tankList.length; i++) {
        const t = tankList[i];
        const tankIndex = t.tank_index !== undefined ? Number(t.tank_index) : (i + 1);
        const product = t.product === 'HSD' ? 'HSD' : 'MS';
        const capacityKl = Number(t.capacity_kl) || 20;

        insertStmt.run(code, tankIndex, product, capacityKl);
      }
    });

    updateTanks(cmsCode, tanks);

    // Fetch the updated records
    const updated = db.prepare('SELECT tank_index, product, capacity_kl FROM ro_fixed_tanks WHERE cms_code = ? ORDER BY tank_index ASC').all(cmsCode);

    return NextResponse.json({
      success: true,
      message: 'Fixed tank master configuration updated successfully',
      tanks: updated
    });
  } catch (error: any) {
    console.error('Failed to update fixed tanks:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
