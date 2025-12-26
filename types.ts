export enum ElementType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SIGNATURE = 'SIGNATURE', // Used for Signature Placeholders
  DROPDOWN = 'DROPDOWN', // Dropdown selection component
  QRCODE = 'QRCODE', // New: QR Code generator
  COMPANY = 'COMPANY' // New: Company selection component linked to global settings
}

// Extended FontStyle map is now handled in constants.ts via generic strings to allow more flexibility
export enum FontStyle {
  SERIF = 'Playfair Display, serif',
  SANS = 'Inter, sans-serif',
  DECORATIVE = 'Cinzel, serif',
  HANDWRITING = 'Great Vibes, cursive'
}

export interface Position {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  content: string; // Default text or Placeholder ID or QR Data
  x: number;
  y: number;
  width: number; // Width is now mandatory for resizing
  height: number; // Height is now mandatory
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string | number;
  fontStyle?: string; // 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right'; // New: Text alignment
  label?: string; // For UI identification (e.g. "Ad Soyad Alanı")
  allowedSignatureIds?: string[]; // IDs of signatures allowed for this specific slot
  options?: string[]; // List of options for Dropdown elements
}

export interface CertificateSide {
  bgUrl: string;
  elements: CanvasElement[];
}

export interface CertificateProject {
  id: string;
  name: string;
  width: number;
  height: number;
  front: CertificateSide;
  back: CertificateSide;
  createdAt: number;
  filenamePattern?: string; // New: Pattern for saving files e.g. "{Ad Soyad}-{Tarih}"
}

export interface Company {
  id: string;
  name: string;
  shortName: string;
}

// Keeping this for backward compatibility if needed, though Project replaces it mostly
export interface CertificateTemplate {
  id: string;
  name: string;
  previewUrl: string; 
  bgUrl: string; 
  width: number;
  height: number;
}

export interface SavedSignature {
  id: string;
  name: string;
  url: string;
}