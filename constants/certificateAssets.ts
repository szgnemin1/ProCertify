/**
 * ProCertify Canva-style Built-in Vector Asset Catalog
 * Contains 30+ handcrafted, high-DPI resolution-independent SVG assets.
 */

export interface LibraryAsset {
  id: string;
  name: string;
  category: 'seal' | 'border' | 'isg' | 'ribbon' | 'ornament';
  categoryLabel: string;
  tags: string[];
  defaultWidth: number;
  defaultHeight: number;
  svg: string;
}

export const svgToDataUrl = (svg: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

export const CERTIFICATE_LIBRARY_ASSETS: LibraryAsset[] = [
  // ==========================================
  // 1. MÜHÜRLER & DAMGALAR (SEALS & BADGES)
  // ==========================================
  {
    id: 'seal-isg-approved',
    name: 'İSG Onaylı Resmi Güvenlik Damgası',
    category: 'seal',
    categoryLabel: 'Mühür & Damgalar',
    tags: ['mühür', 'damga', 'isg', 'onay', 'güvenlik', 'kalkan', 'resmi'],
    defaultWidth: 220,
    defaultHeight: 220,
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldG1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b45309" />
          <stop offset="50%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#78350f" />
        </linearGradient>
      </defs>
      <polygon points="75,125 60,195 85,180 100,195 100,130" fill="#1e3a8a" />
      <polygon points="125,125 140,195 115,180 100,195 100,130" fill="#2563eb" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="url(#goldG1)" stroke-width="5" />
      <circle cx="100" cy="100" r="82" fill="#0f172a" stroke="url(#goldG1)" stroke-width="2" />
      <circle cx="100" cy="100" r="76" fill="none" stroke="#fbbf24" stroke-width="1.2" stroke-dasharray="3 3" />
      <path d="M 100 65 L 124 76 L 124 98 Q 124 122 100 132 Q 76 122 76 98 L 76 76 Z" fill="url(#goldG1)" />
      <path d="M 91 97 L 97 103 L 111 88" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <text x="100" y="55" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#fbbf24" text-anchor="middle" letter-spacing="2">İSG ONAYLI</text>
      <text x="100" y="148" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#94a3b8" text-anchor="middle" letter-spacing="1">RESMİ SERTİFİKA</text>
    </svg>`
  },
  {
    id: 'seal-gold-starburst',
    name: '24 Köşeli Altın Kabartma Başarı Mührü',
    category: 'seal',
    categoryLabel: 'Mühür & Damgalar',
    tags: ['altın', 'kabartma', 'başarı', 'mühür', 'damga', 'rozet'],
    defaultWidth: 220,
    defaultHeight: 220,
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldG2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#d97706" />
          <stop offset="50%" stop-color="#fef08a" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="#d97706" />
      <circle cx="100" cy="100" r="84" fill="url(#goldG2)" />
      <circle cx="100" cy="100" r="74" fill="none" stroke="#78350f" stroke-width="2.5" />
      <circle cx="100" cy="100" r="68" fill="#92400e" />
      <text x="100" y="88" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="3">ÜSTÜN</text>
      <text x="100" y="112" font-family="Georgia, serif" font-size="16" font-weight="bold" fill="#fef08a" text-anchor="middle" letter-spacing="2">BAŞARI</text>
      <text x="100" y="128" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#fde68a" text-anchor="middle" letter-spacing="1">★ ★ ★</text>
    </svg>`
  },
  {
    id: 'seal-iso-quality',
    name: 'TS EN ISO 45001 İSG Kalite Mührü',
    category: 'seal',
    categoryLabel: 'Mühür & Damgalar',
    tags: ['iso', 'kalite', '45001', 'isg', 'standart', 'akreditasyon'],
    defaultWidth: 220,
    defaultHeight: 220,
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="92" fill="#047857" />
      <circle cx="100" cy="100" r="84" fill="#ffffff" />
      <circle cx="100" cy="100" r="76" fill="none" stroke="#047857" stroke-width="3" stroke-dasharray="6 4" />
      <circle cx="100" cy="100" r="62" fill="#ecfdf5" />
      <text x="100" y="58" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#047857" text-anchor="middle" letter-spacing="1">İŞ SAĞLIĞI &amp; GÜVENLİĞİ</text>
      <text x="100" y="98" font-family="Arial, sans-serif" font-size="17" font-weight="900" fill="#065f46" text-anchor="middle">ISO 45001</text>
      <text x="100" y="116" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#047857" text-anchor="middle">STANDARDI</text>
      <text x="100" y="146" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#065f46" text-anchor="middle" letter-spacing="1">KALİTE UYGUNLUK</text>
    </svg>`
  },
  {
    id: 'seal-laurel-medal',
    name: 'Altın Çelenkli Başarı Madalyası & Kurdele',
    category: 'seal',
    categoryLabel: 'Mühür & Damgalar',
    tags: ['madalya', 'çelenk', 'kurdele', 'başarı', 'altın', 'ödül'],
    defaultWidth: 220,
    defaultHeight: 240,
    svg: `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldG3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="50%" stop-color="#eab308" />
          <stop offset="100%" stop-color="#ca8a04" />
        </linearGradient>
      </defs>
      <!-- Hanging Ribbons -->
      <polygon points="75,110 50,210 80,185 95,210 95,115" fill="#dc2626" />
      <polygon points="125,110 150,210 120,185 105,210 105,115" fill="#b91c1c" />
      <!-- Medal Body -->
      <circle cx="100" cy="90" r="75" fill="url(#goldG3)" stroke="#78350f" stroke-width="2" />
      <circle cx="100" cy="90" r="66" fill="#1e1b4b" stroke="#fef08a" stroke-width="2" />
      <!-- Star -->
      <polygon points="100,56 108,74 128,74 112,87 118,107 100,95 82,107 88,87 72,74 92,74" fill="url(#goldG3)" />
      <text x="100" y="125" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#fef08a" text-anchor="middle" letter-spacing="1">ONUR DERECESİ</text>
    </svg>`
  },
  {
    id: 'seal-wax-royal',
    name: 'Vintage Kraliyet Balmumu Mührü',
    category: 'seal',
    categoryLabel: 'Mühür & Damgalar',
    tags: ['balmumu', 'kırmızı', 'vintage', 'mühür', 'damga', 'klasik'],
    defaultWidth: 200,
    defaultHeight: 200,
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="waxG" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#ef4444" />
          <stop offset="70%" stop-color="#991b1b" />
          <stop offset="100%" stop-color="#450a0a" />
        </radialGradient>
      </defs>
      <!-- Wax Droplets Contour -->
      <path d="M 100 15 C 130 12 150 25 170 45 C 190 65 195 90 190 120 C 185 150 165 180 135 188 C 105 195 70 190 45 170 C 20 150 10 120 15 90 C 20 60 45 30 75 18 Z" fill="url(#waxG)" />
      <circle cx="100" cy="100" r="65" fill="#7f1d1d" stroke="#ef4444" stroke-width="2" />
      <!-- Fleur-de-lis / Crest -->
      <path d="M 100 60 C 105 75 118 85 118 95 C 118 105 108 110 100 115 C 92 110 82 105 82 95 C 82 85 95 75 100 60 Z" fill="#fef2f2" />
      <path d="M 85 90 C 72 82 62 90 65 102 C 68 112 80 112 90 112 Z" fill="#fef2f2" />
      <path d="M 115 90 C 128 82 138 90 135 102 C 132 112 120 112 110 112 Z" fill="#fef2f2" />
      <rect x="75" y="115" width="50" height="5" rx="2" fill="#fef2f2" />
      <polygon points="100,122 92,138 108,138" fill="#fef2f2" />
    </svg>`
  },

  // ==========================================
  // 2. ÇERÇEVELER & BORDÜRLER (FRAMES & BORDERS)
  // ==========================================
  {
    id: 'border-royal-gold',
    name: 'Kraliyet Varaklı Altın Çerçeve',
    category: 'border',
    categoryLabel: 'Çerçeve & Bordürler',
    tags: ['çerçeve', 'altın', 'varak', 'kraliyet', 'klasik', 'kenarlık'],
    defaultWidth: 1920,
    defaultHeight: 1334,
    svg: `<svg viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="frameGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b45309" />
          <stop offset="50%" stop-color="#fcd34d" />
          <stop offset="100%" stop-color="#78350f" />
        </linearGradient>
      </defs>
      <!-- Outer Double Border -->
      <rect x="20" y="20" width="960" height="660" rx="8" fill="none" stroke="url(#frameGold)" stroke-width="5" />
      <rect x="32" y="32" width="936" height="636" rx="4" fill="none" stroke="url(#frameGold)" stroke-width="1.5" />
      <!-- Inner Thin Line -->
      <rect x="42" y="42" width="916" height="616" fill="none" stroke="url(#frameGold)" stroke-width="0.8" stroke-dasharray="8 4" />
      <!-- Corner Rosettes -->
      <circle cx="20" cy="20" r="10" fill="url(#frameGold)" />
      <circle cx="980" cy="20" r="10" fill="url(#frameGold)" />
      <circle cx="20" cy="680" r="10" fill="url(#frameGold)" />
      <circle cx="980" cy="680" r="10" fill="url(#frameGold)" />
      <!-- Corner Accents -->
      <path d="M 20 45 L 45 45 L 45 20" fill="none" stroke="url(#frameGold)" stroke-width="2.5" />
      <path d="M 980 45 L 955 45 L 955 20" fill="none" stroke="url(#frameGold)" stroke-width="2.5" />
      <path d="M 20 655 L 45 655 L 45 680" fill="none" stroke="url(#frameGold)" stroke-width="2.5" />
      <path d="M 980 655 L 955 655 L 955 680" fill="none" stroke="url(#frameGold)" stroke-width="2.5" />
    </svg>`
  },
  {
    id: 'border-modern-minimal',
    name: 'Modern Çift Hatlı Minimalist Bordür',
    category: 'border',
    categoryLabel: 'Çerçeve & Bordürler',
    tags: ['çerçeve', 'modern', 'minimal', 'çift çizgi', 'mavi', 'lacivert'],
    defaultWidth: 1920,
    defaultHeight: 1334,
    svg: `<svg viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="25" width="950" height="650" fill="none" stroke="#1e3a8a" stroke-width="4" />
      <rect x="35" y="35" width="930" height="630" fill="none" stroke="#0ea5e9" stroke-width="1.5" />
      <!-- Minimalist Corner Blocks -->
      <rect x="20" y="20" width="20" height="6" fill="#1e3a8a" />
      <rect x="20" y="20" width="6" height="20" fill="#1e3a8a" />
      <rect x="960" y="20" width="20" height="6" fill="#1e3a8a" />
      <rect x="974" y="20" width="6" height="20" fill="#1e3a8a" />
      <rect x="20" y="674" width="20" height="6" fill="#1e3a8a" />
      <rect x="20" y="660" width="6" height="20" fill="#1e3a8a" />
      <rect x="960" y="674" width="20" height="6" fill="#1e3a8a" />
      <rect x="974" y="660" width="6" height="20" fill="#1e3a8a" />
    </svg>`
  },
  {
    id: 'border-isg-hazard',
    name: 'Endüstriyel İSG Güvenlik Çerçevesi',
    category: 'border',
    categoryLabel: 'Çerçeve & Bordürler',
    tags: ['çerçeve', 'isg', 'endüstriyel', 'güvenlik', 'köşebent'],
    defaultWidth: 1920,
    defaultHeight: 1334,
    svg: `<svg viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="25" width="950" height="650" fill="none" stroke="#0f172a" stroke-width="6" />
      <rect x="36" y="36" width="928" height="628" fill="none" stroke="#f59e0b" stroke-width="2.5" />
      <!-- Solid Hazard Corner Triangles -->
      <polygon points="25,25 70,25 25,70" fill="#f59e0b" />
      <polygon points="975,25 930,25 975,70" fill="#f59e0b" />
      <polygon points="25,675 70,675 25,630" fill="#f59e0b" />
      <polygon points="975,675 930,675 975,630" fill="#f59e0b" />
    </svg>`
  },
  {
    id: 'border-corner-flourish',
    name: 'Barok Köşe Süslemeli Zarif Çerçeve',
    category: 'border',
    categoryLabel: 'Çerçeve & Bordürler',
    tags: ['çerçeve', 'barok', 'köşe', 'desen', 'vintage', 'süs'],
    defaultWidth: 1920,
    defaultHeight: 1334,
    svg: `<svg viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="40" width="920" height="620" fill="none" stroke="#b45309" stroke-width="2.5" />
      <!-- Top-Left Filigree -->
      <path d="M 25 70 C 25 45 45 25 70 25 M 32 60 C 32 40 40 32 60 32 M 25 25 L 50 50" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" />
      <!-- Top-Right Filigree -->
      <path d="M 975 70 C 975 45 955 25 930 25 M 968 60 C 968 40 960 32 940 32 M 975 25 L 950 50" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" />
      <!-- Bottom-Left Filigree -->
      <path d="M 25 630 C 25 655 45 675 70 675 M 32 640 C 32 660 40 668 60 668 M 25 675 L 50 650" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" />
      <!-- Bottom-Right Filigree -->
      <path d="M 975 630 C 975 655 955 675 930 675 M 968 640 C 968 660 960 668 940 668 M 975 675 L 950 650" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" />
    </svg>`
  },

  // ==========================================
  // 3. İSG & GÜVENLİK SEMBOLLERİ (SAFETY & ICONS)
  // ==========================================
  {
    id: 'isg-hardhat',
    name: 'İSG Koruyucu İş Bareti (Sarı)',
    category: 'isg',
    categoryLabel: 'İSG & Güvenlik',
    tags: ['baret', 'kask', 'isg', 'inşaat', 'koruma', 'sarı'],
    defaultWidth: 160,
    defaultHeight: 140,
    svg: `<svg viewBox="0 0 160 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="helmetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="50%" stop-color="#eab308" />
          <stop offset="100%" stop-color="#ca8a04" />
        </linearGradient>
      </defs>
      <!-- Hardhat Dome -->
      <path d="M 30 85 C 30 35 130 35 130 85 Z" fill="url(#helmetGrad)" stroke="#a16207" stroke-width="2.5" />
      <!-- Hardhat Rib Center Top -->
      <path d="M 72 37 C 76 33 84 33 88 37 L 90 85 L 70 85 Z" fill="#fde047" opacity="0.8" />
      <!-- Hardhat Rim & Visor -->
      <path d="M 15 90 Q 80 82 145 90 L 140 100 Q 80 92 20 100 Z" fill="#ca8a04" stroke="#854d0e" stroke-width="2" />
    </svg>`
  },
  {
    id: 'isg-shield-check',
    name: 'Güvenlik Kalkanı & Onay Tiki',
    category: 'isg',
    categoryLabel: 'İSG & Güvenlik',
    tags: ['kalkan', 'güvenlik', 'onay', 'tik', 'koruma', 'yeşil'],
    defaultWidth: 140,
    defaultHeight: 160,
    svg: `<svg viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shieldG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#047857" />
        </linearGradient>
      </defs>
      <path d="M 70 15 L 125 35 L 125 85 Q 125 130 70 145 Q 15 130 15 85 L 15 35 Z" fill="url(#shieldG)" stroke="#065f46" stroke-width="4" />
      <path d="M 45 78 L 62 95 L 98 55" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
    </svg>`
  },
  {
    id: 'isg-fire-extinguisher',
    name: 'Yangın Güvenliği & Söndürücü',
    category: 'isg',
    categoryLabel: 'İSG & Güvenlik',
    tags: ['yangın', 'söndürücü', 'isg', 'acil', 'kırmızı', 'tüp'],
    defaultWidth: 130,
    defaultHeight: 170,
    svg: `<svg viewBox="0 0 130 170" xmlns="http://www.w3.org/2000/svg">
      <!-- Cylinder -->
      <rect x="42" y="55" width="46" height="95" rx="14" fill="#dc2626" stroke="#991b1b" stroke-width="2.5" />
      <!-- Base -->
      <rect x="40" y="145" width="50" height="8" rx="3" fill="#1e293b" />
      <!-- Label -->
      <rect x="48" y="80" width="34" height="40" fill="#ffffff" />
      <text x="65" y="103" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#dc2626" text-anchor="middle">YANGIN</text>
      <!-- Valve & Handle -->
      <rect x="58" y="38" width="14" height="18" fill="#475569" />
      <path d="M 50 38 L 80 38" stroke="#1e293b" stroke-width="5" stroke-linecap="round" />
      <path d="M 65 38 L 85 24" stroke="#1e293b" stroke-width="4" stroke-linecap="round" />
      <!-- Gauge -->
      <circle cx="78" cy="46" r="6" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5" />
      <!-- Hose -->
      <path d="M 72 45 Q 100 50 96 90 L 92 90" fill="none" stroke="#0f172a" stroke-width="4" stroke-linecap="round" />
    </svg>`
  },
  {
    id: 'isg-first-aid',
    name: 'İlk Yardım Çantası & Sağlık',
    category: 'isg',
    categoryLabel: 'İSG & Güvenlik',
    tags: ['ilkyardım', 'sağlık', 'doktor', 'acil', 'çanta', 'haç'],
    defaultWidth: 150,
    defaultHeight: 140,
    svg: `<svg viewBox="0 0 150 140" xmlns="http://www.w3.org/2000/svg">
      <!-- Handle -->
      <path d="M 55 35 L 55 20 Q 55 15 60 15 L 90 15 Q 95 15 95 20 L 95 35" fill="none" stroke="#475569" stroke-width="6" stroke-linecap="round" />
      <!-- Case Body -->
      <rect x="20" y="35" width="110" height="85" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="3" />
      <!-- Green Cross / Red Cross -->
      <rect x="65" y="55" width="20" height="45" rx="3" fill="#10b981" />
      <rect x="52" y="68" width="46" height="19" rx="3" fill="#10b981" />
    </svg>`
  },
  {
    id: 'isg-fall-protection',
    name: 'Yüksekte Çalışma & Emniyet Kemeri',
    category: 'isg',
    categoryLabel: 'İSG & Güvenlik',
    tags: ['yüksekte çalışma', 'emniyet', 'kemer', 'isg', 'halat'],
    defaultWidth: 150,
    defaultHeight: 160,
    svg: `<svg viewBox="0 0 150 160" xmlns="http://www.w3.org/2000/svg">
      <!-- Human silhouette with harness -->
      <circle cx="75" cy="30" r="14" fill="#f59e0b" />
      <!-- Torso -->
      <path d="M 55 52 L 95 52 L 85 110 L 65 110 Z" fill="#1e3a8a" />
      <!-- Harness Straps -->
      <path d="M 58 52 L 82 108 M 92 52 L 68 108" stroke="#f59e0b" stroke-width="4" />
      <line x1="62" y1="78" x2="88" y2="78" stroke="#f59e0b" stroke-width="4" />
      <!-- Carabiner Hook -->
      <path d="M 75 112 L 75 140 L 85 140 Q 90 135 90 128 L 90 120" fill="none" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
    </svg>`
  },
  {
    id: 'isg-zero-accident',
    name: 'Sıfır İş Kazası Hedefi Mührü',
    category: 'isg',
    categoryLabel: 'İSG & Güvenlik',
    tags: ['sıfır kaza', 'hedef', 'isg', 'başarı', 'yeşil'],
    defaultWidth: 180,
    defaultHeight: 180,
    svg: `<svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
      <circle cx="90" cy="90" r="82" fill="#065f46" stroke="#34d399" stroke-width="3" />
      <circle cx="90" cy="90" r="74" fill="#047857" />
      <circle cx="90" cy="90" r="64" fill="none" stroke="#a7f3d0" stroke-width="1.5" stroke-dasharray="4 3" />
      <text x="90" y="55" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="#a7f3d0" text-anchor="middle" letter-spacing="1">HEDEF</text>
      <text x="90" y="105" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle">0</text>
      <text x="90" y="130" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#fef08a" text-anchor="middle" letter-spacing="2">İŞ KAZASI</text>
    </svg>`
  },

  // ==========================================
  // 4. KURDELELER & FLAMALAR (RIBBONS & BANNERS)
  // ==========================================
  {
    id: 'ribbon-gold-banner',
    name: 'Kraliyet Altın Zafer Kurdelesi',
    category: 'ribbon',
    categoryLabel: 'Kurdele & Flamalar',
    tags: ['kurdele', 'flama', 'şerit', 'altın', 'başarı', 'zafer'],
    defaultWidth: 500,
    defaultHeight: 120,
    svg: `<svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ribbonGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="50%" stop-color="#eab308" />
          <stop offset="100%" stop-color="#ca8a04" />
        </linearGradient>
      </defs>
      <!-- Left Ribbon Tail -->
      <polygon points="20,70 65,30 65,95 20,95 40,82" fill="#a16207" />
      <!-- Right Ribbon Tail -->
      <polygon points="480,70 435,30 435,95 480,95 460,82" fill="#a16207" />
      <!-- Back folds -->
      <polygon points="65,80 95,80 95,95" fill="#713f12" />
      <polygon points="435,80 405,80 405,95" fill="#713f12" />
      <!-- Front Main Banner -->
      <path d="M 60 40 Q 250 20 440 40 L 435 85 Q 250 65 65 85 Z" fill="url(#ribbonGold)" stroke="#854d0e" stroke-width="1.5" />
      <path d="M 70 48 Q 250 28 430 48" fill="none" stroke="#fef9c3" stroke-width="1.2" stroke-dasharray="4 3" />
    </svg>`
  },
  {
    id: 'ribbon-red-ceremony',
    name: 'Tören Kırmızı Kutlama Şeridi',
    category: 'ribbon',
    categoryLabel: 'Kurdele & Flamalar',
    tags: ['kurdele', 'kırmızı', 'tören', 'şerit', 'flama'],
    defaultWidth: 480,
    defaultHeight: 110,
    svg: `<svg viewBox="0 0 480 110" xmlns="http://www.w3.org/2000/svg">
      <polygon points="15,65 60,25 60,85 15,85 32,75" fill="#991b1b" />
      <polygon points="465,65 420,25 420,85 465,85 448,75" fill="#991b1b" />
      <polygon points="60,75 85,75 85,88" fill="#450a0a" />
      <polygon points="420,75 395,75 395,88" fill="#450a0a" />
      <path d="M 55 35 Q 240 18 425 35 L 420 78 Q 240 60 60 78 Z" fill="#dc2626" stroke="#991b1b" stroke-width="1.5" />
      <path d="M 65 42 Q 240 25 415 42" fill="none" stroke="#fecaca" stroke-width="1" stroke-dasharray="5 3" />
    </svg>`
  },

  // ==========================================
  // 5. SÜSLEMELER & AYRAÇLAR (FLOURISHES & CRESTS)
  // ==========================================
  {
    id: 'ornament-laurel-wreath',
    name: 'Altın Defne Çelengi (Zafer & Başarı)',
    category: 'ornament',
    categoryLabel: 'Süsleme & Ayraçlar',
    tags: ['çelenk', 'defne', 'yaprak', 'zafer', 'altın', 'süs'],
    defaultWidth: 260,
    defaultHeight: 220,
    svg: `<svg viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="laurelG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="50%" stop-color="#eab308" />
          <stop offset="100%" stop-color="#a16207" />
        </linearGradient>
      </defs>
      <!-- Left Branch -->
      <path d="M 130 195 C 70 190 35 140 45 75 C 48 55 58 35 75 20" fill="none" stroke="#ca8a04" stroke-width="3" />
      <!-- Left Leaves -->
      <ellipse cx="65" cy="40" rx="14" ry="7" transform="rotate(-35 65 40)" fill="url(#laurelG)" />
      <ellipse cx="50" cy="70" rx="15" ry="7" transform="rotate(-15 50 70)" fill="url(#laurelG)" />
      <ellipse cx="45" cy="105" rx="15" ry="7" transform="rotate(10 45 105)" fill="url(#laurelG)" />
      <ellipse cx="55" cy="140" rx="15" ry="7" transform="rotate(30 55 140)" fill="url(#laurelG)" />
      <ellipse cx="80" cy="170" rx="15" ry="7" transform="rotate(50 80 170)" fill="url(#laurelG)" />
      <!-- Right Branch -->
      <path d="M 130 195 C 190 190 225 140 215 75 C 212 55 202 35 185 20" fill="none" stroke="#ca8a04" stroke-width="3" />
      <!-- Right Leaves -->
      <ellipse cx="195" cy="40" rx="14" ry="7" transform="rotate(35 195 40)" fill="url(#laurelG)" />
      <ellipse cx="210" cy="70" rx="15" ry="7" transform="rotate(15 210 70)" fill="url(#laurelG)" />
      <ellipse cx="215" cy="105" rx="15" ry="7" transform="rotate(-10 215 105)" fill="url(#laurelG)" />
      <ellipse cx="205" cy="140" rx="15" ry="7" transform="rotate(-30 205 140)" fill="url(#laurelG)" />
      <ellipse cx="180" cy="170" rx="15" ry="7" transform="rotate(-50 180 170)" fill="url(#laurelG)" />
      <!-- Ribbon at bottom -->
      <circle cx="130" cy="195" r="8" fill="#ca8a04" />
    </svg>`
  },
  {
    id: 'ornament-baroque-divider',
    name: 'Kraliyet Kaligrafi Başlık Ayracı',
    category: 'ornament',
    categoryLabel: 'Süsleme & Ayraçlar',
    tags: ['ayraç', 'çizgi', 'kaligrafi', 'barok', 'süs', 'başlık'],
    defaultWidth: 600,
    defaultHeight: 50,
    svg: `<svg viewBox="0 0 600 50" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 25 L 240 25" stroke="#b45309" stroke-width="1.8" />
      <path d="M 360 25 L 580 25" stroke="#b45309" stroke-width="1.8" />
      <!-- Center Flourish -->
      <path d="M 240 25 C 270 5 285 45 300 25 C 315 5 330 45 360 25" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="300" cy="25" r="5" fill="#f59e0b" />
      <circle cx="280" cy="25" r="3" fill="#b45309" />
      <circle cx="320" cy="25" r="3" fill="#b45309" />
    </svg>`
  },
  {
    id: 'ornament-stars-trio',
    name: 'Üçlü Altın Parlak Yıldız Grubu',
    category: 'ornament',
    categoryLabel: 'Süsleme & Ayraçlar',
    tags: ['yıldız', 'altın', 'parlak', 'üçlü', 'başarı'],
    defaultWidth: 200,
    defaultHeight: 70,
    svg: `<svg viewBox="0 0 200 70" xmlns="http://www.w3.org/2000/svg">
      <!-- Center Large Star -->
      <polygon points="100,5 106,24 126,24 110,36 116,55 100,43 84,55 90,36 74,24 94,24" fill="#f59e0b" stroke="#b45309" stroke-width="1.5" />
      <!-- Left Small Star -->
      <polygon points="45,18 49,32 64,32 52,41 57,55 45,46 33,55 38,41 26,32 41,32" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
      <!-- Right Small Star -->
      <polygon points="155,18 159,32 174,32 162,41 167,55 155,46 143,55 148,41 136,32 151,32" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
    </svg>`
  },
  {
    id: 'ornament-scales-justice',
    name: 'Adalet & Hukuki Uygunluk Terazisi',
    category: 'ornament',
    categoryLabel: 'Süsleme & Ayraçlar',
    tags: ['adalet', 'terazi', 'hukuk', 'mevzuat', 'kanun', 'isg'],
    defaultWidth: 150,
    defaultHeight: 150,
    svg: `<svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <!-- Base and Pillar -->
      <rect x="50" y="132" width="50" height="8" rx="2" fill="#475569" />
      <rect x="72" y="35" width="6" height="97" fill="#64748b" />
      <!-- Top Balance Beam -->
      <line x1="25" y1="42" x2="125" y2="42" stroke="#d97706" stroke-width="4" stroke-linecap="round" />
      <circle cx="75" cy="42" r="6" fill="#f59e0b" />
      <!-- Left Pan -->
      <line x1="25" y1="42" x2="10" y2="85" stroke="#94a3b8" stroke-width="1.5" />
      <line x1="25" y1="42" x2="40" y2="85" stroke="#94a3b8" stroke-width="1.5" />
      <path d="M 8 85 Q 25 102 42 85 Z" fill="#d97706" />
      <!-- Right Pan -->
      <line x1="125" y1="42" x2="110" y2="85" stroke="#94a3b8" stroke-width="1.5" />
      <line x1="125" y1="42" x2="140" y2="85" stroke="#94a3b8" stroke-width="1.5" />
      <path d="M 108 85 Q 125 102 142 85 Z" fill="#d97706" />
    </svg>`
  },
  {
    id: 'ornament-quill-signature',
    name: 'Resmiyet Tüy Kalemi & İmzası',
    category: 'ornament',
    categoryLabel: 'Süsleme & Ayraçlar',
    tags: ['kalem', 'tüy', 'imza', 'yazı', 'resmiyet', 'antik'],
    defaultWidth: 140,
    defaultHeight: 140,
    svg: `<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <!-- Feather Quill -->
      <path d="M 115 15 C 75 35 45 80 25 125 L 32 125 C 50 95 80 60 125 25 C 130 20 125 10 115 15 Z" fill="#b45309" />
      <path d="M 115 15 C 95 30 70 65 50 110" stroke="#fef08a" stroke-width="1.5" fill="none" />
      <!-- Ink Splash -->
      <path d="M 22 126 Q 15 128 18 133 Q 28 135 30 128 Z" fill="#1e293b" />
    </svg>`
  }
];
