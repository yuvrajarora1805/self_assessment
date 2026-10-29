import { AuditFormData } from '@/types/audit';
import { auditQuestions } from '@/data/audit-questions';

export function buildAuditSubmissionPayload(formData: AuditFormData): any {
  let totalScore = 0;
  let maxPossible = 0;
  const segmentData: Record<string, { max: number; earned: number }> = {};
  const actionItems: string[] = [];
  const responses: any[] = [];

  for (const q of auditQuestions) {
    if (formData.hasCanopy === 'No' && q.segment.toUpperCase().includes('CANOPY')) continue;

    const selected = formData.answers[q.id];
    let earned = 0;
    if (!segmentData[q.segment]) segmentData[q.segment] = { max: 0, earned: 0 };

    if (selected && selected !== 'NA') {
      maxPossible += q.maxScore;
      segmentData[q.segment].max += q.maxScore;

      if ((q.negative && selected === 'No') || (!q.negative && selected === 'Yes')) {
        earned = q.maxScore;
      }

      totalScore += earned;
      segmentData[q.segment].earned += earned;

      if (earned < q.maxScore) {
        actionItems.push(`<strong>${q.segment}:</strong> ${q.text} (Recorded: ${selected})`);
      }
    }

    responses.push({
      questionId: q.id,
      segment: q.segment,
      questionText: q.text,
      response: selected || 'NA',
      earnedScore: earned,
      maxScore: selected === 'NA' ? 0 : q.maxScore
    });
  }

  // Tank non-compliances
  if (Array.isArray(formData.tanks)) {
    formData.tanks.forEach((t) => {
      if (!t.isCompliant) {
        actionItems.push(`<strong>Tank Calibration Issue:</strong> ${t.product} - TANK-${t.tankIndex || 1} is Non-Compliant (Delta: ${t.delta} mm)`);
      }
    });
  }

  // Statutory non-compliances
  const s = formData.statutory;
  if (s.cc_esd !== 'Yes') actionItems.push(`<strong>Statutory Non-Compliance:</strong> Provision of Min. 2 pts of ESD`);
  if (s.cc_petro !== 'Yes') actionItems.push(`<strong>Statutory Non-Compliance:</strong> Petroleum Storage License Displayed`);
  if (s.cc_dssr !== 'NO OVERWRITING') actionItems.push(`<strong>Statutory Non-Compliance:</strong> Daily Sales & Stock Register with No Overwriting`);
  if (s.cc_fa !== 'Yes') actionItems.push(`<strong>Statutory Non-Compliance:</strong> Fully Stocked First Aid Box Available`);
  if (s.cc_peso !== 'Yes') actionItems.push(`<strong>Statutory Non-Compliance:</strong> PESO Approved Spark Arrestors`);

  // Statutory Scoring
  const statutoryQuestions = [
    { key: s.cc_esd, score: 3, name: 'ESD Minimum 2 Points' },
    { key: s.cc_petro, score: 3, name: 'Petroleum Storage License' },
    { key: s.cc_earthing, score: 3, name: 'Electrical Earthing Certificate' },
    { key: s.cc_water, score: 2, name: 'Framed Water Certificate Displayed' },
    { key: s.cc_dssr, score: 2, name: 'Daily Sales & Stock Register' },
    { key: s.cc_fa, score: 2, name: 'First Aid Box Available' },
    { key: s.cc_peso, score: 2, name: 'PESO Approved Spark Arrestor' },
    { key: s.cc_fire, score: 3, name: 'Fire Extinguisher Certificate' },
    { key: s.cc_wm, score: 3, name: 'W&M Certificate Valid' }
  ];

  if (!segmentData['Statutory Compliance']) {
    segmentData['Statutory Compliance'] = { earned: 0, max: 0 };
  }

  statutoryQuestions.forEach((sq) => {
    const earned = sq.key === 'Yes' || sq.key === 'NO OVERWRITING' ? sq.score : 0;
    totalScore += earned;
    maxPossible += sq.score;
    segmentData['Statutory Compliance'].earned += earned;
    segmentData['Statutory Compliance'].max += sq.score;
  });

  // Tank scoring
  (formData.tanks || []).forEach((t: any) => {
    const earned = t.isCompliant ? 2 : 0;
    totalScore += earned;
    maxPossible += 2;
  });

  const percentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
  let grade = 'NEEDS ATTENTION';
  if (percentage >= 95) grade = 'EXCELLENT';
  else if (percentage >= 90) grade = 'VERY GOOD';
  else if (percentage >= 85) grade = 'GOOD';
  else if (percentage >= 75) grade = 'AVERAGE';

  // Build statutory list for DB
  const statutoryList: any[] = [
    { keyName: 'ESD Minimum 2 Points', statusText: s.cc_esd || 'No', dateVal: '', photoData: '' },
    { keyName: 'Petroleum Storage License', statusText: s.cc_petro || 'No', dateVal: '', photoData: '' },
    { keyName: 'Electrical Earthing Certificate', statusText: s.cc_earthing || 'Yes', dateVal: s.cc_earthing_date || '', photoData: formData.photos['cert_earthing'] || '' },
    { keyName: 'Framed Water Certificate Displayed', statusText: s.cc_water || 'Yes', dateVal: s.cc_water_date || '', photoData: formData.photos['cert_water'] || '' },
    { keyName: 'Daily Sales & Stock Register', statusText: s.cc_dssr || 'No', dateVal: '', photoData: '' },
    { keyName: 'First Aid Box Available', statusText: s.cc_fa || 'No', dateVal: '', photoData: '' },
    { keyName: 'PESO Approved Spark Arrestor', statusText: s.cc_peso || 'No', dateVal: '', photoData: '' },
    { keyName: 'Fire Extinguisher Certificate', statusText: s.cc_fire || 'Yes', dateVal: s.cc_fire_date || '', photoData: formData.photos['cert_fire'] || '' },
    { keyName: 'W&M Certificate Valid', statusText: s.cc_wm || 'Yes', dateVal: '', photoData: '' }
  ];

  const duCount = Number(s.wm_du_count) || 2;
  for (let i = 1; i <= duCount; i++) {
    statutoryList.push({
      keyName: `W&M DU Certificate - ${i}`,
      statusText: 'Yes',
      dateVal: s.wm_du_dates?.[i] || '',
      photoData: formData.photos[`cert_wm_du_${i}`] || ''
    });
  }
  statutoryList.push({
    keyName: '5 Ltr Jar Certificate',
    statusText: 'Yes',
    dateVal: s.wm_jar_date || '',
    photoData: formData.photos['cert_wm_jar'] || ''
  });

  // Photos
  const photosList: any[] = [];
  Object.entries(formData.photos).forEach(([k, photoData], idx) => {
    if (photoData && !k.startsWith('cert_') && !k.startsWith('tank_')) {
      const customTitle = formData.customPhotoNames?.[Number(k)] || (formData.customPhotoNames as any)?.[k];
      photosList.push({
        index: idx,
        title: customTitle || `Photo ${k}`,
        data: photoData
      });
    }
  });

  // Tanks
  const tanksList = (formData.tanks || []).map((t: any) => ({
    product: t.product,
    index: t.tankIndex || 1,
    capacity: t.capacityKl ? `${t.capacityKl} KL` : '',
    manualDip: t.manualDip,
    autoDip: t.autoDip,
    delta: t.delta,
    isCompliant: t.isCompliant,
    photoData: t.photoData || ''
  }));

  return {
    ...formData,
    totalScore,
    maxPossible,
    percentage,
    grade,
    actionItems,
    segmentSummary: segmentData,
    responses,
    statutory: statutoryList,
    photos: photosList,
    tanks: tanksList
  };
}
