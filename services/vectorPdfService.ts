import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { CanvasElement, ElementType, CertificateProject, CertificateSide, Side } from '../types';

// In-Memory cache for TTF font base64 strings so fetch is only executed once
const fontCache: Record<string, string> = {};

/**
 * Converts a hex color string (#ffffff or #fff) to RGB [r, g, b]
 */
export const hexToRgb = (hex: string): [number, number, number] => {
  if (!hex) return [0, 0, 0];
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

/**
 * Loads a font from public/fonts/ and converts to base64 for jsPDF VFS
 */
const loadFontBase64 = async (fontFileName: string): Promise<string> => {
  if (fontCache[fontFileName]) return fontCache[fontFileName];
  try {
    const res = await fetch(`/fonts/${fontFileName}`);
    if (!res.ok) throw new Error(`Font fetch failed: ${fontFileName}`);
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    fontCache[fontFileName] = b64;
    return b64;
  } catch (err) {
    console.warn(`Could not load local font /fonts/${fontFileName}`, err);
    return '';
  }
};

/**
 * Registers Turkish-compatible Unicode TTF fonts into the jsPDF instance
 */
export const registerFontsInPdf = async (pdf: jsPDF): Promise<void> => {
  try {
    const [sansReg, sansBold, serifReg, serifBold] = await Promise.all([
      loadFontBase64('Sans-Regular.ttf'),
      loadFontBase64('Sans-Bold.ttf'),
      loadFontBase64('Serif-Regular.ttf'),
      loadFontBase64('Serif-Bold.ttf'),
    ]);

    if (sansReg) {
      pdf.addFileToVFS('Sans-Regular.ttf', sansReg);
      pdf.addFont('Sans-Regular.ttf', 'ProSans', 'normal');
    }
    if (sansBold) {
      pdf.addFileToVFS('Sans-Bold.ttf', sansBold);
      pdf.addFont('Sans-Bold.ttf', 'ProSans', 'bold');
    }
    if (serifReg) {
      pdf.addFileToVFS('Serif-Regular.ttf', serifReg);
      pdf.addFont('Serif-Regular.ttf', 'ProSerif', 'normal');
    }
    if (serifBold) {
      pdf.addFileToVFS('Serif-Bold.ttf', serifBold);
      pdf.addFont('Serif-Bold.ttf', 'ProSerif', 'bold');
    }
  } catch (err) {
    console.error('Error registering fonts in jsPDF:', err);
  }
};

/**
 * Renders an SVG string to a high-DPI transparent PNG data URL for sharp PDF embedding
 */
export const svgStringToPngDataUrl = async (svgString: string, width: number, height: number): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = window.URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // 2x supersampling for crisp vectors on 300+ DPI PDF export
        canvas.width = Math.max(1, Math.round(width * 2));
        canvas.height = Math.max(1, Math.round(height * 2));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
        window.URL.revokeObjectURL(blobURL);
      };
      img.onerror = () => {
        window.URL.revokeObjectURL(blobURL);
        resolve('');
      };
      img.src = blobURL;
    } catch {
      resolve('');
    }
  });
};

/**
 * SVG Generator for Certificate Frames and Decorative Borders
 */
