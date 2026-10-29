import fs from 'fs';
import path from 'path';

/**
 * Saves a base64 image data URL to the public/uploads directory.
 * If data is already a relative URL or empty, returns it as-is.
 * 
 * @param base64Data - "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 * @param subPath - "audits/2026-10/10842/AUD_12345/photos"
 * @param fileName - "photo_1.jpg"
 * @returns Relative web path e.g. "/uploads/audits/2026-10/10842/AUD_12345/photos/photo_1.jpg"
 */
export function saveBase64Image(base64Data: string, subPath: string, fileName: string): string {
  if (!base64Data || typeof base64Data !== 'string') {
    return '';
  }

  // If it's already a saved URL or not a base64 data string, return as-is
  if (base64Data.startsWith('/uploads/') || base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
    return base64Data;
  }

  // Extract mime and raw base64 data
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let buffer: Buffer;
  let ext = 'jpg';

  if (matches && matches.length === 3) {
    const mime = matches[1];
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    // Attempt raw base64 decode if prefix is missing
    try {
      buffer = Buffer.from(base64Data, 'base64');
    } catch (e) {
      return '';
    }
  }

  // Ensure fileName has proper extension
  const safeFileName = fileName.endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subPath);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, safeFileName);
  fs.writeFileSync(filePath, buffer);

  // Return public web accessible path
  return `/uploads/${subPath}/${safeFileName}`;
}
