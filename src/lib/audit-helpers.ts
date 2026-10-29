import { AuditFormData } from '@/types/audit';

export function saveLocalDraft(cms: string, data: AuditFormData) {
  try {
    localStorage.setItem(`draft_${cms}`, JSON.stringify(data));
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      try {
        const { photos, ...leanData } = data;
        localStorage.setItem(`draft_${cms}`, JSON.stringify({ ...leanData, photos: {} }));
      } catch (inner) {
        console.warn('LocalStorage quota reached; draft is saved on server');
      }
    }
  }
}

export async function watermarkAndCompressImage(
  file: File,
  title: string,
  gpsCoords: string,
  gpsAddress: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context unavailable'));

        const maxW = 960;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Watermark Banner
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        const bannerHeight = 65;
        ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        const now = new Date().toLocaleString('en-IN');
        ctx.fillText(`📍 GPS: ${gpsCoords || 'STAMPED'} | ⏰ ${now}`, 15, canvas.height - 40);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#93c5fd';
        const addrText = (gpsAddress || 'RETAIL OUTLET LOCATION').substring(0, 110);
        ctx.fillText(`REPLACEMENT PHOTO: ${title} • ${addrText}`, 15, canvas.height - 18);

        resolve(canvas.toDataURL('image/jpeg', 0.70));
      };
      img.onerror = () => reject(new Error('Image decode error'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

export interface MonthlyCycleInfo {
  auditMonth: string;         // 'YYYY-MM'
  monthName: string;          // e.g. 'October 2026'
  dueDay: number;             // 25
  dueDateStr: string;         // '25th Oct 2026'
  daysRemaining: number;      // Days left until 25th (negative if past)
  isOverdue: boolean;         // True if today > 25th and not submitted
  isGracePeriod: boolean;     // 26th through month end
  cycleStatus: 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE' | 'GRACE_PERIOD';
  badgeText: string;
}

export function getMonthlyCycleInfo(date: Date = new Date()): MonthlyCycleInfo {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const currentDay = date.getDate();
  const auditMonth = `${year}-${String(month + 1).padStart(2, '0')}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = `${monthNames[month]} ${year}`;

  const dueDay = 25;
  const dueDateStr = `${dueDay}th ${monthShort[month]} ${year}`;
  const daysRemaining = dueDay - currentDay;

  const isGracePeriod = currentDay > 25;
  const isOverdue = currentDay > 25;

  let cycleStatus: MonthlyCycleInfo['cycleStatus'] = 'ON_TRACK';
  let badgeText = `${daysRemaining} days left (Due ${dueDay}th)`;

  if (currentDay > 25) {
    cycleStatus = 'OVERDUE';
    badgeText = `Overdue (Due date ${dueDay}th passed)`;
  } else if (daysRemaining <= 5) {
    cycleStatus = 'DUE_SOON';
    badgeText = `Due in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} (${dueDay}th)`;
  }

  return {
    auditMonth,
    monthName,
    dueDay,
    dueDateStr,
    daysRemaining,
    isOverdue,
    isGracePeriod,
    cycleStatus,
    badgeText
  };
}
