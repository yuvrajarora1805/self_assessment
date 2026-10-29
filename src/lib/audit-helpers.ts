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
