import { CertificateTemplate, FontStyle } from './types';

// Placeholder backgrounds using generic reputable placeholder services or gradients
// In a real app, these would be local assets or CDN links.
// We will generate simple SVG backgrounds for reliability in this demo.

const createSvgBg = (color1: string, color2: string, pattern: string) => {
  const svg = `
  <svg width="2000" height="1414" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
    <rect width="100%" height="100%" fill="url(#grid)" />
    <rect x="50" y="50" width="1900" height="1314" rx="20" fill="none" stroke="rgba(255,215,0,0.5)" stroke-width="10" />
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const TEMPLATES: CertificateTemplate[] = [
  {
    id: 'classic-gold',
    name: 'Klasik Altın',
    width: 2000,
    height: 1414, // A4 Landscape ratio roughly
    previewUrl: '',
    bgUrl: createSvgBg('#1e293b', '#0f172a', 'grid'), // Dark professional
  },
  {
    id: 'modern-blue',
    name: 'Modern Mavi',
    width: 2000,
    height: 1414,
    previewUrl: '',
    bgUrl: createSvgBg('#1e3a8a', '#172554', 'grid'),
  },
  {
    id: 'clean-white',
    name: 'Zarif Beyaz',
    width: 2000,
    height: 1414,
    previewUrl: '',
    bgUrl: createSvgBg('#f8fafc', '#e2e8f0', 'grid'),
  }
];

export const FONTS = [
  { group: 'Modern (Sans-Serif)', options: [
      { name: 'Inter (Standart)', value: 'Inter, sans-serif' },
      { name: 'Montserrat (Modern)', value: 'Montserrat, sans-serif' },
      { name: 'Lato (Temiz)', value: 'Lato, sans-serif' },
      { name: 'Roboto (Nötr)', value: 'Roboto, sans-serif' },
  ]},
  { group: 'Klasik (Serif)', options: [
      { name: 'Playfair Display (Başlık)', value: 'Playfair Display, serif' },
      { name: 'Merriweather (Okunaklı)', value: 'Merriweather, serif' },
      { name: 'Libre Baskerville (Resmi)', value: 'Libre Baskerville, serif' },
      { name: 'Cinzel (Epik)', value: 'Cinzel, serif' },
  ]},
  { group: 'El Yazısı & Dekoratif', options: [
      { name: 'Great Vibes (Zarif)', value: 'Great Vibes, cursive' },
      { name: 'Alex Brush (Akıcı)', value: 'Alex Brush, cursive' },
      { name: 'Pinyon Script (Asil)', value: 'Pinyon Script, cursive' },
      { name: 'Dancing Script (Samimi)', value: 'Dancing Script, cursive' },
      { name: 'Oswald (Güçlü)', value: 'Oswald, sans-serif' },
      { name: 'Bebas Neue (Uzun)', value: 'Bebas Neue, sans-serif' },
  ]}
];

export const FONT_WEIGHTS = [
  { name: 'İnce (100)', value: 100 },
  { name: 'Ekstra Hafif (200)', value: 200 },
  { name: 'Hafif (300)', value: 300 },
  { name: 'Normal (400)', value: 400 },
  { name: 'Orta (500)', value: 500 },
  { name: 'Yarı Kalın (600)', value: 600 },
  { name: 'Kalın (700)', value: 700 },
  { name: 'Ekstra Kalın (800)', value: 800 },
  { name: 'Siyah (900)', value: 900 },
];