export const getBorderSvg = (
  style: string = 'classic_gold',
  width: number,
  height: number,
  color: string = '#d97706'
): string => {
  const w = Math.max(width, 100);
  const h = Math.max(height, 100);

  if (style === 'tricolor_lines' || style === 'cankaya_tri_color') {
    return `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <!-- 1. Dış İnce Çizgi: Logo Lacivert/Koyu Mavi (#27617e) -->
        <rect x="20" y="20" width="${w - 40}" height="${h - 40}" fill="none" stroke="#27617e" stroke-width="2.5" rx="10" />
        <!-- 2. Orta İnce Çizgi: Logo Kırmızı (#ca474a) -->
        <rect x="29" y="29" width="${w - 58}" height="${h - 58}" fill="none" stroke="#ca474a" stroke-width="2" rx="7" />
        <!-- 3. İç İnce Çizgi: Logo Yeşil (#2e8542) -->
        <rect x="37" y="37" width="${w - 74}" height="${h - 74}" fill="none" stroke="#2e8542" stroke-width="2" rx="4" />
      </svg>
    `;
  }

  if (style === 'modern_double') {
    return `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="${w - 40}" height="${h - 40}" fill="none" stroke="${color}" stroke-width="4" rx="8" />
        <rect x="32" y="32" width="${w - 64}" height="${h - 64}" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="12 6" rx="4" />
        <circle cx="20" cy="20" r="8" fill="${color}" />
        <circle cx="${w - 20}" cy="20" r="8" fill="${color}" />
        <circle cx="20" cy="${h - 20}" r="8" fill="${color}" />
        <circle cx="${w - 20}" cy="${h - 20}" r="8" fill="${color}" />
      </svg>
    `;
  }

  if (style === 'geometric_isg') {
    return `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="15" width="${w - 30}" height="${h - 30}" fill="none" stroke="${color}" stroke-width="6" />
        <rect x="28" y="28" width="${w - 56}" height="${h - 56}" fill="none" stroke="#0f172a" stroke-width="2" />
        <!-- Corner industrial accents -->
        <polygon points="15,15 75,15 15,75" fill="${color}" />
        <polygon points="${w - 15},15 ${w - 75},15 ${w - 15},75" fill="${color}" />
        <polygon points="15,${h - 15} 75,${h - 15} 15,${h - 75}" fill="${color}" />
        <polygon points="${w - 15},${h - 15} ${w - 75},${h - 15} ${w - 15},${h - 75}" fill="${color}" />
      </svg>
    `;
  }

  if (style === 'corner_ornament') {
    return `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="30" width="${w - 60}" height="${h - 60}" fill="none" stroke="${color}" stroke-width="2" />
        <!-- Top-Left Ornament -->
        <path d="M 15 65 L 15 15 L 65 15 M 25 25 L 25 50 M 25 25 L 50 25 M 25 25 L 10 10" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" />
        <!-- Top-Right Ornament -->
        <path d="M ${w - 15} 65 L ${w - 15} 15 L ${w - 65} 15 M ${w - 25} 25 L ${w - 25} 50 M ${w - 25} 25 L ${w - 50} 25 M ${w - 25} 25 L ${w - 10} 10" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" />
        <!-- Bottom-Left Ornament -->
        <path d="M 15 ${h - 65} L 15 ${h - 15} L 65 ${h - 15} M 25 ${h - 25} L 25 ${h - 50} M 25 ${h - 25} L 50 ${h - 25} M 25 ${h - 25} L 10 ${h - 10}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" />
        <!-- Bottom-Right Ornament -->
        <path d="M ${w - 15} ${h - 65} L ${w - 15} ${h - 15} L ${w - 65} ${h - 15} M ${w - 25} ${h - 25} L ${w - 25} ${h - 50} M ${w - 25} ${h - 25} L ${w - 50} ${h - 25} M ${w - 25} ${h - 25} L ${w - 10} ${h - 10}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" />
      </svg>
    `;
  }

  // Default: classic_gold royal double border
  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#d97706;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#fbbf24;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#b45309;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Outer Solid Border -->
      <rect x="25" y="25" width="${w - 50}" height="${h - 50}" fill="none" stroke="url(#goldGrad)" stroke-width="6" rx="12" />
      <!-- Inner Thin Line -->
      <rect x="38" y="38" width="${w - 76}" height="${h - 76}" fill="none" stroke="url(#goldGrad)" stroke-width="1.8" rx="8" />
      <!-- Corner Flourishes -->
      <circle cx="25" cy="25" r="10" fill="url(#goldGrad)" />
      <circle cx="${w - 25}" cy="25" r="10" fill="url(#goldGrad)" />
      <circle cx="25" cy="${h - 25}" r="10" fill="url(#goldGrad)" />
      <circle cx="${w - 25}" cy="${h - 25}" r="10" fill="url(#goldGrad)" />
    </svg>
  `;
};

/**
 * SVG Generator for Official Seals, Approval Stamps, and Achievement Badges
 */
export const getBadgeSvg = (
  style: string = 'isg_approved',
  size: number = 200,
  color: string = '#d97706'
): string => {
  const s = Math.max(size, 80);
  const cx = s / 2;
  const cy = s / 2;
  const r = (s / 2) - 10;

  if (style === 'achievement_star') {
    return `
      <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="badgeGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fbbf24" />
            <stop offset="100%" style="stop-color:#b45309" />
          </linearGradient>
        </defs>
        <!-- Ribbons hanging down -->
        <polygon points="${cx - 30},${cy + 20} ${cx - 50},${s - 5} ${cx - 20},${s - 25} ${cx - 5},${s - 5} ${cx},${cy + 30}" fill="#991b1b" />
        <polygon points="${cx + 30},${cy + 20} ${cx + 50},${s - 5} ${cx + 20},${s - 25} ${cx + 5},${s - 5} ${cx},${cy + 30}" fill="#b91c1c" />
        <!-- Medal Outer circle -->
        <circle cx="${cx}" cy="${cy}" r="${r - 10}" fill="url(#badgeGold)" stroke="#fef3c7" stroke-width="3" />
        <circle cx="${cx}" cy="${cy}" r="${r - 20}" fill="none" stroke="#fef3c7" stroke-width="1.5" stroke-dasharray="4 3" />
        <!-- Star Icon -->
        <polygon points="${cx},${cy - 25} ${cx + 7},${cy - 8} ${cx + 25},${cy - 8} ${cx + 11},${cy + 4} ${cx + 16},${cy + 22} ${cx},${cy + 11} ${cx - 16},${cy + 22} ${cx - 11},${cy + 4} ${cx - 25},${cy - 8} ${cx - 7},${cy - 8}" fill="#ffffff" />
      </svg>
    `;
  }

  if (style === 'gold_seal') {
    return `
      <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
        <!-- 24-point Starburst Seal -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#d97706" />
        <circle cx="${cx}" cy="${cy}" r="${r - 8}" fill="#f59e0b" />
        <circle cx="${cx}" cy="${cy}" r="${r - 18}" fill="none" stroke="#fef3c7" stroke-width="2" />
        <circle cx="${cx}" cy="${cy}" r="${r - 24}" fill="#b45309" />
        <text x="${cx}" y="${cy - 6}" font-family="Arial, sans-serif" font-size="${Math.round(s * 0.08)}" font-weight="bold" fill="#ffffff" text-anchor="middle">RESMİ</text>
        <text x="${cx}" y="${cy + 14}" font-family="Arial, sans-serif" font-size="${Math.round(s * 0.08)}" font-weight="bold" fill="#ffffff" text-anchor="middle">ONAYLI</text>
      </svg>
    `;
  }

  // Default: isg_approved (Official ISG Seal)
  return `
    <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#b45309" />
          <stop offset="50%" style="stop-color:#f59e0b" />
          <stop offset="100%" style="stop-color:#b45309" />
        </linearGradient>
      </defs>
      <!-- Circular Ribbons -->
      <polygon points="${cx - 25},${cy + 25} ${cx - 40},${s} ${cx - 15},${s - 15} ${cx},${s} ${cx},${cy + 30}" fill="#1e3a8a" />
      <polygon points="${cx + 25},${cy + 25} ${cx + 40},${s} ${cx + 15},${s - 15} ${cx},${s} ${cx},${cy + 30}" fill="#2563eb" />
      <!-- Outer Stamp Circle -->
      <circle cx="${cx}" cy="${cy}" r="${r - 8}" fill="none" stroke="url(#sealGrad)" stroke-width="4" />
      <circle cx="${cx}" cy="${cy}" r="${r - 16}" fill="#0f172a" stroke="url(#sealGrad)" stroke-width="1.5" />
      <!-- Center Emblem: Shield & Check -->
      <path d="M ${cx} ${cy - 22} L ${cx + 18} ${cy - 12} L ${cx + 18} ${cy + 6} Q ${cx + 18} ${cy + 20} ${cx} ${cy + 26} Q ${cx - 18} ${cy + 20} ${cx - 18} ${cy + 6} L ${cx - 18} ${cy - 12} Z" fill="url(#sealGrad)" />
      <!-- White Checkmark in shield -->
      <path d="M ${cx - 7} ${cy + 4} L ${cx - 2} ${cy + 9} L ${cx + 9} ${cy - 4}" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Outer Text Arc Placeholder -->
      <circle cx="${cx}" cy="${cy}" r="${r - 12}" fill="none" stroke="#fbbf24" stroke-width="0.8" stroke-dasharray="2 3" />
    </svg>
  `;
};

/**
 * Text formatter that replaces template tokens with actual certificate values
 */
export const formatTemplateContent = (text: string, values: Record<string, string>): string => {
  if (!text) return '';
  return text.replace(/\{([^}]+)\}/g, (match, key) => {
    const cleanKey = key.trim();
    // Case-insensitive & normalized search
    const val = values[cleanKey] || 
                values[cleanKey.toLowerCase()] || 
                values[cleanKey.toUpperCase()] || 
                values[cleanKey.replace(/\s+/g, '_')] || 
                '';
    return val || match;
  });
};

/**
 * Turkish-aware key normalizer (converts İ->i, I->ı, trims whitespace, lowercase)
 */
export const normalizeKey = (key: any): string => {
  if (!key || typeof key !== 'string') return '';
  return key
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ş/g, 'ş')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .toLowerCase();
};

/**
 * Resolves a field value from activeValues using exact, normalized, lowercase, or ID match
 */
export const resolveFieldValue = (
  el: CanvasElement,
  activeValues: Record<string, string>
): string => {
  if (!activeValues) return el.content || '';
  
  const rawLabel = (el.label || '').trim();
  const normLabel = normalizeKey(rawLabel);
  const id = (el.id || '').trim();

  // 1. Exact raw label match
  if (rawLabel && activeValues[rawLabel] !== undefined && activeValues[rawLabel] !== '') {
    return activeValues[rawLabel];
  }
  // 2. Normalized TR-lowercase label match
  if (normLabel && activeValues[normLabel] !== undefined && activeValues[normLabel] !== '') {
    return activeValues[normLabel];
  }
  // 3. Element ID match
  if (id && activeValues[id] !== undefined && activeValues[id] !== '') {
    return activeValues[id];
  }
  // 4. Case-insensitive scan across activeValues
  for (const [k, v] of Object.entries(activeValues)) {
    if (v !== undefined && v !== '' && normalizeKey(k) === normLabel) {
      return v;
    }
  }
  return el.content || '';
};

/**
 * Robust Signature URL Resolver that searches activeValues, normalized keys, and element content
 */
export const resolveSignatureUrl = (
  el: CanvasElement,
  activeValues: Record<string, string>
): string => {
  if (!activeValues) return el.content || '';

  const rawLabel = (el.label || '').trim();
  const normLabel = normalizeKey(rawLabel);
  const id = (el.id || '').trim();

  let candidate = '';

  // 1. Direct label match
  if (rawLabel && activeValues[rawLabel]) {
    candidate = activeValues[rawLabel];
  }
  // 2. Normalized key match
  else if (normLabel && activeValues[normLabel]) {
    candidate = activeValues[normLabel];
  }
  // 3. Element ID match
  else if (id && activeValues[id]) {
    candidate = activeValues[id];
  }
  // 4. Exact normalized scan
  else {
    for (const [k, v] of Object.entries(activeValues)) {
      if (v && normalizeKey(k) === normLabel) {
        candidate = v;
        break;
      }
    }
  }

  // 5. Loose partial match (e.g. "UZMAN" vs "İSG Uzmanı" or "DOKTOR" vs "İşyeri Hekimi / Doktor")
  if (!candidate && normLabel) {
    for (const [k, v] of Object.entries(activeValues)) {
      if (v && typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('http') || v.startsWith('blob:'))) {
        const kn = normalizeKey(k);
        if (kn.includes(normLabel) || normLabel.includes(kn)) {
          candidate = v;
          break;
        }
      }
    }
  }

  // 6. Fallback to element's embedded content
  if (!candidate && el.content) {
    candidate = el.content;
  }

  return candidate;
};

/**
 * Masks 11-digit Turkish National ID (TCKN) for privacy: 12*******01
 */
export const maskTckn = (tc: string): string => {
  if (!tc) return '';
  const clean = String(tc).replace(/\s+/g, '').trim();
  if (clean.length === 11) {
    return clean.substring(0, 2) + '*******' + clean.substring(9, 11);
  }
  return clean;
};

/**
 * Renders a single canvas element directly into the jsPDF instance as native vector or high-DPI image
 */
export const renderElementToPdf = async (
  pdf: jsPDF,
  el: CanvasElement,
  activeValues: Record<string, string>
): Promise<void> => {
  if (!el) return;

  // 1. BORDER (Decorative Certificate Frames)
  if (el.type === ElementType.BORDER) {
    const borderSvg = getBorderSvg(el.borderStyle || 'classic_gold', el.width, el.height, el.borderColor || '#d97706');
    const pngData = await svgStringToPngDataUrl(borderSvg, el.width, el.height);
    if (pngData) {
      pdf.addImage(pngData, 'PNG', el.x, el.y, el.width, el.height);
    }
    return;
  }

  // 2. BADGE (Official Seals & Medals)
  if (el.type === ElementType.BADGE) {
    const badgeSvg = getBadgeSvg(el.badgeStyle || 'isg_approved', el.width, el.color || '#d97706');
    const pngData = await svgStringToPngDataUrl(badgeSvg, el.width, el.height);
    if (pngData) {
      pdf.addImage(pngData, 'PNG', el.x, el.y, el.width, el.height);
    }
    return;
  }

  // 3. SHAPE (Native Vector Rectangle, Line, Divider, Circle)
  if (el.type === ElementType.SHAPE) {
    const [fillR, fillG, fillB] = hexToRgb(el.fillColor || '#ffffff');
    const [drawR, drawG, drawB] = hexToRgb(el.borderColor || '#d97706');
    const shape = el.shapeType || 'rectangle';

    if (shape === 'line' || shape === 'divider') {
      pdf.setDrawColor(drawR, drawG, drawB);
      pdf.setLineWidth(el.borderWidth || 3);
      pdf.line(el.x, el.y + (el.height / 2), el.x + el.width, el.y + (el.height / 2));
      return;
    }

    pdf.setFillColor(fillR, fillG, fillB);
    pdf.setDrawColor(drawR, drawG, drawB);
    pdf.setLineWidth(el.borderWidth || 2);
    const style = (el.fillColor && el.borderColor) ? 'FD' : (el.fillColor ? 'F' : 'S');

    if (shape === 'circle') {
      const r = Math.min(el.width, el.height) / 2;
      pdf.circle(el.x + r, el.y + r, r, style);
    } else {
      // Rounded or square rectangle
      const rx = el.borderWidth ? 8 : 0;
      pdf.roundedRect(el.x, el.y, el.width, el.height, rx, rx, style);
    }
    return;
  }

  // 4. SIGNATURE (Digital or Uploaded PNG Signature)
  if (el.type === ElementType.SIGNATURE) {
    const sigUrl = resolveSignatureUrl(el, activeValues);

    if (sigUrl && (sigUrl.startsWith('data:image/') || sigUrl.startsWith('http') || sigUrl.startsWith('blob:'))) {
      try {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            try {
              pdf.addImage(img, 'PNG', el.x, el.y, el.width, el.height);
            } catch (err) {
              console.warn('Error adding signature PNG to PDF:', err);
            }
            resolve();
          };
          img.onerror = (e) => {
            console.warn('Signature image failed to load:', e);
            resolve();
          };
          img.src = sigUrl;
        });
      } catch (err) {
        console.warn('Error in signature rendering:', err);
      }
    }
    return;
  }

  // 5. IMAGE / LOGO / VECTOR SVG GRAPHIC
  if (el.type === ElementType.IMAGE) {
    if (el.content) {
      try {
        let imgUrl = el.content;
        // If it's an SVG data URL, render it to a sharp 2x supersampled transparent PNG for jsPDF
        if (imgUrl.startsWith('data:image/svg+xml')) {
          const pngUrl = await new Promise<string>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = Math.max(1, Math.round(el.width * 2));
              canvas.height = Math.max(1, Math.round(el.height * 2));
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
              } else {
                resolve('');
              }
            };
            img.onerror = () => resolve('');
            img.src = imgUrl;
          });
          if (pngUrl) imgUrl = pngUrl;
        }

        if (imgUrl.startsWith('data:image/')) {
          const isPng = imgUrl.includes('png') || imgUrl.includes('svg');
          pdf.addImage(imgUrl, isPng ? 'PNG' : 'JPEG', el.x, el.y, el.width, el.height);
        }
      } catch (err) {
        console.warn('Error adding image to PDF:', err);
      }
    }
    return;
  }

  // 6. QR CODE
  if (el.type === ElementType.QRCODE) {
    const rawQr = formatTemplateContent(el.content, activeValues) || 'https://procertify.app';
    try {
      const qrDataUrl = await QRCode.toDataURL(rawQr, {
        width: Math.max(el.width * 2, 200),
        margin: 1,
        color: { dark: el.color || '#000000', light: '#00000000' }
      });
      pdf.addImage(qrDataUrl, 'PNG', el.x, el.y, el.width, el.height);
    } catch (e) {
      console.error('Error generating QR code for PDF:', e);
    }
    return;
  }

  // 7. CHOICE BOX (Yes/No Checkbox with Vector Tick)
  if (el.type === ElementType.CHOICE_BOX) {
    const opt1 = el.options?.[0] || 'Evet';
    const chosenVal = resolveFieldValue(el, activeValues) || el.content || opt1;
    const isOpt1 = chosenVal === opt1;

    const tickX = isOpt1 ? el.x : (el.secondaryX || el.x + 100);
    const tickY = isOpt1 ? el.y : (el.secondaryY || el.y);

    // Render vector checkmark box and tick
    const [cr, cg, cb] = hexToRgb(el.color || '#000000');
    pdf.setDrawColor(cr, cg, cb);
    pdf.setLineWidth(2);
    pdf.rect(tickX, tickY, el.width, el.height, 'S');

    // Vector Checkmark line
    pdf.setLineWidth(3);
    const pad = el.width * 0.2;
    pdf.line(tickX + pad, tickY + (el.height * 0.5), tickX + (el.width * 0.45), tickY + el.height - pad);
    pdf.line(tickX + (el.width * 0.45), tickY + el.height - pad, tickX + el.width - pad, tickY + pad);
    return;
  }

  // 8. NATIVE VECTOR TEXT (TEXT, DATE, COMPANY, TCKN, DROPDOWN)
  let text = '';
  if (el.type === ElementType.TEXT) {
    text = formatTemplateContent(el.content, activeValues);
  } else if (el.type === ElementType.DATE) {
    const rawVal = resolveFieldValue(el, activeValues);
    text = rawVal || formatTemplateContent(el.content, activeValues);
  } else {
    text = resolveFieldValue(el, activeValues);
  }

  if (el.type === ElementType.TCKN) {
    text = maskTckn(text);
  }

  if (!text) return;

  // Determine font family: Serif vs Sans
  const fam = (el.fontFamily || '').toLowerCase();
  const isSerif = fam.includes('serif') || fam.includes('playfair') || fam.includes('cinzel') || fam.includes('merriweather') || fam.includes('baskerville');
  const isBold = Number(el.fontWeight) >= 600 || el.fontWeight === 'bold';
  const fontName = isSerif ? 'ProSerif' : 'ProSans';
  const fontStyle = isBold ? 'bold' : 'normal';

  pdf.setFont(fontName, fontStyle);
  pdf.setFontSize(el.fontSize || 30);

  const [textR, textG, textB] = hexToRgb(el.color || '#000000');
  pdf.setTextColor(textR, textG, textB);

  const align = el.textAlign || 'center';
  let startX = el.x;
  if (align === 'center') startX = el.x + (el.width / 2);
  if (align === 'right') startX = el.x + el.width;

  // Split lines to fit el.width accurately
  const lines = pdf.splitTextToSize(text, el.width);
  pdf.text(lines, startX, el.y, {
    align: align as any,
    baseline: 'top',
    lineHeightFactor: 1.2
  });
};

/**
 * Main Native Vector & Text PDF Generator for a Project Side
 */

/**
 * Draws precision offset-printing crop marks (kesim çizgileri) and bleed registration marks
 */
export const drawCropMarks = (pdf: jsPDF, width: number, height: number, bleed = 30): void => {
  pdf.saveGraphicsState();
  pdf.setDrawColor(30, 41, 59); // Slate-800
  pdf.setLineWidth(1);

  const markLen = 25;
  const offset = 8;

  // Top-Left Corner
  pdf.line(offset, 0, offset + markLen, 0); // Horizontal
  pdf.line(0, offset, 0, offset + markLen); // Vertical

  // Top-Right Corner
  pdf.line(width - offset, 0, width - offset - markLen, 0);
  pdf.line(width, offset, width, offset + markLen);

  // Bottom-Left Corner
  pdf.line(offset, height, offset + markLen, height);
  pdf.line(0, height - offset, 0, height - offset - markLen);

  // Bottom-Right Corner
  pdf.line(width - offset, height, width - offset - markLen, height);
  pdf.line(width, height - offset, width, height - offset - markLen);

  // Center registration tick marks (Middle of each edge)
  pdf.line(width / 2, 0, width / 2, markLen / 2);
  pdf.line(width / 2, height, width / 2, height - (markLen / 2));
  pdf.line(0, height / 2, markLen / 2, height / 2);
  pdf.line(width, height / 2, width - (markLen / 2), height / 2);

  // Slug info text
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`ProCertify Matbaa Standardı - Kesim Çizgileri (Crop Marks) • Boyut: ${width}x${height}px`, 20, 15);

  pdf.restoreGraphicsState();
};

/**
 * Draws a clean dashed scissor cut line for N-Up multi-certificate printing
 */
export const drawCutLine = (pdf: jsPDF, x1: number, y1: number, x2: number, y2: number, label = 'KESİM ÇİZGİSİ'): void => {
  pdf.saveGraphicsState();
  pdf.setDrawColor(148, 163, 184); // Slate-400
  pdf.setLineWidth(1);
  pdf.setLineDashPattern([6, 4], 0);
  pdf.line(x1, y1, x2, y2);
  
  // Cut line label with scissors icon
  pdf.setLineDashPattern([], 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  pdf.text(`✂ ${label}`, midX - 35, midY - 3);
  pdf.restoreGraphicsState();
};

export const renderSideToNativePDF = async (
  pdf: jsPDF,
  proj: CertificateProject,
  sideData: CertificateSide,
  activeValues: Record<string, string>,
  options?: { cropMarks?: boolean }
): Promise<void> => {
  if (!sideData) return;

  // 1. Draw Background
  if (sideData.bgUrl && sideData.bgUrl.startsWith('data:image/')) {
    try {
      const isPng = sideData.bgUrl.includes('png');
      pdf.addImage(sideData.bgUrl, isPng ? 'PNG' : 'JPEG', 0, 0, proj.width, proj.height);
    } catch (e) {
      console.warn('Error adding background image to PDF:', e);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, proj.width, proj.height, 'F');
    }
  } else {
    // Crisp white default canvas
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, proj.width, proj.height, 'F');
  }

  // 2. Sort elements so borders & shapes render first (background layer), then text & badges on top
  const sorted = [...sideData.elements].sort((a, b) => {
    const priority = (type: ElementType) => {
      if (type === ElementType.BORDER) return 0;
      if (type === ElementType.SHAPE) return 1;
      if (type === ElementType.IMAGE) return 2;
      if (type === ElementType.BADGE) return 3;
      if (type === ElementType.SIGNATURE) return 4;
      return 5; // Text, QR, Date, Choice
    };
    return priority(a.type) - priority(b.type);
  });

  // 3. Render all elements natively
  for (const el of sorted) {
    await renderElementToPdf(pdf, el, activeValues);
  }

  // 4. Draw optional offset crop marks for professional print shops
  if (options?.cropMarks) {
    drawCropMarks(pdf, proj.width, proj.height);
  }
};

/**
 * Generates a fast, lightweight raster thumbnail (~40-60KB JPEG) of the certificate's front side
 * specifically for the verification database and dashboard previews, avoiding storing multi-megabyte images.
 */
export const generateProjectThumbnail = async (
  proj: CertificateProject,
  activeValues: Record<string, string>
): Promise<string> => {
  try {
    const thumbWidth = 800;
    const thumbHeight = Math.max(100, Math.round((proj.height / proj.width) * thumbWidth));
    const canvas = document.createElement('canvas');
    canvas.width = thumbWidth;
    canvas.height = thumbHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const scale = thumbWidth / proj.width;
    const frontSide = proj.front;

    // 1. Draw Background
    if (frontSide.bgUrl) {
      await new Promise<void>((resolve) => {
        const bgImg = new Image();
        bgImg.onload = () => {
          ctx.drawImage(bgImg, 0, 0, thumbWidth, thumbHeight);
          resolve();
        };
        bgImg.onerror = () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, thumbWidth, thumbHeight);
          resolve();
        };
        bgImg.src = frontSide.bgUrl;
      });
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, thumbWidth, thumbHeight);
    }

    // 2. Sort elements
    const sorted = [...frontSide.elements].sort((a, b) => {
      const p = (t: ElementType) => {
        if (t === ElementType.BORDER) return 0;
        if (t === ElementType.SHAPE) return 1;
        if (t === ElementType.IMAGE) return 2;
        if (t === ElementType.BADGE) return 3;
        if (t === ElementType.SIGNATURE) return 4;
        return 5;
      };
      return p(a.type) - p(b.type);
    });

    for (const el of sorted) {
      const ex = el.x * scale;
      const ey = el.y * scale;
      const ew = el.width * scale;
      const eh = el.height * scale;

      if (el.type === ElementType.BORDER) {
        const svgStr = getBorderSvg(el.borderStyle || 'classic_gold', el.width, el.height, el.borderColor || '#d97706');
        const pngUrl = await svgStringToPngDataUrl(svgStr, ew, eh);
        if (pngUrl) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => { ctx.drawImage(img, ex, ey, ew, eh); resolve(); };
            img.onerror = () => resolve();
            img.src = pngUrl;
          });
        }
      } else if (el.type === ElementType.BADGE) {
        const svgStr = getBadgeSvg(el.badgeStyle || 'isg_approved', el.width, el.color || '#d97706');
        const pngUrl = await svgStringToPngDataUrl(svgStr, ew, eh);
        if (pngUrl) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => { ctx.drawImage(img, ex, ey, ew, eh); resolve(); };
            img.onerror = () => resolve();
            img.src = pngUrl;
          });
        }
      } else if (el.type === ElementType.SHAPE) {
        ctx.save();
        if (el.shapeType === 'line' || el.shapeType === 'divider') {
          ctx.strokeStyle = el.borderColor || '#d97706';
          ctx.lineWidth = Math.max(1, (el.borderWidth || 2) * scale);
          ctx.beginPath();
          ctx.moveTo(ex, ey + eh / 2);
          ctx.lineTo(ex + ew, ey + eh / 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = el.fillColor || '#ffffff';
          ctx.fillRect(ex, ey, ew, eh);
          if (el.borderWidth && el.borderWidth > 0) {
            ctx.strokeStyle = el.borderColor || '#d97706';
            ctx.lineWidth = el.borderWidth * scale;
            ctx.strokeRect(ex, ey, ew, eh);
          }
        }
        ctx.restore();
      } else if (el.type === ElementType.IMAGE || el.type === ElementType.SIGNATURE) {
        let src = el.content;
        if (el.type === ElementType.SIGNATURE) {
          src = resolveSignatureUrl(el, activeValues);
        }
        if (src && (src.startsWith('data:image') || src.startsWith('http') || src.startsWith('blob:'))) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => { ctx.drawImage(img, ex, ey, ew, eh); resolve(); };
            img.onerror = () => resolve();
            img.src = src;
          });
        }
      } else if (el.type === ElementType.QRCODE) {
        let content = formatTemplateContent(el.content, activeValues);
        try {
          const qrData = await QRCode.toDataURL(content || 'https://example.com', {
            margin: 1,
            color: { dark: el.color || '#000000', light: '#00000000' }
          });
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => { ctx.drawImage(img, ex, ey, ew, eh); resolve(); };
            img.onerror = () => resolve();
            img.src = qrData;
          });
        } catch {}
      } else {
        // Text, Date, Company, TCKN, Dropdown
        let text = '';
        if (el.type === ElementType.TEXT) {
          text = formatTemplateContent(el.content, activeValues);
        } else if (el.type === ElementType.DATE) {
          const rawVal = resolveFieldValue(el, activeValues);
          text = rawVal || formatTemplateContent(el.content, activeValues);
        } else {
          text = resolveFieldValue(el, activeValues);
        }
        if (el.type === ElementType.TCKN) {
          text = maskTckn(text);
        }
        if (text) {
          ctx.save();
          const fSize = Math.max(8, (el.fontSize || 30) * scale);
          const fam = (el.fontFamily || '').toLowerCase().includes('serif') ? 'Times New Roman, serif' : 'Arial, sans-serif';
          const weight = Number(el.fontWeight) >= 600 ? 'bold' : 'normal';
          const style = el.fontStyle === 'italic' ? 'italic' : 'normal';
          ctx.font = `${style} ${weight} ${fSize}px ${fam}`;
          ctx.fillStyle = el.color || '#000000';
          const align = el.textAlign || 'center';
          ctx.textAlign = align as CanvasTextAlign;
          ctx.textBaseline = 'top';

          let sx = ex;
          if (align === 'center') sx = ex + (ew / 2);
          if (align === 'right') sx = ex + ew;

          ctx.fillText(text, sx, ey);
          ctx.restore();
        }
      }
    }

    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (err) {
    console.error('Thumbnail generation error:', err);
    return '';
  }
};
