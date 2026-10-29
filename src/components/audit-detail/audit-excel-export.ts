import * as XLSX from 'xlsx';

export function exportAuditToExcel(audit: any) {
  if (!audit) return;
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ["Franchisee Self Assessment Report", ""],
    ["RO Name", audit.ro_name],
    ["CMS Code", audit.cms_code],
    ["TSM Name", audit.tsm_name],
    ["Brand Type", audit.brand_type],
    ["Canopy Present", audit.has_canopy],
    ["Representative", audit.rep_name],
    ["Mobile", audit.rep_mobile],
    ["Staff Count", `Total: ${audit.fsm_total} (M: ${audit.fsm_male}, F: ${audit.fsm_female})`],
    ["GPS Coordinates", audit.gps_coords],
    ["Physical Address", audit.gps_address],
    ["Total Score", audit.total_score],
    ["Max Possible Score", audit.max_possible],
    ["Percentage", `${audit.percentage}%`],
    ["Final Rating", audit.grade],
    ["Date Stamped", new Date(audit.created_at).toLocaleString('en-IN')]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Overview");

  if (audit.responses && audit.responses.length > 0) {
    const respHeaders = ["ID", "Segment", "Parameter", "Response", "Earned Score", "Max Score"];
    const respRows = audit.responses.map((r: any) => [
      r.question_id,
      r.segment,
      r.question_text,
      r.response,
      r.earned_score,
      r.max_score
    ]);
    const wsResp = XLSX.utils.aoa_to_sheet([respHeaders, ...respRows]);
    XLSX.utils.book_append_sheet(wb, wsResp, "Visual Checklist");
  }

  if (audit.tanks && audit.tanks.length > 0) {
    const tankHeaders = ["Product", "Tank #", "Capacity (KL)", "Manual Dip (mm)", "Auto Dip (mm)", "Delta (mm)", "Compliance Status"];
    const tankRows = audit.tanks.map((t: any) => [
      t.product,
      t.tank_index,
      t.capacity,
      t.manual_dip,
      t.auto_dip,
      t.delta,
      t.is_compliant ? "COMPLIANT" : "NON-COMPLIANT"
    ]);
    const wsTanks = XLSX.utils.aoa_to_sheet([tankHeaders, ...tankRows]);
    XLSX.utils.book_append_sheet(wb, wsTanks, "Tanks Calibration");
  }

  if (audit.statutory && audit.statutory.length > 0) {
    const statHeaders = ["Statutory Key", "Compliance Status", "Validity Date"];
    const statRows = audit.statutory.map((s: any) => [
      s.key_name,
      s.status_text,
      s.date_val || 'N/A'
    ]);
    const wsStat = XLSX.utils.aoa_to_sheet([statHeaders, ...statRows]);
    XLSX.utils.book_append_sheet(wb, wsStat, "Statutory Compliance");
  }

  XLSX.writeFile(wb, `${audit.ro_name}_${audit.cms_code}_Audit_Report.xlsx`);
}
