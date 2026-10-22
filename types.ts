export enum ElementType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SIGNATURE = 'SIGNATURE', // Used for Signature Placeholders
  DROPDOWN = 'DROPDOWN', // Dropdown selection component
  QRCODE = 'QRCODE', // QR Code generator
  COMPANY = 'COMPANY', // Company selection component linked to global settings
  TCKN = 'TCKN', // Masked Identity Number
  CHOICE_BOX = 'CHOICE_BOX', // Boolean selection with two distinct positions (Yes/No check)
  DATE = 'DATE' // Date picker with auto-validity calculation based on danger class
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
  content: string; // Default text or Placeholder ID or QR Data or Default Value for Choice
  x: number;
  y: number;
  width: number; // Width is now mandatory for resizing
  height: number; // Height is now mandatory
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string | number;
  fontStyle?: string; // 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right'; // Text alignment
  label?: string; // For UI identification (e.g. "Ad Soyad Alanı")
  allowedSignatureIds?: string[]; // IDs of signatures allowed for this specific slot
  options?: string[]; // List of options for Dropdown elements OR Labels for Choice Box [TrueLabel, FalseLabel]
  secondaryX?: number; // X position for the "False/Option 2" box
  secondaryY?: number; // Y position for the "False/Option 2" box
  dateKind?: 'training' | 'validity'; // For DATE element: training date or calculated validity date
}

export interface CertificateSide {
  id?: string; // Unique ID for multi-side support
  name?: string; // User-defined name for this version
  bgUrl: string;
  elements: CanvasElement[];
}

export interface BackgroundVariant {
  id: string;
  name: string;
  bgUrl: string;
}

export interface CertificateProject {
  id: string;
  name: string;
  width: number;
  height: number;
  front: CertificateSide;
  back: CertificateSide;
  frontVariants?: BackgroundVariant[]; 
  backVariants?: BackgroundVariant[];  
  selectedFrontId?: string; 
  selectedBackId?: string;  
  createdAt: number;
  filenamePattern?: string; 
  isActive?: boolean; // When false, project is inactive and hidden from the certificate issuance list
}

export type DangerClass = 'az_tehlikeli' | 'tehlikeli' | 'cok_tehlikeli';

export interface Company {
  id: string;
  name: string;
  shortName: string;
  dangerClass?: DangerClass; // 'cok_tehlikeli' (1 yr), 'tehlikeli' (2 yr), 'az_tehlikeli' (3 yr)
  validityYears?: number;    // 1, 2, or 3
  createdAt?: number;
}

export type UserRole = 'admin' | 'user';

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  createdAt: number;
}

export interface IssuedCertificate {
  serialNo: string;
  company: string;
  companyId?: string;
  dangerClass?: DangerClass;
  recipientName?: string;
  recipientTc?: string;
  trainingDate?: string;
  expiryDate?: string;
  validityYears?: number;
  issuedBy?: string;
  issuedByName?: string;
  fields: Record<string, string>;
  projects: string[];
  date: string;
  image?: string;
}

export interface DashboardStats {
  total: number;
  expired: number;
  expiringSoon: number;
  valid: number;
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
  mappedFolder?: string;
}
