
import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Type, 
  Upload,
  FileText,
  LayoutTemplate,
  PenTool,
  Settings,
  Trash2,
  Plus,
  Image as ImageIcon,
  FolderOpen,
  CheckSquare,
  Square,
  Filter,
  Check,
  X,
  AlertCircle,
  List,
  Bold,
  Italic,
  QrCode,
  FileBadge,
  Database,
  UploadCloud,
  DownloadCloud,
  AlertTriangle,
  Github,
  Monitor,
  PenLine,
  Building,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Edit2,
  RectangleHorizontal,
  RectangleVertical,
  RotateCcw,
  Copy,
  FileCode,
  Import,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  FileStack,
  Files,
  Globe,
  ExternalLink,
  MessageSquare,
  Bot,
  Send,
  Calendar,
  ZoomIn,
  ZoomOut,
  Maximize,
  ArrowLeft,
  Menu,
  Folder,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Pencil,
  Flame,
  Search,
  Building2
} from 'lucide-react';
import { jsPDF } from "jspdf";
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { 
  CanvasElement, 
  ElementType, 
  FontStyle, 
  SavedSignature, 
  CertificateProject, 
  CertificateSide,
  BackgroundVariant,
  Company,
  DangerClass,
  UserRole,
  AppUser,
  IssuedCertificate,
  DashboardStats
} from './types';
import { TEMPLATES, FONTS, FONT_WEIGHTS } from './constants';
import CanvasEditor from './components/CanvasEditor';
import SignaturePad from './components/SignaturePad'; 
import { Sidebar, ActiveNavTab } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { CompaniesView } from './views/CompaniesView';
import { CompanyDetailView } from './views/CompanyDetailView';
import { LoginView } from './views/LoginView';
import { UserManagementModal } from './components/UserManagementModal';
import { EmployeeModal } from './components/EmployeeModal';
import { 
  calculateExpiryDate, 
  getValidityYears, 
  findBestTrainingDateField, 
  isValidityDateField,
  parseDateDetailed,
  formatDateTR
} from './services/validityService';

type ViewMode = ActiveNavTab;
type Side = 'front' | 'back';
type ExportMode = 'single' | 'separate';

const DEFAULT_WIDTH = 2000;
const DEFAULT_HEIGHT = 1414;
const APP_VERSION = "v1.7.3"; 
const GITHUB_URL = "https://github.com/szgnemin1/ProCertify";

const createNewProject = (name: string): CertificateProject => {
  return {
    id: Date.now().toString(),
    name: name,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    createdAt: Date.now(),
    isActive: true,
    filenamePattern: 'Sertifika-{Ad Soyad}', 
    front: {
      id: `front-${Date.now()}`,
      name: 'Ön Yüz',
      bgUrl: TEMPLATES[0].bgUrl,
      elements: [
         { id: '1', type: ElementType.TEXT, content: '{AD SOYAD}', x: 800, y: 600, width: 400, height: 100, fontSize: 80, fontFamily: FontStyle.SERIF, color: '#000000', fontWeight: 700, fontStyle: 'normal', textAlign: 'center', label: 'Ad Soyad' },
      ]
    },
    back: {
      id: `back-${Date.now()}`,
      name: 'Arka Yüz',
      bgUrl: '', 
      elements: []
    }
  };
};

const getApiUrl = (endpoint: string) => {
  let base = window.location.pathname;
  if(base.endsWith('/')) base = base.slice(0, -1);
  return `${base}${endpoint}`;
};

const downloadFile = async (blob: Blob | ArrayBuffer, defaultFilename: string, mimeType: string, preAcquiredHandle?: any) => {
  if (preAcquiredHandle) {
    try {
      const writable = await preAcquiredHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      console.error("Failed to write to pre-acquired handle, falling back to standard download...", err);
    }
  } else if ('showSaveFilePicker' in window) {
    try {
      const ext = defaultFilename.split('.').pop() || '';
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: defaultFilename,
        types: [{
          description: ext.toUpperCase() + ' Dosyası',
          accept: {
            [mimeType]: [`.${ext}`]
          }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
         // Kullanıcı kaydetmeyi iptal etti
         return false;
      }
      console.warn("showSaveFilePicker failed, falling back to standard download...", err);
    }
  }

  // Fallback to standard <a> tag click
  const fileBlob = blob instanceof Blob ? blob : new Blob([blob], { type: mimeType });
  const url = URL.createObjectURL(fileBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
};

const App = () => {
  const [projectFrontSelections, setProjectFrontSelections] = useState<Record<string, string>>({});
  const [projectBackSelections, setProjectBackSelections] = useState<Record<string, string>>({});

  const getActiveSideData = (project: CertificateProject | undefined, side: Side, useFillSelection: boolean = false): CertificateSide | null => {
    if (!project) return null;
    
    const sideData = side === 'front' ? project.front : project.back;
    const variants = side === 'front' ? project.frontVariants : project.backVariants;
    
    let selectedId: string | undefined;
    if (side === 'front') {
        selectedId = useFillSelection && projectFrontSelections[project.id] !== undefined 
            ? projectFrontSelections[project.id] 
            : project.selectedFrontId;
    } else {
        selectedId = useFillSelection && projectBackSelections[project.id] !== undefined 
            ? projectBackSelections[project.id] 
            : project.selectedBackId;
    }
    
    let bgUrl = sideData.bgUrl;
    let name = sideData.name;

    if (selectedId && selectedId !== 'DEFAULT' && variants && variants.length > 0) {
        const variant = variants.find(v => v.id === selectedId);
        if (variant) {
            bgUrl = variant.bgUrl || (variant as any).url || sideData.bgUrl;
            name = variant.name;
        }
    }
    
    return {
        ...sideData,
        bgUrl,
        name
    };
  };
  // --- Global State ---
  const [projects, setProjects] = useState<CertificateProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [apiFetchFailed, setApiFetchFailed] = useState(false);

  const [selectedFillProjectIds, setSelectedFillProjectIds] = useState<string[]>([]);
  const [previewSides, setPreviewSides] = useState<Record<string, Side>>({});
  const [exportMode, setExportMode] = useState<ExportMode>('single');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [projectStatusFilter, setProjectStatusFilter] = useState<'all' | 'active' | 'passive'>('all');

  // Initialize selectedFillProjectIds: only include active projects (isActive !== false)
  useEffect(() => {
    const activeProjects = projects.filter(p => p.isActive !== false);
    if (activeProjects.length > 0) {
      const valid = selectedFillProjectIds.filter(id => activeProjects.some(p => p.id === id));
      if (valid.length === 0) {
        const defaultPick = activeProjects.find(p => p.id === activeProjectId) || activeProjects[0];
        setSelectedFillProjectIds([defaultPick.id]);
      } else if (valid.length !== selectedFillProjectIds.length) {
        setSelectedFillProjectIds(valid);
      }
    } else {
      if (selectedFillProjectIds.length > 0) {
        setSelectedFillProjectIds([]);
      }
    }
  }, [projects, activeProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  // UI State
  const [activeSide, setActiveSide] = useState<Side>('front');
  const [currentView, setCurrentView] = useState<ViewMode>('fill');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showSigPermissions, setShowSigPermissions] = useState(false); 
  const [showOptionManager, setShowOptionManager] = useState(false); 
  const [showSignaturePad, setShowSignaturePad] = useState(false); 
  const [tempOptionInput, setTempOptionInput] = useState(''); 
  const [isEditingName, setIsEditingName] = useState(false); 
  const [showChoiceFields, setShowChoiceFields] = useState(false);
  
  // User Session & Role
  const [sessionUser, setSessionUser] = useState<{ id: string; username: string; role: UserRole; name: string } | null>(() => {
    try {
      const stored = localStorage.getItem('vps_user_info');
      const token = localStorage.getItem('vps_session_token');
      if (stored && token) return JSON.parse(stored);
      if (token && localStorage.getItem('vps_session') === 'authenticated') {
        return { id: 'admin', username: 'admin', role: 'admin', name: 'Sistem Yöneticisi' };
      }
    } catch (e) { /* ignore */ }
    return null;
  });

  const isAuthenticated = !!sessionUser && !!localStorage.getItem('vps_session_token');
  const isAdmin = sessionUser?.role === 'admin';

  // Selected company for detail view
  const [selectedCompanyForDetail, setSelectedCompanyForDetail] = useState<Company | null>(null);

  // User Management Modal state
  const [showUserModal, setShowUserModal] = useState(false);

  // Edit Certificate & Employee Modal State
  const [editingCertificate, setEditingCertificate] = useState<IssuedCertificate | null>(null);
  const [activeEmployeeIdOrTc, setActiveEmployeeIdOrTc] = useState<string | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  // All Certificates & Dashboard Stats
  const [allCertificates, setAllCertificates] = useState<IssuedCertificate[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    total: 0,
    expired: 0,
    expiringSoon: 0,
    valid: 0
  });

  const fetchCertificatesAndStats = async () => {
    try {
      const token = localStorage.getItem('vps_session_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [certsRes, statsRes] = await Promise.all([
        fetch(getApiUrl('/api/certificates'), { headers }),
        fetch(getApiUrl('/api/stats/dashboard'), { headers })
      ]);

      if (certsRes.ok) {
        const certsData = await certsRes.json();
        setAllCertificates(certsData || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDashboardStats(statsData);
      }
    } catch (err) {
      console.error("Error loading certificates and stats:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCertificatesAndStats();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('vps_session_token');
    localStorage.removeItem('vps_session');
    localStorage.removeItem('vps_user_info');
    setSessionUser(null);
    setCurrentView('dashboard');
  };

  useEffect(() => {
    if (sessionUser && !isAdmin) {
      if (currentView === 'template' || currentView === 'projects' || currentView === 'settings') {
        setCurrentView('dashboard');
      }
    }
  }, [sessionUser, isAdmin, currentView]);

  const updateCompanyDangerClass = (companyId: string, dangerClass: DangerClass) => {
    const years = getValidityYears(dangerClass);
    setCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        return { ...c, dangerClass, validityYears: years };
      }
      return c;
    }));
  };

  const handleAdminLogout = () => {
    handleLogout();
  };

  const handleEditCertificate = (cert: IssuedCertificate) => {
    setEditingCertificate(cert);
    setCurrentView('fill');

    // Prepopulate fill values from certificate
    const populated: Record<string, string> = { ...(cert.fields || {}) };

    if (cert.recipientName) {
      populated['Ad Soyad'] = cert.recipientName;
      populated['ad soyad'] = cert.recipientName;
      populated['ad_soyad'] = cert.recipientName;
    }
    if (cert.recipientTc) {
      populated['TC Kimlik No'] = cert.recipientTc;
      populated['tc kimlik no'] = cert.recipientTc;
      populated['tc'] = cert.recipientTc;
    }
    if (cert.company) {
      populated['Firma'] = cert.company;
      populated['firma'] = cert.company;
    }
    if (cert.trainingDate) {
      populated['Eğitim Tarihi'] = cert.trainingDate;
      populated['egitim tarihi'] = cert.trainingDate;
    }
    if (cert.expiryDate) {
      populated['Geçerlilik Tarihi'] = cert.expiryDate;
      populated['geçerlilik tarihi'] = cert.expiryDate;
    }

    setFillValues(populated);

    // If projects are known, select matching project IDs
    if (cert.projects && Array.isArray(cert.projects) && cert.projects.length > 0) {
      const matchedProjectIds = projects
        .filter(p => cert.projects.some(pn => turkishToLower(pn) === turkishToLower(p.name)))
        .map(p => p.id);
      if (matchedProjectIds.length > 0) {
        setSelectedFillProjectIds(matchedProjectIds);
        setActiveProjectId(matchedProjectIds[0]);
      }
    }

    // Switch to classic form mode so user sees all fields right away
    setIsChatMode(false);
  };

  const handleCancelEdit = () => {
    setEditingCertificate(null);
    setFillValues({});
  };

  const handleFillFieldChange = (fieldLabel: string, value: string, fieldType?: ElementType) => {
    setFillValues(prev => {
      const updated = { ...prev, [fieldLabel]: value };
      const normKey = fieldLabel.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
      updated[normKey] = value;

      const isDateComponent = fieldType === ElementType.DATE || 
        normKey.includes('başlangıç') || normKey.includes('baslangic') || 
        normKey.includes('başlama') || normKey.includes('baslama') ||
        normKey.includes('eğitim tarihi') || normKey.includes('egitim tarihi');

      // Tarih bileşeni veya açıkça başlangıç/eğitim tarihi girildiğinde bunu referans başlangıç tarihi kabul et
      // ve gruptaki diğer sertifikaların ortak tarih etiketlerine ({Tarih}, {Eğitim Tarihi}) otomatik aktar
      if (isDateComponent && value.trim()) {
        setSelectedTrainingDateKey(fieldLabel);
        const syncKeys = [
          'tarih', 'tarihi', 'eğitim tarihi', 'egitim tarihi', 'egitim_tarihi',
          'başlangıç tarihi', 'baslangic tarihi', 'baslangic_tarihi',
          'Tarih', 'Eğitim Tarihi', 'Başlangıç Tarihi'
        ];
        for (const sk of syncKeys) {
          if (!updated[sk] || updated[sk] === prev[fieldLabel]) {
            updated[sk] = value;
          }
        }
      }

      let compVal = '';
      for (const [k, v] of Object.entries(updated)) {
        const lk = k.toLowerCase();
        if (!compVal && (lk.includes('firma') || lk.includes('kurum') || lk.includes('şirket') || lk.includes('sirket'))) {
          compVal = v;
        }
      }

      const dateCandidates = Object.keys(updated).filter(k => {
        const lk = k.toLowerCase();
        return (lk.includes('tarih') || lk.includes('date')) && !isValidityDateField(lk);
      });

      const effectiveTrKey = selectedTrainingDateKey && updated[selectedTrainingDateKey] !== undefined
        ? selectedTrainingDateKey
        : findBestTrainingDateField(dateCandidates);

      const dateVal = effectiveTrKey ? (updated[effectiveTrKey] || '') : '';

      if (compVal) {
        const matched = companies.find(c => 
          c.name.toLowerCase() === compVal.toLowerCase() || 
          (c.shortName && c.shortName.toLowerCase() === compVal.toLowerCase())
        );
        const dangerClass = matched?.dangerClass || 'cok_tehlikeli';
        const { expiryDisplay } = calculateExpiryDate(dateVal, dangerClass, preferSingleDateExpiry);

        const expKeys = [
          'gecerlilik tarihi', 'geçerlilik tarihi', 'gecerlilik_tarihi', 'geçerlilik_tarihi',
          'bitiş tarihi', 'bitis tarihi', 'bitiş_tarihi', 'bitis_tarihi',
          'gecerlilik', 'geçerlilik', 'bitis', 'bitiş',
          'Geçerlilik Tarihi', 'Bitiş Tarihi'
        ];
        for (const ek of expKeys) {
          updated[ek] = expiryDisplay;
        }
      }

      return updated;
    });
  };

  const handleTrainingDateKeyChange = (newKey: string) => {
    setSelectedTrainingDateKey(newKey);
    setFillValues(prev => {
      const updated = { ...prev };
      let compVal = '';
      for (const [k, v] of Object.entries(updated)) {
        const lk = k.toLowerCase();
        if (!compVal && (lk.includes('firma') || lk.includes('kurum') || lk.includes('şirket') || lk.includes('sirket'))) {
          compVal = v;
        }
      }
      const dateVal = updated[newKey] || '';
      if (compVal) {
        const matched = companies.find(c => 
          c.name.toLowerCase() === compVal.toLowerCase() || 
          (c.shortName && c.shortName.toLowerCase() === compVal.toLowerCase())
        );
        const dangerClass = matched?.dangerClass || 'cok_tehlikeli';
        const { expiryDisplay } = calculateExpiryDate(dateVal, dangerClass, preferSingleDateExpiry);
        const expKeys = [
          'gecerlilik tarihi', 'geçerlilik tarihi', 'gecerlilik_tarihi', 'geçerlilik_tarihi',
          'bitiş tarihi', 'bitis tarihi', 'bitiş_tarihi', 'bitis_tarihi',
          'gecerlilik', 'geçerlilik', 'bitis', 'bitiş',
          'Geçerlilik Tarihi', 'Bitiş Tarihi'
        ];
        for (const ek of expKeys) {
          updated[ek] = expiryDisplay;
        }
      }
      return updated;
    });
  };

  const handleToggleSingleDateExpiry = (single: boolean) => {
    setPreferSingleDateExpiry(single);
    setFillValues(prev => {
      const updated = { ...prev };
      let compVal = '';
      for (const [k, v] of Object.entries(updated)) {
        const lk = k.toLowerCase();
        if (!compVal && (lk.includes('firma') || lk.includes('kurum') || lk.includes('şirket') || lk.includes('sirket'))) {
          compVal = v;
        }
      }
      const dateCandidates = Object.keys(updated).filter(k => {
        const lk = k.toLowerCase();
        return (lk.includes('tarih') || lk.includes('date')) && !isValidityDateField(lk);
      });
      const effectiveTrKey = selectedTrainingDateKey && updated[selectedTrainingDateKey] !== undefined
        ? selectedTrainingDateKey
        : findBestTrainingDateField(dateCandidates);
      const dateVal = effectiveTrKey ? (updated[effectiveTrKey] || '') : '';
      if (compVal) {
        const matched = companies.find(c => 
          c.name.toLowerCase() === compVal.toLowerCase() || 
          (c.shortName && c.shortName.toLowerCase() === compVal.toLowerCase())
        );
        const dangerClass = matched?.dangerClass || 'cok_tehlikeli';
        const { expiryDisplay } = calculateExpiryDate(dateVal, dangerClass, single);
        const expKeys = [
          'gecerlilik tarihi', 'geçerlilik tarihi', 'gecerlilik_tarihi', 'geçerlilik_tarihi',
          'bitiş tarihi', 'bitis tarihi', 'bitiş_tarihi', 'bitis_tarihi',
          'gecerlilik', 'geçerlilik', 'bitis', 'bitiş',
          'Geçerlilik Tarihi', 'Bitiş Tarihi'
        ];
        for (const ek of expKeys) {
          updated[ek] = expiryDisplay;
        }
      }
      return updated;
    });
  };
  
  // Signatures State
  const [signatures, setSignatures] = useState<SavedSignature[]>([]);

  // Company List State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tempCompanyInput, setTempCompanyInput] = useState('');
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [selectedDangerClassInput, setSelectedDangerClassInput] = useState<DangerClass>('cok_tehlikeli');

  // Settings View Sub-Tab & Company Form States
  const [settingsSubTab, setSettingsSubTab] = useState<'companies' | 'users' | 'signatures' | 'security' | 'backup'>('companies');
  const [singleCompanyName, setSingleCompanyName] = useState('');
  const [singleCompanyShortName, setSingleCompanyShortName] = useState('');
  const [singleCompanyDangerClass, setSingleCompanyDangerClass] = useState<DangerClass>('cok_tehlikeli');
  const [showBatchCompanyInput, setShowBatchCompanyInput] = useState(false);
  const [companyDangerFilter, setCompanyDangerFilter] = useState<'all' | DangerClass>('all');
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingCompanyName, setEditingCompanyName] = useState('');
  const [editingCompanyShortName, setEditingCompanyShortName] = useState('');

  // Training date reference selection state for multiple date fields
  const [selectedTrainingDateKey, setSelectedTrainingDateKey] = useState<string>('');
  const [preferSingleDateExpiry, setPreferSingleDateExpiry] = useState<boolean>(false);
  
  // Settings - Password State
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Settings - App System Update State
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateLogs, setUpdateLogs] = useState<{ stdout: string; stderr: string; success: boolean } | null>(null);

  // Settings - QR Code Base URL State
  const [qrBaseUrl, setQrBaseUrl] = useState(() => localStorage.getItem('vps_qr_base_url') || (window.location.origin + '/dogrula.html'));

  // Settings - Server Folders State


  


  // --- Editor State ---
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.4);
  
  const handleZoomIn = () => setScale(prev => Math.min(Number((prev + 0.05).toFixed(2)), 1.5));
  const handleZoomOut = () => setScale(prev => Math.max(Number((prev - 0.05).toFixed(2)), 0.15));
  const handleZoomFit = () => {
    if (editorContainerRef.current && activeProject) {
      const { clientWidth, clientHeight } = editorContainerRef.current;
      const padding = 60;
      const scaleX = (clientWidth - padding) / activeProject.width;
      const scaleY = (clientHeight - padding) / activeProject.height;
      setScale(Math.max(0.15, Math.min(scaleX, scaleY)));
    }
  };
  
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const projectNameInputRef = useRef<HTMLInputElement>(null);
  const htmlTemplateInputRef = useRef<HTMLInputElement>(null);

  // --- Fill State ---
  const [mobileFillStep, setMobileFillStep] = useState<0 | 1 | 2>(0);
  const [fillValues, setFillValues] = useState<Record<string, string>>({});
  const [isChatMode, setIsChatMode] = useState(true);
  const [chatHistory, setChatHistory] = useState<{id: string, sender: 'bot'|'user', text: string}[]>([]);
  const [currentChatStep, setCurrentChatStep] = useState(0);
  const [chatInputValue, setChatInputValue] = useState('');
  const [chatOptionSearch, setChatOptionSearch] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isFillSidebarOpen, setIsFillSidebarOpen] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const unifiedFieldsRef = useRef<string>('');

  // Helper to parse dates from chatInputValue
  const getSelectedDatesFromText = (text: string) => {
    const dates: string[] = [];
    if (!text) return dates;
    const parts = text.split(' - ');
    for (const part of parts) {
      const match = part.match(/^([\d.]+)\/(\d{2})\/(\d{4})$/);
      if (match) {
        const daysStr = match[1];
        const month = match[2];
        const year = match[3];
        const days = daysStr.split('.');
        for (const d of days) {
          if(d) dates.push(`${year}-${month}-${d.padStart(2, '0')}`);
        }
      }
    }
    return dates;
  };

  // Helper to format dates back to chatInputValue
  const generateTextFromDates = (dateStrings: string[]) => {
    if (!dateStrings || dateStrings.length === 0) return '';
    const sorted = [...dateStrings].sort();
    const groups: Record<string, string[]> = {};
    for (const ds of sorted) {
      const [y, m, d] = ds.split('-');
      const key = `${m}/${y}`;
      if (!groups[key]) groups[key] = [];
      const dayFormatted = d.replace(/^0+/, ''); // Remove leading zeros if preferred or keep them? 
      // User said 22.23.24. Usually if it was 01,02,03 it stayed.
      // Let's keep the day as it is but ensure it's not duplicated.
      if (!groups[key].includes(d)) groups[key].push(d);
    }
    const parts = [];
    for (const key in groups) {
      const days = groups[key].join('.');
      parts.push(`${days}/${key}`);
    }
    return parts.join(' - ');
  };

  const toggleDateSelection = (dateString: string) => {
    const currentDates = getSelectedDatesFromText(chatInputValue);
    let newDates;
    if (currentDates.includes(dateString)) {
      newDates = currentDates.filter(d => d !== dateString);
    } else {
      newDates = [...currentDates, dateString];
    }
    setChatInputValue(generateTextFromDates(newDates));
  };

  // --- PERSISTENCE ---
  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      let data: any = null;
      let isNetworkError = false;
      try {
        const token = localStorage.getItem('vps_session_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(getApiUrl('/api/data'), { headers });
        if (res.ok) {
          data = await res.json();
          console.log("FETCHED DATA FROM API:", data);
        } else {
          isNetworkError = true;
          console.warn("API responded with not ok:", res.status);
        }
      } catch (error) {
        console.warn("API network error:", error);
        isNetworkError = true;
      }

      if (isNetworkError) {
          setApiFetchFailed(true);
      }

      if (data) {
          if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
              console.log("Setting projects from API data", data.projects.length);
              setProjects(data.projects);
              setActiveProjectId(data.projects[0].id);
          } else if (!isNetworkError) {
              console.log("Projects invalid or empty, creating new default project");
              const newP = createNewProject('Yeni Sertifika Projesi');
              setProjects([newP]);
              setActiveProjectId(newP.id);
          }
          
          if (data.signatures) setSignatures(data.signatures);
          if (data.companies) setCompanies(data.companies);
                } else if (!isNetworkError) {
          console.log("Data completely invalid or empty, creating new default project");
          const newP = createNewProject('Yeni Sertifika Projesi');
          setProjects([newP]);
          setActiveProjectId(newP.id);
      }
      setIsDataLoaded(true);
    };
    fetchData();
  }, []);

  // Save data on change
  useEffect(() => {
    if (!isDataLoaded || apiFetchFailed) return;

    const saveData = async () => {
      const token = localStorage.getItem('vps_session_token');
      if (!token) return; // Only admin changes are saved to server

      const dataObj = { projects, signatures, companies };
      console.log("SAVING DATA TO API:", dataObj);
      
      try {
        const result = await fetch(getApiUrl('/api/data'), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(dataObj)
        });
        if (result.status === 401) {
          handleLogout();
          return;
        }
        console.log("SAVE DATA RESULT:", await result.text());
      } catch (error) {
        console.error("Failed to save data to API:", error);
      }
    };

    const timer = setTimeout(saveData, 2500);
    return () => clearTimeout(timer);
  }, [projects, signatures, companies, isDataLoaded]);

  useEffect(() => {
     if (isDataLoaded && !projects.find(p => p.id === activeProjectId) && projects.length > 0) {
        setActiveProjectId(projects[0].id);
     }
  }, [projects, activeProjectId, isDataLoaded]);

  useEffect(() => {
    if (isEditingName && projectNameInputRef.current) {
        projectNameInputRef.current.focus();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (currentView !== 'template' || !activeProject) return;

    const handleResize = () => {
      if (editorContainerRef.current) {
        const { clientWidth, clientHeight } = editorContainerRef.current;
        const padding = 80;
        const scaleX = (clientWidth - padding) / activeProject.width;
        const scaleY = (clientHeight - padding) / activeProject.height;
        setScale(Math.min(scaleX, scaleY));
      }
    };
    const debouncedResize = () => requestAnimationFrame(handleResize);
    
    setTimeout(handleResize, 100);
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [activeProject?.width, activeProject?.height, currentView]);

  // --- Functions ---
  const normalizeKey = (key: string) => {
      return key.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
  };

  const turkishToLower = (str: string): string => {
      if (!str) return '';
      return str
          .replace(/İ/g, 'i')
          .replace(/I/g, 'ı')
          .replace(/Ğ/g, 'ğ')
          .replace(/Ü/g, 'ü')
          .replace(/Ş/g, 'ş')
          .replace(/Ö/g, 'ö')
          .replace(/Ç/g, 'ç')
          .toLocaleLowerCase('tr-TR');
  };

  const maskTCKN = (tckn: string) => {
      if (!tckn || tckn.length < 5) return tckn;
      const first2 = tckn.substring(0, 2);
      const last2 = tckn.substring(tckn.length - 2);
      const mask = '*'.repeat(tckn.length - 4);
      return `${first2}${mask}${last2}`;
  };

  const updateProjectSide = (side: Side, updates: Partial<CertificateSide>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
          const sideKey = side === 'front' ? 'front' : 'back';
          return {
              ...p,
              [sideKey]: { ...p[sideKey], ...updates }
          };
      }
      return p;
    }));
  };

  const handleAddBackgroundVariant = (side: Side, url: string, name?: string) => {
    if (!activeProjectId) return;
    const variantsKey = side === 'front' ? 'frontVariants' : 'backVariants';
    const selectedIdKey = side === 'front' ? 'selectedFrontId' : 'selectedBackId';
    
    const variantName = name || prompt(`${side === 'front' ? 'Ön' : 'Arka'} varyant ismi:`, `Yeni Varyant`);
    if (!variantName) return;

    const newId = `bg-var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newVariant: BackgroundVariant = {
        id: newId,
        name: variantName,
        bgUrl: url
    };

    setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
            return {
                ...p,
                [variantsKey]: [...(p[variantsKey] || []), newVariant],
                [selectedIdKey]: newId
            };
        }
        return p;
    }));
  };

  const handleRenameVariant = (side: Side, id: string, name: string) => {
      const variantsKey = side === 'front' ? 'frontVariants' : 'backVariants';
      setProjects(prev => prev.map(p => {
          if (p.id === activeProjectId) {
              const variants = p[variantsKey] || [];
              const newVariants = variants.map(v => v.id === id ? { ...v, name } : v);
              return { ...p, [variantsKey]: newVariants };
          }
          return p;
      }));
  };

  const handleDeleteVariant = (side: Side, id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const variantsKey = side === 'front' ? 'frontVariants' : 'backVariants';
      const selectedIdKey = side === 'front' ? 'selectedFrontId' : 'selectedBackId';
      
      if (confirm("Bu arkaplan seçeneğini silmek istediğinize emin misiniz?")) {
          setProjects(prev => prev.map(p => {
              if (p.id === activeProjectId) {
                   const newVariants = (p[variantsKey] || []).filter(v => v.id !== id);
                   let newSelectedId = p[selectedIdKey] === id ? (newVariants[0]?.id || undefined) : p[selectedIdKey];
                   return {
                       ...p,
                       [variantsKey]: newVariants,
                       [selectedIdKey]: newSelectedId
                   };
              }
              return p;
          }));
      }
  };

  const handleSelectVariant = (side: Side, id: string) => {
      const selectedIdKey = side === 'front' ? 'selectedFrontId' : 'selectedBackId';
      updateProjectMeta({ [selectedIdKey]: id });
  };

  const updateProjectMeta = (updates: Partial<CertificateProject>) => {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
            return { ...p, ...updates };
        }
        return p;
      }));
  };

  const updateProjectElements = (side: Side, newElements: CanvasElement[]) => {
    updateProjectSide(side, { elements: newElements });
  };

  const handleOrientationChange = (orientation: 'landscape' | 'portrait') => {
      const currentIsLandscape = activeProject.width > activeProject.height;
      
      if ((orientation === 'landscape' && currentIsLandscape) || 
          (orientation === 'portrait' && !currentIsLandscape)) {
          return;
      }
      updateProjectMeta({
          width: activeProject.height,
          height: activeProject.width
      });
  };

  const togglePreviewSide = (projectId: string) => {
      setPreviewSides(prev => ({
          ...prev,
          [projectId]: prev[projectId] === 'back' ? 'front' : 'back'
      }));
  };

  const getProjectLabels = () => {
    const labelMap = new Map<string, string>(); 
    const activeBack = getActiveSideData(activeProject, 'back');
    [activeProject?.front, activeBack].forEach(side => {
        if (!side) return;
        side.elements.forEach(el => {
            if (el.label) {
                const norm = normalizeKey(el.label);
                if (el.type === ElementType.TEXT || el.type === ElementType.DROPDOWN || el.type === ElementType.SIGNATURE || el.type === ElementType.TCKN || el.type === ElementType.COMPANY || el.type === ElementType.CHOICE_BOX || el.type === ElementType.DATE) {
                    if (!labelMap.has(norm)) labelMap.set(norm, el.label);
                }
                if (el.type === ElementType.COMPANY) {
                    const shortKey = normalizeKey(`${el.label}_Kisa`);
                    if (!labelMap.has(shortKey)) labelMap.set(shortKey, `${el.label}_Kisa`);
                }
            }
        });
    });
    return Array.from(labelMap.values());
  };

  // --- CRUD Actions ---
  const handleCreateProject = () => {
    const newP = createNewProject(`Sertifika - ${new Date().toLocaleTimeString()}`);
    setProjects(prev => [...prev, newP]);
    setActiveProjectId(newP.id);
    setCurrentView('template');
  };

  const handleDuplicateProject = (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const projectToClone = projects.find(p => p.id === id);
      if (!projectToClone) return;
      const newProject: CertificateProject = {
          ...JSON.parse(JSON.stringify(projectToClone)),
          id: Date.now().toString(),
          name: `${projectToClone.name} (Kopya)`,
          createdAt: Date.now(),
          isActive: true
      };
      setProjects(prev => [...prev, newProject]);
  };

  const handleToggleProjectActive = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        const nextActive = p.isActive === false ? true : false;
        return { ...p, isActive: nextActive };
      }
      return p;
    }));
    // If the project is set to passive, remove it from fill selections immediately
    setSelectedFillProjectIds(prev => prev.filter(pid => pid !== id));
  };

  const handleDeleteProject = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (projects.length <= 1) {
      alert("En az bir proje kalmalıdır. Silmeden önce yeni bir proje oluşturun.");
      return;
    }
    if (confirm("Bu projeyi kalıcı olarak silmek istediğinize emin misiniz?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      setSelectedFillProjectIds(prev => prev.filter(pid => pid !== id));
    }
  };

  // --- Element Management ---
  const handleVariantUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
            const url = evt.target.result as string;
            const defaultName = file.name.split('.')[0] || `Varyant ${index + 1}`;
            handleAddBackgroundVariant(activeSide, url, defaultName);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
            const url = evt.target.result as string;
            setProjects(prev => prev.map(p => {
                if (p.id === activeProjectId) {
                    const sideKey = activeSide === 'front' ? 'front' : 'back';
                    const variantsKey = activeSide === 'front' ? 'frontVariants' : 'backVariants';
                    const selectedIdKey = activeSide === 'front' ? 'selectedFrontId' : 'selectedBackId';
                    
                    if (p[selectedIdKey]) {
                        return {
                            ...p,
                            [variantsKey]: (p[variantsKey] || []).map(v => v.id === p[selectedIdKey] ? { ...v, bgUrl: url } : v)
                        };
                    } else {
                        return {
                            ...p,
                            [sideKey]: { ...p[sideKey], bgUrl: url }
                        };
                    }
                }
                return p;
            }));
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const addElement = (type: ElementType) => {
    if (type === ElementType.IMAGE) {
      logoInputRef.current?.click();
      return;
    }
    const content = type === ElementType.TEXT ? '{METİN}' 
                    : (type === ElementType.DROPDOWN ? '{SEÇENEK}' 
                    : (type === ElementType.COMPANY ? '{FİRMA}' 
                    : (type === ElementType.TCKN ? '{TCKN}' 
                    : (type === ElementType.CHOICE_BOX ? 'Evet' 
                    : (type === ElementType.DATE ? '{Eğitim Tarihi}'
                    : (type === ElementType.QRCODE ? '{Sistem URL}?id={Seri No}' : ''))))));
    
    const width = (type === ElementType.SIGNATURE || type === ElementType.QRCODE) ? 200 : (type === ElementType.CHOICE_BOX ? 40 : (type === ElementType.DATE ? 320 : 400));
    const height = (type === ElementType.SIGNATURE) ? 100 : (type === ElementType.QRCODE ? 200 : (type === ElementType.CHOICE_BOX ? 40 : (type === ElementType.DATE ? 60 : 100)));
    
    const newEl: CanvasElement = {
      id: Date.now().toString(),
      type,
      content,
      x: activeProject.width / 2 - (width/2),
      y: activeProject.height / 2 - (height/2),
      width,
      height,
      fontSize: type === ElementType.DATE ? 48 : 60,
      fontFamily: FontStyle.SANS,
      color: '#000000',
      label: type === ElementType.TEXT ? 'Metin' 
              : (type === ElementType.SIGNATURE ? 'İmza' 
              : (type === ElementType.DROPDOWN ? 'Seçenek' 
              : (type === ElementType.COMPANY ? 'Firma'
              : (type === ElementType.TCKN ? 'TC Kimlik No'
              : (type === ElementType.CHOICE_BOX ? 'Seçim Kutusu'
              : (type === ElementType.DATE ? 'Eğitim Tarihi'
              : (type === ElementType.QRCODE ? 'QR' : 'Görsel'))))))),
      options: type === ElementType.DROPDOWN ? [] : (type === ElementType.CHOICE_BOX ? ['Evet', 'Hayır'] : undefined),
      fontWeight: 400,
      fontStyle: 'normal',
      textAlign: 'center',
      dateKind: type === ElementType.DATE ? 'training' : undefined,
      secondaryX: type === ElementType.CHOICE_BOX ? (activeProject.width / 2 - (width/2)) + 150 : undefined,
      secondaryY: type === ElementType.CHOICE_BOX ? (activeProject.height / 2 - (height/2)) : undefined,
    };

    const sideData = getActiveSideData(activeProject, activeSide);
    const currentElements = sideData?.elements || [];
    updateProjectElements(activeSide, [...currentElements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
           const img = new Image();
           img.src = evt.target.result as string;
           img.onload = () => {
             const baseW = 300;
             const baseH = (img.height / img.width) * baseW;
             const newEl: CanvasElement = {
                id: Date.now().toString(),
                type: ElementType.IMAGE,
                content: evt.target!.result as string,
                x: activeProject.width / 2 - 150,
                y: activeProject.height / 2 - (baseH/2),
                width: baseW,
                height: baseH,
                label: 'Logo'
             };
             const sideData = getActiveSideData(activeProject, activeSide);
             const currentElements = sideData?.elements || [];
             updateProjectElements(activeSide, [...currentElements, newEl]);
           };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    const sideData = getActiveSideData(activeProject, activeSide);
    const elements = sideData?.elements || [];
    const newElements = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    updateProjectElements(activeSide, newElements);
  };

  const deleteElement = (id: string) => {
    const sideData = getActiveSideData(activeProject, activeSide);
    const elements = sideData?.elements || [];
    updateProjectElements(activeSide, elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId || currentView !== 'template') return;
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) return;

      const step = e.shiftKey ? 10 : 1; 
      let dx = 0; let dy = 0;
      if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else return; 
      e.preventDefault();
      const sideData = getActiveSideData(activeProject, activeSide);
      const currentElement = sideData?.elements.find(el => el.id === selectedId);
      if (currentElement) {
          const updates: Partial<CanvasElement> = { x: currentElement.x + dx, y: currentElement.y + dy };
          if (currentElement.type === ElementType.CHOICE_BOX) {
              updates.secondaryX = (currentElement.secondaryX || currentElement.x) + dx;
              updates.secondaryY = (currentElement.secondaryY || currentElement.y) + dy;
          }
          updateElement(selectedId, updates);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, activeProjectId, activeSide, projects, currentView]); 

  // --- Unified Fill Logic ---
  const getUnifiedFillFields = () => {
    const fields: Record<string, { 
        type: ElementType | 'bg_front' | 'bg_back', 
        label: string, 
        displayLabel: string, 
        projectId?: string,
        side?: 'front' | 'back',
        variantOptions?: { id: string; name: string }[],
        allowedSignatureIds?: string[],
        options?: string[],
        defaultValue?: string,
        dateKind?: 'training' | 'validity'
    }> = {};
    const targetProjects = projects.filter(p => selectedFillProjectIds.includes(p.id));

    // 1. Arka Plan / Tasarım Soruları (Birden fazla arkaplanı olan projeler için doğrudan soru olarak eklenir)
    targetProjects.forEach(proj => {
        if (proj.frontVariants && proj.frontVariants.length > 0) {
            const key = `bg_front_${proj.id}`;
            const displayLabel = targetProjects.length > 1 
                ? `${proj.name} Ön Yüz Tasarımı / Arkaplanı` 
                : 'Ön Yüz Tasarımı / Arkaplanı';
            const variantOptions = [
                { id: 'DEFAULT', name: 'Varsayılan Tasarım' },
                ...proj.frontVariants.map(v => ({ id: v.id, name: v.name }))
            ];
            fields[key] = {
                type: 'bg_front',
                label: key,
                displayLabel: displayLabel,
                projectId: proj.id,
                side: 'front',
                variantOptions: variantOptions,
                options: variantOptions.map(v => v.name),
                defaultValue: projectFrontSelections[proj.id] || 'DEFAULT'
            };
        }
        if (proj.backVariants && proj.backVariants.length > 0) {
            const key = `bg_back_${proj.id}`;
            const displayLabel = targetProjects.length > 1 
                ? `${proj.name} Arka Yüz Tasarımı / Arkaplanı` 
                : 'Arka Yüz Tasarımı / Arkaplanı';
            const variantOptions = [
                { id: 'DEFAULT', name: 'Varsayılan Arka Tasarım' },
                ...proj.backVariants.map(v => ({ id: v.id, name: v.name }))
            ];
            fields[key] = {
                type: 'bg_back',
                label: key,
                displayLabel: displayLabel,
                projectId: proj.id,
                side: 'back',
                variantOptions: variantOptions,
                options: variantOptions.map(v => v.name),
                defaultValue: projectBackSelections[proj.id] || 'DEFAULT'
            };
        }
    });

    // 2. Sertifika Üzerindeki Dinamik Alanlar
    targetProjects.forEach(proj => {
        const activeBack = getActiveSideData(proj, 'back');
        [proj.front, activeBack].forEach(side => {
            if (!side) return;
            side.elements.forEach(el => {
                const rawLabelOriginal = el.label || el.id;
                const normalizeCheck = normalizeKey(rawLabelOriginal);
                if (normalizeCheck === normalizeKey('Seri No') || normalizeCheck === normalizeKey('Seri Numarasi') || normalizeCheck === normalizeKey('Sertifika No')) return;

                if (el.type === ElementType.SIGNATURE || el.type === ElementType.DROPDOWN || el.type === ElementType.COMPANY || el.type === ElementType.CHOICE_BOX || el.type === ElementType.TCKN || el.type === ElementType.DATE) {
                    const rawLabel = el.label || el.id;
                    const key = normalizeKey(rawLabel); 
                    const structuredField = {
                        type: el.type,
                        label: key,
                        displayLabel: rawLabel, 
                        allowedSignatureIds: el.allowedSignatureIds,
                        options: el.options,
                        defaultValue: el.content,
                        dateKind: el.dateKind || (el.type === ElementType.DATE ? 'training' : undefined)
                    };
                    if (!fields[key]) fields[key] = structuredField;
                    else if (fields[key].type === ElementType.TEXT) fields[key] = structuredField;
                    else if (fields[key].type === el.type) {
                        if (el.allowedSignatureIds) fields[key].allowedSignatureIds = Array.from(new Set([...(fields[key].allowedSignatureIds || []), ...el.allowedSignatureIds]));
                        if (el.options) fields[key].options = Array.from(new Set([...(fields[key].options || []), ...el.options]));
                        if (el.dateKind) fields[key].dateKind = el.dateKind;
                    }
                }
                if (el.type === ElementType.TEXT || el.type === ElementType.QRCODE) {
                    const regex = /{([^{}]+)}/g;
                    let match;
                    while ((match = regex.exec(el.content)) !== null) {
                        const rawKey = match[1];
                        const key = normalizeKey(rawKey); 
                        if (key.endsWith('_kisa') || key === normalizeKey('Sistem URL') || key === normalizeKey('Seri No') || key === normalizeKey('Seri Numarasi') || key === normalizeKey('Sertifika No')) continue; 
                        if (!fields[key]) fields[key] = { type: ElementType.TEXT, label: key, displayLabel: rawKey.trim(), dateKind: el.dateKind };
                    }
                }
            });
        });
    });
    return Object.values(fields);
  };

  // --- Chat Mode Logic ---
  useEffect(() => {
    const fields = getUnifiedFillFields();
    const fieldsKey = fields.map(f => f.label).join(',');
    
    if (fieldsKey !== unifiedFieldsRef.current) {
      const isInitial = !unifiedFieldsRef.current;
      unifiedFieldsRef.current = fieldsKey;
      if (fields.length === 0) {
        setChatHistory([{ id: Date.now().toString(), sender: 'bot', text: 'Lütfen doldurmak için sol panelden sertifika seçin.' }]);
        setCurrentChatStep(0);
      } else {
        setFillValues(prevFill => {
            let nextIndex = 0;
            while (nextIndex < fields.length && (prevFill[fields[nextIndex].label] !== undefined && prevFill[fields[nextIndex].label] !== '')) {
                nextIndex++;
            }
            setCurrentChatStep(nextIndex);
            
            setChatHistory(prevHistory => {
               const newHistory = isInitial ? [] : [...prevHistory];
               const firstField = fields[0];
               const isFirstChoiceOrBg = firstField && (firstField.type === 'bg_front' || firstField.type === 'bg_back' || firstField.type === ElementType.DROPDOWN || firstField.type === ElementType.CHOICE_BOX);
               if (isInitial && nextIndex === 0) {
                   newHistory.push({ 
                     id: Date.now().toString(), 
                     sender: 'bot', 
                     text: `Merhaba! Seçili sertifika için ${fields.length} soruluk doldurma işlemine başlayalım. İlk olarak, lütfen **${firstField.displayLabel}** ${isFirstChoiceOrBg ? 'seçiniz:' : 'giriniz:'}` 
                   });
               } else if (nextIndex < fields.length) {
                   const curr = fields[nextIndex];
                   const isCurrChoiceOrBg = curr.type === 'bg_front' || curr.type === 'bg_back' || curr.type === ElementType.DROPDOWN || curr.type === ElementType.CHOICE_BOX;
                   newHistory.push({ 
                     id: Date.now().toString(), 
                     sender: 'bot', 
                     text: `Lütfen **${curr.displayLabel}** ${isCurrChoiceOrBg ? 'seçiniz:' : 'giriniz:'}` 
                   });
               } else {
                   newHistory.push({ id: Date.now().toString(), sender: 'bot', text: `Tüm gerekli bilgileri girdiniz. Sağ alt köşeden PDF oluşturabilirsiniz.` });
               }
               return newHistory;
            });
            return prevFill;
        });
      }
    }
  }, [selectedFillProjectIds, projects]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isChatMode]);

  const handleChatSubmit = (value: string, displayLabel?: string, isSkip: boolean = false) => {
    if (!value.trim() && !isSkip) return;
    const fields = getUnifiedFillFields();
    const currentField = fields[currentChatStep];
    if (!currentField) return;

    let actualValue = value;
    let userDisplay = displayLabel || value;

    // Arkaplan seçimi sorusu ise state'leri ve seçimi senkronize et
    if ((currentField.type === 'bg_front' || currentField.type === 'bg_back') && currentField.variantOptions) {
        if (!displayLabel) {
            const raw = value.trim();
            const matched = currentField.variantOptions.find(vo => 
                vo.id === raw || turkishToLower(vo.name) === turkishToLower(raw)
            );
            if (matched) {
                actualValue = matched.id;
                userDisplay = matched.name;
            } else if (turkishToLower(raw).includes('varsay') || turkishToLower(raw).includes('standart') || turkishToLower(raw).includes('normal') || turkishToLower(raw).includes('default')) {
                actualValue = 'DEFAULT';
                userDisplay = currentField.variantOptions[0]?.name || 'Varsayılan Tasarım';
            } else {
                const partial = currentField.variantOptions.find(vo => 
                    turkishToLower(vo.name).includes(turkishToLower(raw))
                );
                if (partial) {
                    actualValue = partial.id;
                    userDisplay = partial.name;
                }
            }
        }
        if (currentField.type === 'bg_front' && currentField.projectId) {
            setProjectFrontSelections(prev => ({ ...prev, [currentField.projectId!]: actualValue }));
        }
        if (currentField.type === 'bg_back' && currentField.projectId) {
            setProjectBackSelections(prev => ({ ...prev, [currentField.projectId!]: actualValue }));
        }
    }

    const userText = isSkip ? "(Cevapsız Bırakıldı)" : userDisplay;
    const newHistory = [...chatHistory, { id: Date.now().toString(), sender: 'user' as const, text: userText }];

    if (!isSkip) {
      handleFillFieldChange(currentField.label, actualValue, currentField.type as ElementType);
    } else {
      handleFillFieldChange(currentField.label, '', currentField.type as ElementType);
    }

    const nextStep = currentChatStep + 1;
    setCurrentChatStep(nextStep);

    if (nextStep < fields.length) {
      const nextField = fields[nextStep];
      const isChoiceOrBg = nextField.type === 'bg_front' || nextField.type === 'bg_back' || nextField.type === ElementType.DROPDOWN || nextField.type === ElementType.CHOICE_BOX;
      newHistory.push({ 
        id: (Date.now() + 1).toString(), 
        sender: 'bot' as const, 
        text: `Teşekkürler. Şimdi lütfen **${nextField.displayLabel}** ${isChoiceOrBg ? 'seçiniz:' : 'giriniz:'}` 
      });
    } else {
      newHistory.push({ id: (Date.now() + 1).toString(), sender: 'bot' as const, text: `Harika! Tüm bilgileri aldım. Sağ alt köşeden PDF oluşturabilirsiniz.` });
    }

    setChatHistory(newHistory);
    setChatInputValue('');
    setChatOptionSearch('');
  };

  const handleChatUndo = () => {
    if (currentChatStep === 0) return;
    const prevStep = currentChatStep - 1;
    setCurrentChatStep(prevStep);
    
    setChatHistory(prev => prev.slice(0, Math.max(1, prev.length - 2)));
    
    const fields = getUnifiedFillFields();
    if (fields[prevStep]) {
      const prevField = fields[prevStep];
      setFillValues(prev => {
        const next = { ...prev };
        delete next[prevField.label];
        return next;
      });
      if (prevField.type === 'bg_front' && prevField.projectId) {
        setProjectFrontSelections(prev => {
            const next = { ...prev };
            delete next[prevField.projectId!];
            return next;
        });
      }
      if (prevField.type === 'bg_back' && prevField.projectId) {
        setProjectBackSelections(prev => {
            const next = { ...prev };
            delete next[prevField.projectId!];
            return next;
        });
      }
    }
    setChatInputValue('');
    setChatOptionSearch('');
  };

  if (!isAuthenticated) {
    return (
      <LoginView 
        onLoginSuccess={(user) => {
          setSessionUser(user);
          setCurrentView(user.role === 'admin' ? 'dashboard' : 'fill');
          fetchCertificatesAndStats();
        }}
        getApiUrl={getApiUrl}
      />
    );
  }

  if (!isDataLoaded) {
      return (
          <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Yükleniyor...</p>
                  <button onClick={() => window.location.reload()} className="mt-4 text-xs text-slate-500 hover:text-white underline">Uzun sürdüyse tıklayın</button>
              </div>
          </div>
      );
  }

  if (!activeProject) {
      return (
          <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
              <div className="text-center p-8 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
                  <AlertTriangle className="mx-auto mb-4 text-amber-500" size={48} />
                  <h2 className="text-xl font-bold mb-2">Proje Yüklenemedi</h2>
                  <p className="text-slate-400 mb-6">Veriler yüklenirken bir sorun oluştu veya proje bulunamadı.</p>
                  <button 
                      onClick={() => {
                          const newP = createNewProject('Yeni Sertifika Projesi');
                          setProjects([newP]);
                          setActiveProjectId(newP.id);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-bold transition"
                  >
                      Yeni Proje Oluştur ve Sıfırla
                  </button>
              </div>
          </div>
      );
  } 

  // --- Modals & Options ---
  const toggleAllowedSignature = (elementId: string, sigId: string) => {
      const sideData = getActiveSideData(activeProject, activeSide);
      const element = sideData?.elements.find(el => el.id === elementId);
      if (!element) return;
      const currentAllowed = element.allowedSignatureIds || [];
      let newAllowed;
      if (currentAllowed.includes(sigId)) newAllowed = currentAllowed.filter(id => id !== sigId);
      else newAllowed = [...currentAllowed, sigId];
      updateElement(elementId, { allowedSignatureIds: newAllowed });
  };

  const addOption = (elementId: string) => {
      if (!tempOptionInput.trim()) return;
      const sideData = getActiveSideData(activeProject, activeSide);
      const element = sideData?.elements.find(el => el.id === elementId);
      if (!element) return;
      const currentOptions = element.options || [];
      updateElement(elementId, { options: [...currentOptions, tempOptionInput.trim()] });
      setTempOptionInput('');
  };

  const removeOption = (elementId: string, index: number) => {
      const sideData = getActiveSideData(activeProject, activeSide);
      const element = sideData?.elements.find(el => el.id === elementId);
      if (!element || !element.options) return;
      const newOptions = element.options.filter((_, i) => i !== index);
      updateElement(elementId, { options: newOptions });
  };

  const addCompany = (input: string, defaultDanger: DangerClass = selectedDangerClassInput) => {
      if (!input.trim()) return;
      const lines = input.split('\n').map(n => n.trim()).filter(n => n.length > 0);
      const newCompanies: Company[] = [];
      lines.forEach(line => {
          let name = line; 
          let short = line;
          let danger: DangerClass = defaultDanger;
          if (line.includes('|')) {
              const parts = line.split('|');
              name = parts[0].trim();
              short = parts[1]?.trim() || name;
              if (parts[2]) {
                  const p2 = parts[2].trim().toLowerCase();
                  if (p2.includes('cok') || p2.includes('çok')) danger = 'cok_tehlikeli';
                  else if (p2.includes('az')) danger = 'az_tehlikeli';
                  else if (p2.includes('tehlike')) danger = 'tehlikeli';
              }
          }
          const years = getValidityYears(danger);
          newCompanies.push({ 
            id: Date.now().toString() + Math.random(), 
            name: name, 
            shortName: short,
            dangerClass: danger,
            validityYears: years
          });
      });
      setCompanies(prev => {
          const existingNames = new Set(prev.map(p => p.name));
          const uniqueNew = newCompanies.filter(c => !existingNames.has(c.name));
          return [...prev, ...uniqueNew]; 
      });
      setTempCompanyInput('');
  };

  const handleAddSingleCompany = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!singleCompanyName.trim()) return;

    const trimmedName = singleCompanyName.trim();
    const shortName = singleCompanyShortName.trim() || 
      trimmedName.split(' ').slice(0, 2).join('_').toUpperCase().replace(/[^a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]/g, '');

    const years = getValidityYears(singleCompanyDangerClass);
    const newCompany: Company = {
      id: Date.now().toString() + '.' + Math.random().toString().slice(2, 6),
      name: trimmedName,
      shortName,
      dangerClass: singleCompanyDangerClass,
      validityYears: years,
      createdAt: Date.now()
    };

    setCompanies(prev => [newCompany, ...prev.filter(c => c.name.toLowerCase() !== trimmedName.toLowerCase())]);
    setSingleCompanyName('');
    setSingleCompanyShortName('');
  };

  const handleStartEditCompany = (company: Company) => {
    setEditingCompanyId(company.id);
    setEditingCompanyName(company.name);
    setEditingCompanyShortName(company.shortName || '');
  };

  const handleSaveEditCompany = (companyId: string) => {
    if (!editingCompanyName.trim()) return;
    setCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        return {
          ...c,
          name: editingCompanyName.trim(),
          shortName: editingCompanyShortName.trim() || editingCompanyName.trim()
        };
      }
      return c;
    }));
    setEditingCompanyId(null);
  };

  const removeCompany = (id: string) => {
      setCompanies(prev => prev.filter(c => c.id !== id));
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((item) => {
        const file = item as File;
        const reader = new FileReader();
        reader.onload = (evt) => {
            if (evt.target?.result) {
                setSignatures(prev => [...prev, {
                    id: Date.now().toString() + Math.random(),
                    name: file.name.split('.')[0],
                    url: evt.target!.result as string
                }]);
            }
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const handleSignatureDrawSave = (dataUrl: string) => {
      setSignatures(prev => [...prev, {
          id: Date.now().toString(),
          name: `İmza ${new Date().toLocaleTimeString()}`,
          url: dataUrl
      }]);
      setShowSignaturePad(false);
  };

  const deleteSignature = (id: string) => {
      setSignatures(prev => prev.filter(s => s.id !== id));
  };
  
  const handlePasswordChange = async () => {
      if (newPassword.trim() === '') {
          setPasswordMessage('Lütfen geçerli bir şifre girin.');
          return;
      }
      try {
          const token = localStorage.getItem('vps_session_token');
          const res = await fetch(getApiUrl('/api/change-password'), {
              method: 'POST',
              headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ newPassword })
          });
          if (res.status === 401) {
             localStorage.removeItem('vps_session');
             localStorage.removeItem('vps_session_token');
             window.location.reload();
             return;
          }
          const data = await res.json();
          if (data.success) {
              setPasswordMessage('Şifre başarıyla güncellendi!');
              setNewPassword('');
          } else {
              setPasswordMessage('Şifre güncellenemedi: ' + data.error);
          }
      } catch (e) {
          setPasswordMessage('Sunucu ile iletişim kurulamadı.');
      }
      setTimeout(() => setPasswordMessage(''), 3000);
  };

  const handleUpdateApp = async () => {
      setIsUpdating(true);
      setUpdateMessage('GitHub güncellemesi çekiliyor ve derleniyor... Lütfen bekleyin.');
      setUpdateLogs(null);
      
      try {
          const token = localStorage.getItem('vps_session_token');
          const res = await fetch(getApiUrl('/api/update-app'), {
              method: 'POST',
              headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`
              }
          });
          
          if (res.status === 401) {
             localStorage.removeItem('vps_session');
             localStorage.removeItem('vps_session_token');
             window.location.reload();
             return;
          }
          
          const data = await res.json();
          if (res.ok && data.success) {
              setUpdateMessage(data.message || 'Güncelleme başarıyla uygulandı! Sayfa 5 saniye içinde yenilenecektir...');
              setUpdateLogs({ stdout: data.stdout, stderr: data.stderr, success: true });
              setTimeout(() => {
                  window.location.reload();
              }, 5000);
          } else {
              setUpdateMessage('Güncelleme başarısız oldu. Log detayını aşağıda görebilirsiniz.');
              setUpdateLogs({ 
                  stdout: data.stdout || '', 
                  stderr: data.stderr || data.error || 'Bilinmeyen bir sunucu hatası.',
                  success: false 
              });
          }
      } catch (e: any) {
          // It's possible the server killed itself to restart, so we show success if it responded nicely, 
          // but if we caught an error while updating, we inform the user to check back.
          setUpdateMessage('Sunucu ile bağlantı kesildi. (Güncelleme başarılı olup yeniden başlatılıyor olabilir.)');
          setUpdateLogs({ 
              stdout: 'Bağlantı koptu.', 
              stderr: e.message || 'Sunucu yeniden başlıyor...', 
              success: true 
          });
          setTimeout(() => {
              window.location.reload();
          }, 6000);
      } finally {
          setIsUpdating(false);
      }
  };

  // --- IMPORT/EXPORT LOGIC ---
  
  const handleSaveTemplateAsHTML = async () => {
     const json = JSON.stringify(activeProject, null, 2);
     const blob = new Blob([json], { type: 'application/json' });
     await downloadFile(blob, `Sertifika_Sablon_${activeProject.name.replace(/\s+/g, '_')}.json`, 'application/json');
  };

  const handleImportHTMLTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (evt) => {
         try {
             const parsed = JSON.parse(evt.target?.result as string);
             if (parsed.id && parsed.front) {
                 const newProject = { ...parsed, id: Date.now().toString(), name: parsed.name + ' (İçe Aktarılan)' };
                 setProjects(prev => [...prev, newProject]);
                 setActiveProjectId(newProject.id);
                 alert('Şablon başarıyla yüklendi!');
             } else {
                 alert('Geçersiz şablon dosyası.');
             }
         } catch(e) { console.error(e); alert('Dosya okunamadı.'); }
     };
     reader.readAsText(file);
     e.target.value = '';
  };

  // FULL SYSTEM BACKUP EXPORT
  const handleExportBackup = async () => {
    try {
        const backupData = {
            version: APP_VERSION,
            timestamp: Date.now(),
            projects,
            signatures,
            companies
        };
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        // Fix filename to be safe for Windows filesystems (no colons)
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        await downloadFile(blob, `ProCertify_Yedek_${dateStr}.json`, 'application/json');
    } catch (error) {
        console.error("Yedekleme hatası:", error);
        alert("Yedek dosyası oluşturulurken bir hata oluştu.");
    }
  };

  // FIXED: FULL SYSTEM BACKUP IMPORT
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Explicit confirm
    if(!confirm("DİKKAT: Bu işlem mevcut tüm projelerinizi ve ayarlarınızı SİLECEK ve yedek dosyasındakileri yükleyecektir.\n\nDevam etmek istiyor musunuz?")) {
        if(e.target) e.target.value = ''; // Reset input so same file can be selected again
        return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const jsonString = evt.target?.result as string;
            const data = JSON.parse(jsonString);

            // Basic Validation
            if(!data.projects || !Array.isArray(data.projects)) {
                throw new Error("Geçersiz yedek dosyası formatı.");
            }

            const dataObj = {
                projects: data.projects,
                signatures: data.signatures || [],
                companies: data.companies || [],
                            };

            // Save to API backend if available
            try {
                const token = localStorage.getItem('vps_session_token');
                const res = await fetch(getApiUrl('/api/data'), {
                    method: 'POST',
                    headers: { 
                       'Content-Type': 'application/json',
                       'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(dataObj)
                });
                if (res.status === 401) {
                  localStorage.removeItem('vps_session');
                  localStorage.removeItem('vps_session_token');
                  window.location.reload();
                  return;
                }
                if (!res.ok) {
                    throw new Error("Server rejected the data. Status: " + res.status);
                }
            } catch (error) {
                console.error("Failed to save imported backup to API", error);
                alert("Uyarı: Sunucuya kaydedilemedi!\n" + String(error));
            }

            // Update state
            setProjects(data.projects);
            setSignatures(dataObj.signatures);
            setCompanies(dataObj.companies);
            
            if (data.projects && data.projects.length > 0) {
                setActiveProjectId(data.projects[0].id);
            }
            
            alert("Yedek başarıyla yüklendi!");
            window.location.reload();

        } catch(e) {
            console.error("Backup Import Error:", e);
            alert("Hata: Yedek dosyası okunamadı veya bozuk. Lütfen geçerli bir .json dosyası seçin.");
        } finally {
             // Reset input value to allow selecting the same file again
             if (backupInputRef.current) {
                 backupInputRef.current.value = '';
             }
        }
    };
    reader.readAsText(file);
  };

  const formatContent = (pattern: string, values: Record<string, string>) => {
      if (!pattern) return '';
      return pattern.replace(/{([^{}]+)}/g, (match, rawLabel) => {
         const label = normalizeKey(rawLabel); 
         if (label === normalizeKey('Sistem URL')) return qrBaseUrl;

         const isShortRequest = label.endsWith('_kisa');
         const cleanLabel = isShortRequest ? label.replace('_kisa', '') : label;
         let val = values[cleanLabel];
         
         // Preview handling for system-generated fields
         if (val === undefined && (cleanLabel === normalizeKey('Seri No') || cleanLabel === normalizeKey('Seri Numarasi') || cleanLabel === normalizeKey('Sertifika No'))) {
             return 'PRC-XXXXXXXX';
         }
         
         if (val === undefined) return match;
         if (val.startsWith('data:')) {
             const sig = signatures.find(s => s.url === val);
             return sig ? sig.name : 'Gorsel'; 
         }
         if (isShortRequest) {
             const company = companies.find(c => turkishToLower(c.name) === turkishToLower(val));
             if (company) return company.shortName;
             return val; 
         }
         return val; 
      });
  };

  const generateFilename = (pattern: string, values: Record<string, string>) => {
      const name = formatContent(pattern, values);
      return name.replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ\-\. ]/gi, '_') + '.pdf';
  };

  const getWrappedLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
      const rawLines = text.split('\n');
      const finalLines: string[] = [];
      rawLines.forEach(rawLine => {
          const words = rawLine.split(' ');
          let currentLine = words[0];
          for (let i = 1; i < words.length; i++) {
              const word = words[i];
              const width = ctx.measureText(currentLine + " " + word).width;
              if (width < maxWidth) currentLine += " " + word;
              else { finalLines.push(currentLine); currentLine = word; }
          }
          finalLines.push(currentLine);
      });
      return finalLines;
  };

  const renderProjectToPDF = async (pdf: jsPDF, proj: CertificateProject, isFirstInDoc: boolean, activeValues: Record<string, string> = fillValues) => {
        const sides: Side[] = ['front', 'back'];
        const activeBackData = getActiveSideData(proj, 'back', true);
        const hasBack = activeBackData && (activeBackData.bgUrl || activeBackData.elements.length > 0);
        const sidesToPrint = hasBack ? sides : ['front'];
        let pageAddedForProj = false;
        let firstPageImgData = '';

        for (const side of sidesToPrint) {
            if (!isFirstInDoc || pageAddedForProj) {
                pdf.addPage([proj.width, proj.height], proj.width > proj.height ? 'landscape' : 'portrait');
            }
            pageAddedForProj = true;

            const sideData = getActiveSideData(proj, side as Side, true);
            if (!sideData) continue;

            const canvas = document.createElement('canvas');
            canvas.width = proj.width;
            canvas.height = proj.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            if (sideData.bgUrl) {
                const bgImg = new Image();
                bgImg.src = sideData.bgUrl;
                await new Promise<void>(resolve => {
                    bgImg.onload = () => {
                        ctx.drawImage(bgImg, 0, 0, proj.width, proj.height);
                        resolve();
                    };
                    bgImg.onerror = () => resolve();
                });
            } else {
                 ctx.fillStyle = "#ffffff";
                 ctx.fillRect(0,0, proj.width, proj.height);
            }

            for (const el of sideData.elements) {
                let content = '';

                if (el.type === ElementType.QRCODE || el.type === ElementType.TEXT) {
                   content = formatContent(el.content, activeValues);
                } else if (el.type === ElementType.DATE) {
                   const key = normalizeKey(el.label || el.id);
                   content = activeValues[key] || formatContent(el.content, activeValues);
                } else {
                   const key = normalizeKey(el.label || '');
                   content = activeValues[key] || el.content;
                }

                if (el.type === ElementType.SIGNATURE && !content) continue;

                // HANDLE CHOICE BOX PDF RENDER
                if (el.type === ElementType.CHOICE_BOX) {
                    ctx.font = `${el.fontWeight || 400} ${el.fontSize}px ${el.fontFamily?.split(',')[0]}`;
                    ctx.fillStyle = el.color || '#000';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const opt1 = el.options?.[0] || 'Evet';
                    const isOpt1 = content === opt1;
                    
                    const tickX = isOpt1 ? el.x : (el.secondaryX || el.x + 100);
                    const tickY = isOpt1 ? el.y : (el.secondaryY || el.y);
                    
                    ctx.fillText("✓", tickX + (el.width/2), tickY + (el.height/2));
                    continue; 
                }

                if (el.type === ElementType.TEXT || el.type === ElementType.DROPDOWN || el.type === ElementType.COMPANY || el.type === ElementType.TCKN || el.type === ElementType.DATE) {
                    ctx.font = `${el.fontStyle === 'italic' ? 'italic ' : ''}${el.fontWeight || 400} ${el.fontSize}px ${el.fontFamily?.split(',')[0]}`;
                    ctx.fillStyle = el.color || '#000';
                    const align = el.textAlign || 'center';
                    ctx.textAlign = align as CanvasTextAlign;
                    ctx.textBaseline = 'top'; 
                    
                    let textToRender = content || '';
                    if (el.type === ElementType.TCKN) {
                        textToRender = maskTCKN(textToRender);
                    }

                    const allLines = getWrappedLines(ctx, textToRender, el.width);
                    let startX = el.x; 
                    if (align === 'center') startX = el.x + (el.width / 2);
                    if (align === 'right') startX = el.x + el.width;
                    const startY = el.y; 
                    const lineHeight = el.fontSize! * 1.2;

                    allLines.forEach((line, idx) => {
                        ctx.fillText(line, startX, startY + (idx * lineHeight));
                    });
                } else if (el.type === ElementType.QRCODE) {
                    try {
                        const qrDataUrl = await QRCode.toDataURL(content || ' ', {
                             width: el.width, margin: 1,
                             color: { dark: el.color || '#000000', light: '#00000000' }
                        });
                        const img = new Image();
                        img.src = qrDataUrl;
                         await new Promise<void>(resolve => {
                            img.onload = () => { ctx.drawImage(img, el.x, el.y, el.width, el.height); resolve(); };
                            img.onerror = () => resolve(); 
                        });
                    } catch (e) { console.error("QR Export Error", e); }
                } else {
                    const img = new Image();
                    img.src = content;
                    await new Promise<void>(resolve => {
                        img.onload = () => { ctx.drawImage(img, el.x, el.y, el.width, el.height); resolve(); };
                        img.onerror = () => resolve();
                    });
                }
            }
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            if (!firstPageImgData) firstPageImgData = imgData;
            pdf.addImage(imgData, 'JPEG', 0, 0, proj.width, proj.height);
        }
        return firstPageImgData;
  };

  const getVerificationPayload = (values: Record<string, string>) => {
      const payload = { ...values };
      for (const [k, v] of Object.entries(payload)) {
          if (v && v.startsWith('data:image/')) {
              const sig = signatures.find(s => s.url === v);
              payload[k] = sig ? sig.name : 'Görsel Mevcut';
          }
      }
      return payload;
  };

  const exportPDF = async () => {
    if (isGenerating) return; // Prevent double clicks
    const targetProjects = projects.filter(p => selectedFillProjectIds.includes(p.id));
    if (targetProjects.length === 0) return;

    let fileHandle = null;
    let exportFilename = '';
    
    // 1. Masaüstü tarayıcılarda dosya seçme penceresini AÇMAK İÇİN
    // user gesture (tıklama) kaybolmadan hemen önce dosyayı nereye kaydedeceğini soruyoruz.
    try {
        if (exportMode === 'single') {
            const firstProj = targetProjects[0];
            exportFilename = generateFilename(firstProj.filenamePattern || 'Sertifikalar_Birlestirilmis', fillValues);
            
            if ('showSaveFilePicker' in window) {
                fileHandle = await (window as any).showSaveFilePicker({
                    suggestedName: exportFilename,
                    types: [{ description: 'PDF Dosyası', accept: { 'application/pdf': ['.pdf'] } }]
                });
            }
        } else {
            exportFilename = `Sertifikalar_${new Date().getTime()}.zip`;
            if ('showSaveFilePicker' in window) {
                fileHandle = await (window as any).showSaveFilePicker({
                    suggestedName: exportFilename,
                    types: [{ description: 'ZIP Dosyası', accept: { 'application/zip': ['.zip'] } }]
                });
            }
        }
    } catch (err: any) {
        if (err.name === 'AbortError') {
            return; // Kullanıcı iptal etti, işlemi durdur
        }
        console.warn("Dosya seçici açılamadı, varsayılan indirme kullanılacak...", err);
    }

    setIsGenerating(true);
    setProgress(0);
    // Yield to let UI update
    await new Promise(r => setTimeout(r, 50));

    try {
        // 1. Generate ONE unified bundle serial number (shared across all certificates for this person)
        // If editing, reuse existing serial number to update record in-place
        const baseSerial = Math.floor(10000000 + Math.random() * 90000000).toString();
        const bundleSerialNo = editingCertificate?.serialNo || `PRC-${baseSerial}`;
        const activeValues = { 
            ...fillValues, 
            'seri no': bundleSerialNo, 
            'seri numarasi': bundleSerialNo, 
            'sertifika no': bundleSerialNo 
        };

        // 2. Resolve Company
        let companyVal = '';
        for (const [k, v] of Object.entries(activeValues)) {
            if (v && typeof v === 'string') {
                const lk = k.toLowerCase();
                if (!companyVal && (lk.includes('firma') || lk.includes('kurum') || lk.includes('şirket') || lk.includes('sirket') || lk.includes('company'))) {
                    companyVal = v;
                }
            }
        }

        // 3. Resolve Training Date (Öncelikle gruptaki herhangi bir sertifikada bulunan Tarih bileşeni aranır)
        const dateCandidates = Object.keys(activeValues).filter(k => {
            const lk = k.toLowerCase();
            return (lk.includes('tarih') || lk.includes('date')) && !isValidityDateField(lk);
        });

        let explicitDateKey: string | null = null;
        for (const proj of targetProjects) {
            const bSide = getActiveSideData(proj, 'back');
            for (const s of [proj.front, bSide]) {
                if (!s) continue;
                for (const el of s.elements) {
                    if (el.type === ElementType.DATE && el.dateKind !== 'validity') {
                        const k = normalizeKey(el.label || el.id);
                        if (activeValues[k]) {
                            explicitDateKey = k;
                            break;
                        }
                    }
                }
                if (explicitDateKey) break;
            }
            if (explicitDateKey) break;
        }

        const resolvedTrKey = selectedTrainingDateKey && activeValues[selectedTrainingDateKey]
            ? selectedTrainingDateKey
            : (explicitDateKey || findBestTrainingDateField(dateCandidates));
        const trDate = (resolvedTrKey && typeof activeValues[resolvedTrKey] === 'string') ? activeValues[resolvedTrKey] : '';

        // 4. Match Company (Turkish-aware)
        let matchedComp = companies.find(c => 
            (companyVal && c.id === companyVal) ||
            (companyVal && turkishToLower(c.name) === turkishToLower(companyVal)) || 
            (c.shortName && companyVal && turkishToLower(c.shortName) === turkishToLower(companyVal))
        );

        const dangerClass = matchedComp?.dangerClass || 'cok_tehlikeli';
        const years = matchedComp?.validityYears || getValidityYears(dangerClass);
        const { expiryIso } = calculateExpiryDate(trDate, dangerClass, preferSingleDateExpiry);

        // Auto-register company if it doesn't exist yet so it appears in Firmalar
        if (!matchedComp && companyVal.trim()) {
            const newComp: Company = {
                id: Date.now().toString() + '.' + Math.random().toString().slice(2, 8),
                name: companyVal.trim(),
                shortName: companyVal.trim().substring(0, 15).toUpperCase().replace(/\s+/g, '_'),
                dangerClass,
                validityYears: years,
                createdAt: Date.now()
            };
            matchedComp = newComp;
            setCompanies(prev => [newComp, ...prev]);
            try {
                const token = localStorage.getItem('vps_session_token');
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                fetch(getApiUrl('/api/save'), {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ companies: [newComp, ...companies] })
                }).catch(() => {});
            } catch (e) {}
        }

        // 5. Resolve Recipient Name & TC
        let recipientName = activeValues['ad soyad'] || activeValues['Ad Soyad'] || activeValues['ad_soyad'] || '';
        if (!recipientName) {
            for (const [k, v] of Object.entries(activeValues)) {
                const lk = k.toLowerCase();
                if (lk.includes('ad') && (lk.includes('soyad') || lk.includes('isim')) && typeof v === 'string') {
                    recipientName = v;
                    break;
                }
            }
        }

        let recipientTc = '';
        for (const [k, v] of Object.entries(activeValues)) {
            const lk = k.toLowerCase();
            if ((lk.includes('tc') || lk.includes('tckn') || lk.includes('kimlik')) && typeof v === 'string') {
                recipientTc = v;
                break;
            }
        }

        const certImages: string[] = [];

        if (exportMode === 'single') {
            const firstProj = targetProjects[0];
            const filename = generateFilename(firstProj.filenamePattern || 'Sertifikalar_Birlestirilmis', activeValues);

            const pdf = new jsPDF({
                orientation: firstProj.width > firstProj.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [firstProj.width, firstProj.height]
            });

            for (let i = 0; i < targetProjects.length; i++) {
                const proj = targetProjects[i];
                const certImage = await renderProjectToPDF(pdf, proj, i === 0, activeValues);
                if (certImage) certImages.push(certImage);

                // Important yield for UI responsiveness
                if (i % 2 === 0) {
                    setProgress(Math.round(((i + 1) / targetProjects.length) * 100));
                    await new Promise(r => setTimeout(r, 0));
                }
            }
            
            const pdfBlob = pdf.output('blob');
            await downloadFile(pdfBlob, exportFilename, 'application/pdf', fileHandle);

        } else {
            const zip = new JSZip();
            let savedCount = 0;
            const usedNames = new Set<string>();

            for (const proj of targetProjects) {
                // Create a fresh instance for each file to keep memory low
                const pdf = new jsPDF({
                    orientation: proj.width > proj.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [proj.width, proj.height]
                });

                const certImage = await renderProjectToPDF(pdf, proj, true, activeValues);
                if (certImage) certImages.push(certImage);

                // Generate base filename
                let rawName = generateFilename(proj.filenamePattern || `Sertifika-${proj.name}`, activeValues);
                let baseName = rawName.replace(/\.pdf$/i, '');
                baseName = baseName.replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ\-\. _]/gi, '_');

                let uniqueName = `${baseName}.pdf`;
                let counter = 1;
                
                // Prevent overwriting files in the same batch
                while (usedNames.has(uniqueName)) {
                    uniqueName = `${baseName}_${counter}.pdf`;
                    counter++;
                }
                usedNames.add(uniqueName);

                const pdfData = pdf.output('arraybuffer');
                zip.file(uniqueName, pdfData);
                savedCount++;
                
                // Update progress and yield execution to UI thread
                setProgress(Math.round(((savedCount) / targetProjects.length) * 100));
                await new Promise(r => setTimeout(r, 0));
            }

            setProgress(99); // Generating zip
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            await downloadFile(zipBlob, exportFilename, 'application/zip', fileHandle);
        }

        // 6. Save ONE unified certificate record for this person (with all projects bundled together)
        try {
            const token = localStorage.getItem('vps_session_token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            await fetch(getApiUrl('/api/issue'), {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    serialNo: bundleSerialNo,
                    company: companyVal,
                    companyId: matchedComp?.id,
                    dangerClass,
                    validityYears: years,
                    trainingDate: trDate,
                    expiryDate: expiryIso,
                    recipientName,
                    recipientTc,
                    fields: getVerificationPayload(activeValues),
                    projects: targetProjects.map(p => p.name),
                    date: new Date().toISOString(),
                    image: certImages[0] || '',
                    images: certImages
                })
            });
            // Immediately reload fresh certificates into state so Firmalar & Dashboard reflect them!
            await fetchCertificatesAndStats();
            if (editingCertificate) {
                setEditingCertificate(null);
            }
        } catch (e) {
            console.error("Backend issue error", e);
        }
    } catch (e: any) {
        console.error("Export failed", e);
        alert("PDF oluşturulurken bir hata oluştu: " + (e.message || String(e)));
    } finally {
        setIsGenerating(false);
        setProgress(0);
    }
  };


  

  const currentSideData = getActiveSideData(activeProject, activeSide);
  const currentSideElements = currentSideData?.elements || [];
  const currentSideBg = currentSideData?.bgUrl || '';
  const selectedElement = currentSideElements.find(el => el.id === selectedId);

  const getPreviewElements = (proj: CertificateProject, side: Side, useFill: boolean = true) => {
    const sideData = getActiveSideData(proj, side, useFill);
    if (!sideData) return [];
    return sideData.elements.map(el => {
      if (el.type === ElementType.QRCODE || el.type === ElementType.TEXT) {
         return { ...el, content: formatContent(el.content, fillValues) };
      }
      const key = normalizeKey(el.label || '');
      const val = fillValues[key];
      if (el.type === ElementType.TCKN) {
          if (val) return { ...el, content: maskTCKN(val) };
          return el;
      }
      if (el.type === ElementType.DATE) {
          if (val) return { ...el, content: val };
          return { ...el, content: formatContent(el.content, fillValues) };
      }
      if (val) return { ...el, content: val };
      return el; 
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-slate-900 text-slate-200 overflow-hidden font-sans selection:bg-amber-500/30 w-full relative">
      
      {/* SIDEBAR NAVIGATION */}
      <Sidebar 
        currentTab={currentView}
        onTabChange={(tab) => {
          setCurrentView(tab);
          if (tab !== 'company-detail') {
            setSelectedCompanyForDetail(null);
          }
          if (tab === 'companies' || tab === 'company-detail' || tab === 'dashboard') {
            fetchCertificatesAndStats();
          }
        }}
        userRole={sessionUser?.role || 'user'}
        userName={sessionUser?.name || 'Kullanıcı'}
        onLogout={handleLogout}
        stats={dashboardStats}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* VIEW: DASHBOARD */}
        {currentView === 'dashboard' && (
          <DashboardView 
            onNavigateToFill={() => setCurrentView('fill')}
            onNavigateToCompany={(companyName) => {
              const comp = companies.find(c => 
                c.id === companyName ||
                turkishToLower(c.name) === turkishToLower(companyName) || 
                (c.shortName && turkishToLower(c.shortName) === turkishToLower(companyName))
              );
              if (comp) {
                setSelectedCompanyForDetail(comp);
                setCurrentView('company-detail');
                fetchCertificatesAndStats();
              } else {
                setCurrentView('companies');
                fetchCertificatesAndStats();
              }
            }}
            onEditCertificate={handleEditCertificate}
            onOpenEmployee={(tcOrName) => {
              setActiveEmployeeIdOrTc(tcOrName);
              setShowEmployeeModal(true);
            }}
            getApiUrl={getApiUrl}
          />
        )}

        {/* VIEW: COMPANIES */}
        {currentView === 'companies' && (
          <CompaniesView 
            companies={companies}
            certificates={allCertificates}
            onSelectCompany={(company) => {
              setSelectedCompanyForDetail(company);
              setCurrentView('company-detail');
              fetchCertificatesAndStats();
            }}
            isAdmin={isAdmin}
            onOpenSettings={() => setCurrentView('settings')}
          />
        )}

        {/* VIEW: COMPANY DETAIL */}
        {currentView === 'company-detail' && selectedCompanyForDetail && (
          <CompanyDetailView 
            company={selectedCompanyForDetail}
            certificates={allCertificates}
            onBack={() => {
              setSelectedCompanyForDetail(null);
              setCurrentView('companies');
            }}
            onNavigateToFillWithCompany={(companyName) => {
              handleFillFieldChange('Firma', companyName, ElementType.COMPANY);
              handleFillFieldChange('firma', companyName, ElementType.COMPANY);
              setCurrentView('fill');
            }}
            onEditCertificate={handleEditCertificate}
            onOpenEmployee={(tcOrName) => {
              setActiveEmployeeIdOrTc(tcOrName);
              setShowEmployeeModal(true);
            }}
            getApiUrl={getApiUrl}
          />
        )}

        {/* VIEW: PROJECTS LIST */}
        {currentView === 'projects' && (
             <div className="flex-1 bg-slate-900 p-4 md:p-10 overflow-y-auto">
                {/* ... existing project list UI ... */}
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-1 text-white">Projelerim</h1>
                            <p className="text-slate-400">Tüm sertifika çalışmalarınız burada.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setCurrentView('fill')} 
                                className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-500/50 px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm transition"
                                title="Sertifika Doldurma Ekranına Dön"
                            >
                                <PenTool size={16} /> Doldur Moduna Dön
                            </button>
                            <button 
                                onClick={handleAdminLogout} 
                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3.5 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm transition"
                                title="Yönetici Oturumunu Kilitle"
                            >
                                <Lock size={16} /> Kilitle
                            </button>
                            <button onClick={handleCreateProject} className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold transition shadow-lg shadow-amber-900/20 active:scale-95 transform"><Plus size={18} /> Yeni Proje</button>
                        </div>
                    </div>
                    {/* Filter Tabs & Info */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-slate-400 font-medium mr-1">Filtre:</span>
                            <button
                                type="button"
                                onClick={() => setProjectStatusFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${projectStatusFilter === 'all' ? 'bg-amber-500 text-slate-900 shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
                            >
                                Tümü ({projects.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setProjectStatusFilter('active')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${projectStatusFilter === 'active' ? 'bg-emerald-500 text-slate-900 shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-700'}`}
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                                Aktif ({projects.filter(p => p.isActive !== false).length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setProjectStatusFilter('passive')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${projectStatusFilter === 'passive' ? 'bg-slate-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'}`}
                            >
                                <EyeOff size={13} />
                                Pasif ({projects.filter(p => p.isActive === false).length})
                            </button>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span className="text-amber-400">💡</span> 
                            <span><strong className="text-slate-200">Pasife alınan</strong> projeler silinmez; yalnızca sertifika doldurma listesinde gizlenir.</span>
                        </div>
                    </div>

                    {/* Project Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {projects.filter(p => {
                            if (projectStatusFilter === 'active') return p.isActive !== false;
                            if (projectStatusFilter === 'passive') return p.isActive === false;
                            return true;
                        }).length === 0 ? (
                            <div className="col-span-full py-16 text-center bg-slate-800/40 rounded-2xl border border-slate-700 border-dashed">
                                <FolderOpen size={40} className="mx-auto text-slate-600 mb-3" />
                                <p className="text-slate-300 font-medium">Bu filtreye ait proje bulunamadı.</p>
                                <p className="text-xs text-slate-500 mt-1">Filtreyi 'Tümü' olarak değiştirin veya yeni bir proje oluşturun.</p>
                            </div>
                        ) : (
                          projects.filter(p => {
                            if (projectStatusFilter === 'active') return p.isActive !== false;
                            if (projectStatusFilter === 'passive') return p.isActive === false;
                            return true;
                          }).map(p => {
                            const isProjectActive = p.isActive !== false;
                            return (
                             <div 
                                key={p.id} 
                                onClick={() => { setActiveProjectId(p.id); setCurrentView('template'); }} 
                                className={`bg-slate-800 border-2 rounded-xl p-5 cursor-pointer transition group hover:shadow-xl hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between ${!isProjectActive ? 'opacity-85 border-slate-700 hover:border-slate-600 bg-slate-800/70' : (activeProjectId === p.id ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-700 hover:border-slate-500')}`}
                             >
                                <div>
                                    <div className="h-40 bg-slate-900/50 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                                        {p.front.bgUrl ? (
                                          <img src={p.front.bgUrl} className={`w-full h-full object-cover transition duration-500 ${!isProjectActive ? 'opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-80' : 'opacity-60 group-hover:opacity-100'}`} />
                                        ) : (
                                          <FileText size={40} className="text-slate-700" />
                                        )}
                                        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white backdrop-blur">Ön Yüz</div>
                                        
                                        {/* Status Tag on Image */}
                                        <div className="absolute top-2 left-2">
                                          {isProjectActive ? (
                                            <span className="bg-emerald-950/85 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur shadow-sm">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> AKTİF
                                            </span>
                                          ) : (
                                            <span className="bg-slate-900/90 border border-slate-600 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur shadow-sm">
                                              <EyeOff size={11} className="text-amber-400" /> PASİF (GİZLİ)
                                            </span>
                                          )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h3 className={`font-bold text-lg transition truncate ${!isProjectActive ? 'text-slate-300 group-hover:text-amber-400' : 'text-slate-100 group-hover:text-amber-500'}`}>{p.name}</h3>
                                            <p className="text-xs text-slate-500 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button 
                                              type="button"
                                              onClick={(e) => handleToggleProjectActive(p.id, e)} 
                                              className={`p-2 rounded-full transition shrink-0 ${isProjectActive ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'}`}
                                              title={isProjectActive ? "Projeyi Pasife Al (Sertifika listesinde gizle)" : "Projeyi Aktif Et (Sertifika listesinde göster)"}
                                            >
                                              {isProjectActive ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button onClick={(e) => handleDuplicateProject(p.id, e)} className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition shrink-0" title="Kopyasını Oluştur"><Copy size={18} /></button>
                                            <button onClick={(e) => handleDeleteProject(p.id, e)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition shrink-0" title="Projeyi Sil"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                </div>

                                {/* Active / Passive Status Toggle Button */}
                                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                                    <span className="text-[11px] text-slate-400">Sertifika Listesi:</span>
                                    <button 
                                        type="button"
                                        onClick={(e) => handleToggleProjectActive(p.id, e)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1.5 border ${
                                          isProjectActive 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                                            : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white'
                                        }`}
                                        title={isProjectActive ? "Tıklayarak pasife alın (sertifika listesinde gizlenir)" : "Tıklayarak aktif edin (sertifika listesinde görünür)"}
                                    >
                                        {isProjectActive ? (
                                            <><Check size={12} className="text-emerald-400" /> Listede Görünür</>
                                        ) : (
                                            <><EyeOff size={12} className="text-amber-400" /> Pasif (Gizlendi)</>
                                        )}
                                    </button>
                                </div>
                             </div>
                            );
                          })
                        )}
                    </div>
                </div>
             </div>
        )}

        {/* VIEW: TEMPLATE EDITOR */}
        {currentView === 'template' && (
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-w-0">
            {/* Left Sidebar */}
            <div className="w-full md:w-80 h-[40vh] md:h-auto bg-slate-850 border-b md:border-b-0 md:border-r border-slate-700/80 flex flex-col z-20 shadow-2xl flex-shrink-0 select-none">
               {/* Project Header */}
               <div className="p-4 border-b border-slate-700/80 bg-slate-900/80 backdrop-blur">
                 {isEditingName ? (
                     <input ref={projectNameInputRef} type="text" value={activeProject.name} onChange={(e) => updateProjectMeta({ name: e.target.value })} onBlur={() => setIsEditingName(false)} onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)} className="w-full bg-slate-950 border border-amber-500 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none font-bold" />
                 ) : (
                     <div className="flex items-center justify-between group hover:bg-slate-800/60 p-1.5 rounded-lg -ml-1 cursor-pointer transition" onClick={() => setIsEditingName(true)}>
                         <div className="overflow-hidden">
                           <h2 className="text-base font-bold text-white truncate flex items-center gap-1.5" title={activeProject.name}>
                             <span>{activeProject.name}</span>
                             <Edit2 size={12} className="text-slate-500 opacity-60 group-hover:opacity-100 transition" />
                           </h2>
                           <p className="text-[11px] text-slate-400">Şablon Tasarım Stüdyosu</p>
                         </div>
                     </div>
                 )}
                 {/* Status & Orientation */}
                 <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-400">Sertifika Durumu:</span>
                    <button
                       type="button"
                       onClick={(e) => handleToggleProjectActive(activeProject.id, e)}
                       className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 transition border ${
                         activeProject.isActive !== false
                           ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                           : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                       }`}
                       title={activeProject.isActive !== false ? "Pasife alarak sertifika listesinde gizleyin" : "Aktif ederek sertifika listesinde gösterin"}
                    >
                       {activeProject.isActive !== false ? (
                          <><Check size={11} className="text-emerald-400" /> Aktif (Görünür)</>
                       ) : (
                          <><EyeOff size={11} className="text-amber-400" /> Pasif (Gizli)</>
                       )}
                    </button>
                 </div>
                 {/* Orientation Switcher */}
                 <div className="mt-2.5 flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                     <button onClick={() => handleOrientationChange('landscape')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${activeProject.width > activeProject.height ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}><RectangleHorizontal size={14} /> Yatay Belge</button>
                     <button onClick={() => handleOrientationChange('portrait')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${activeProject.height > activeProject.width ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}><RectangleVertical size={14} /> Dikey Belge</button>
                 </div>
               </div>
               
               <div className="p-3.5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                 {/* Bileşen Ekle (2-Column Grid) */}
                 <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 tracking-wider">
                      <span>Bileşenler</span>
                      <span className="text-[10px] text-slate-500 font-normal">Tıkla & Ekle</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button onClick={() => addElement(ElementType.TEXT)} className="p-2.5 bg-slate-900/90 hover:bg-slate-800 hover:border-blue-500/50 border border-slate-750 rounded-xl flex items-center gap-2 transition text-xs text-slate-200 group text-left shadow-sm">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 shrink-0">
                          <Type size={15} />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-200 group-hover:text-white">Metin</div>
                          <div className="text-[10px] text-slate-500">Alan ekle</div>
                        </div>
                      </button>

                      <button onClick={() => addElement(ElementType.DATE)} className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/60 border border-amber-500/30 rounded-xl flex items-center gap-2 transition text-xs text-amber-200 group text-left shadow-sm">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                          <Calendar size={15} />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-amber-300">Tarih</div>
                          <div className="text-[10px] text-amber-400/70">Başlangıç</div>
                        </div>
                      </button>

                      <button onClick={() => addElement(ElementType.COMPANY)} className="p-2.5 bg-slate-900/90 hover:bg-slate-800 hover:border-emerald-500/50 border border-slate-750 rounded-xl flex items-center gap-2 transition text-xs text-slate-200 group text-left shadow-sm">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 shrink-0">
                          <Building size={15} />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-200 group-hover:text-white">Firma</div>
                          <div className="text-[10px] text-slate-500">Kurum adı</div>
                        </div>
                      </button>

                      <button onClick={() => addElement(ElementType.TCKN)} className="p-2.5 bg-slate-900/90 hover:bg-slate-800 hover:border-purple-500/50 border border-slate-750 rounded-xl flex items-center gap-2 transition text-xs text-slate-200 group text-left shadow-sm">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 shrink-0">
                          <ShieldCheck size={15} />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-200 group-hover:text-white">TC No</div>
                          <div className="text-[10px] text-slate-500">11 Hane</div>
                        </div>
                      </button>

                      <button onClick={() => addElement(ElementType.DROPDOWN)} className="p-2.5 bg-slate-900/90 hover:bg-slate-800 hover:border-sky-500/50 border border-slate-750 rounded-xl flex items-center gap-2 transition text-xs text-slate-200 group text-left shadow-sm">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 shrink-0">
                          <List size={15} />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-200 group-hover:text-white">Seçenek</div>
                          <div className="text-[10px] text-slate-500">Açılır liste</div>
                        </div>
                      </button>

                      <button onClick={() => addElement(ElementType.CHOICE_BOX)} className="p-2.5 bg-slate-900/90 hover:bg-slate-800 hover:border-teal-500/50 border border-slate-750 rounded-xl flex items-center gap-2 transition text-xs text-slate-200 group text-left shadow-sm">
                        <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 shrink-0">
                          <CheckCircle2 size={15} />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-200 group-hover:text-white">Seçim</div>
                          <div className="text-[10px] text-slate-500">Evet/Hayır</div>
                        </div>
                      </button>

                      <button onClick={() => addElement(ElementType.QRCODE)} className="p-2.5 bg-slate-900/90 hover:bg-slate-800 hover:border-rose-500/50 border border-slate-750 rounded-xl flex items-center gap-2 transition text-xs text-slate-200 group text-left shadow-sm">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/20 shrink-0">
                          <QrCode size={15} />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-200 group-hover:text-white">QR Kod</div>
                          <div className="text-[10px] text-slate-500">Doğrulama</div>
                        </div>
                      </button>

                      <button onClick={() => addElement(ElementType.SIGNATURE)} className="p-2.5 bg-slate-900/90 hover:bg-slate-800 hover:border-violet-500/50 border border-slate-750 rounded-xl flex items-center gap-2 transition text-xs text-slate-200 group text-left shadow-sm">
                        <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20 shrink-0">
                          <PenTool size={15} />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-200 group-hover:text-white">İmza</div>
                          <div className="text-[10px] text-slate-500">Yetkili imza</div>
                        </div>
                      </button>

                      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                      <button onClick={() => addElement(ElementType.IMAGE)} className="col-span-2 p-2.5 bg-slate-900/90 hover:bg-slate-800 hover:border-amber-500/50 border border-slate-750 rounded-xl flex items-center justify-center gap-2 transition text-xs text-slate-200 group shadow-sm">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 shrink-0">
                          <ImageIcon size={14} />
                        </div>
                        <span className="font-semibold text-slate-200 group-hover:text-white">Logo / Resim Ekle</span>
                      </button>
                    </div>
                 </div>

                 {/* Arkaplan Yönetimi */}
                 <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Arkaplan ({activeSide === 'front' ? 'Ön Yüz' : 'Arka Yüz'})</h3>
                        <button onClick={() => variantFileInputRef.current?.click()} className="flex items-center gap-1 text-[11px] bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg hover:bg-amber-500/25 transition font-semibold">
                            <Plus size={12} /> Yeni Seçenek
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleTemplateUpload} accept="image/*" className="hidden" />
                    <input type="file" ref={variantFileInputRef} onChange={handleVariantUpload} accept="image/*" multiple className="hidden" />
                    
                    {activeProject && (
                        <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-0.5">
                            <div 
                                onClick={() => handleSelectVariant(activeSide, '')} 
                                className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition border ${!(activeSide === 'front' ? activeProject.selectedFrontId : activeProject.selectedBackId) ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-sm' : 'bg-slate-900/90 border-slate-750 text-slate-300 hover:bg-slate-800'}`}
                            >
                                <div className="flex items-center gap-2 truncate flex-1 font-medium">
                                    {!(activeSide === 'front' ? activeProject.selectedFrontId : activeProject.selectedBackId) ? <Check size={13} className="text-amber-400 font-bold" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />}
                                    <span>Varsayılan Arkaplan</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-all">
                                    <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="p-1 text-slate-400 hover:text-amber-400 transition-all" title="Arkaplanı Değiştir">
                                        <Upload size={13} />
                                    </button>
                                    <button onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if(confirm('Arkaplanı temizlemek istediğinize emin misiniz?')) {
                                            updateProjectSide(activeSide, { bgUrl: '' });
                                        }
                                    }} className="p-1 text-slate-400 hover:text-rose-400 transition-all" title="Arkaplanı Temizle">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                            
                            {(() => {
                                const side = activeSide;
                                const variantsKey = side === 'front' ? 'frontVariants' : 'backVariants';
                                const selectedKey = side === 'front' ? 'selectedFrontId' : 'selectedBackId';
                                const variants = activeProject[variantsKey] || [];
                                
                                return variants.map(v => {
                                    const isSelected = activeProject[selectedKey] === v.id;
                                    return (
                                        <div 
                                            key={v.id} 
                                            onClick={() => handleSelectVariant(side, v.id)} 
                                            className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition border ${isSelected ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-sm' : 'bg-slate-900/90 border-slate-750 text-slate-300 hover:bg-slate-800'}`}
                                        >
                                            <div className="flex items-center gap-2 truncate flex-1">
                                                {isSelected ? <Check size={13} className="text-amber-400 font-bold" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />}
                                                <input 
                                                    type="text" 
                                                    value={v.name || ''} 
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleRenameVariant(side, v.id, e.target.value);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="bg-transparent border-none text-xs focus:outline-none w-full text-inherit font-medium underline decoration-transparent focus:decoration-amber-500/40"
                                                    placeholder="Varyant İsmi"
                                                />
                                            </div>
                                            <button onClick={(e) => handleDeleteVariant(side, v.id, e)} className="p-1 text-slate-400 hover:text-rose-400 opacity-70 group-hover:opacity-100 transition-all" title="Varyantı Sil">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                 </div>

                 {/* QR İçerik Ayarı (Sadece QR seçiliyken) */}
                 {selectedElement && selectedElement.type === ElementType.QRCODE && (
                   <div className="space-y-2 pt-2 border-t border-slate-800 animate-in fade-in duration-150">
                       <h3 className="text-xs font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5"><QrCode size={13} /> QR İçerik Formatı</h3>
                       <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-750 space-y-2">
                           <p className="text-[10px] text-slate-400">QR Koda eklenecek metin veya etiketler:</p>
                           <textarea rows={3} value={selectedElement.content} onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 outline-none resize-none font-mono" placeholder="Örn: {Ad Soyad} - {Tarih}" />
                       </div>
                   </div>
                 )}

                 {/* Proje Ayarları & Çıktı */}
                 <div className="space-y-2 pt-2 border-t border-slate-800">
                      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5"><FileBadge size={13} /> PDF Dosya Adı & Şablon</h3>
                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-750 space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 block">PDF İndirme Dosya Adı:</label>
                          <input type="text" value={activeProject.filenamePattern || 'Sertifika-{Ad Soyad}'} onChange={(e) => updateProjectMeta({ filenamePattern: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 outline-none font-mono" placeholder="Örn: {Ad Soyad}-{Tarih}" />
                          <div className="text-[9px] text-slate-500 mb-1">Mevcut etiketleri ekle:</div>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                              {getProjectLabels().map(label => (
                                  <button key={label} onClick={() => { const current = activeProject.filenamePattern || ''; updateProjectMeta({ filenamePattern: current + `{${label}}` }); }} className={`text-[10px] px-2 py-0.5 rounded-md transition border border-slate-700 hover:border-slate-600 ${label.endsWith('_Kisa') ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`} title={label.endsWith('_Kisa') ? "Firma kısaltmasını ekle" : "Değeri ekle"}>+ {label}</button>
                              ))}
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <input type="file" ref={htmlTemplateInputRef} onChange={handleImportHTMLTemplate} accept=".json" className="hidden" />
                        <button onClick={() => htmlTemplateInputRef.current?.click()} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold shadow-sm border border-slate-700 flex items-center justify-center gap-1.5 transition"><Import size={13} /> Şablon Yükle</button>
                        <button onClick={handleSaveTemplateAsHTML} className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl text-[11px] font-bold shadow-sm border border-purple-500/30 flex items-center justify-center gap-1.5 transition"><FileCode size={13} /> Şablon Kaydet</button>
                      </div>
                 </div>
               </div>
            </div>

            {/* Canvas Area with Locked-Height Top Properties Bar (Zero Layout Shift) */}
            <div className="flex-1 flex flex-col relative bg-[#0b0f19] min-w-0 overflow-hidden">
              <div className="h-14 min-h-[3.5rem] max-h-[3.5rem] bg-slate-850/95 backdrop-blur border-b border-slate-750 flex items-center px-4 gap-3 justify-between relative select-none shrink-0 z-30 min-w-0">
                 {/* Left: Navigation & Side Switcher */}
                 <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => setCurrentView('fill')} 
                      className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      title="Sertifika Doldurma Ekranına Dön"
                    >
                      <ArrowLeft size={14} /> Doldur'a Dön
                    </button>
                    <div className="w-[1px] h-5 bg-slate-700 mx-1 hidden sm:block"></div>
                    <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-700 shrink-0">
                        <button onClick={() => { setActiveSide('front'); setSelectedId(null); }} className={`px-3 py-1 text-xs rounded-md transition font-semibold ${activeSide === 'front' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}>Ön Yüz</button>
                        <button onClick={() => { setActiveSide('back'); setSelectedId(null); }} className={`px-3 py-1 text-xs rounded-md transition font-semibold ${activeSide === 'back' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}>Arka Yüz</button>
                    </div>
                 </div>

                 {/* Center: Properties Toolbar or Document Info (min-w-0 + no-scrollbar ensures NO width blowouts) */}
                 <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar min-w-0 px-2">
                     {selectedElement ? (
                    <>
                        {/* Type Badge */}
                        <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase whitespace-nowrap shrink-0">
                          {selectedElement.type === ElementType.COMPANY ? '🏢 FİRMA' : (selectedElement.type === ElementType.CHOICE_BOX ? '☑️ SEÇİM' : (selectedElement.type === ElementType.DATE ? '📅 TARİH' : (selectedElement.type === ElementType.TCKN ? '🛡️ TC NO' : (selectedElement.type === ElementType.SIGNATURE ? '✍️ İMZA' : (selectedElement.type === ElementType.QRCODE ? '📱 QR' : selectedElement.type)))))}
                        </span>

                        {/* Label Input */}
                        <input value={selectedElement.label || ''} onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white w-32 focus:border-amber-500 outline-none shrink-0" placeholder="Etiket / İsim" title="Bileşen Etiketi" />
                        
                        {/* Date Role Dropdown */}
                        {(selectedElement.type === ElementType.TEXT || selectedElement.type === ElementType.DATE) && (
                          <select 
                            value={selectedElement.dateKind || (selectedElement.type === ElementType.DATE ? 'training' : 'auto')} 
                            onChange={(e) => updateElement(selectedElement.id, { dateKind: e.target.value === 'auto' ? undefined : (e.target.value as any) })}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-400 outline-none hover:border-amber-500 transition shrink-0 cursor-pointer"
                            title="İSG Geçerlilik Tarih Rolü"
                          >
                            <option value="auto">Tarih Rolü: Otomatik</option>
                            <option value="training">📅 Başlangıç Tarihi (Referans)</option>
                            <option value="validity">⌛ Geçerlilik Tarihi (Hesaplanan)</option>
                          </select>
                        )}

                        {(selectedElement.type === ElementType.TEXT || selectedElement.type === ElementType.DROPDOWN || selectedElement.type === ElementType.QRCODE || selectedElement.type === ElementType.COMPANY || selectedElement.type === ElementType.TCKN || selectedElement.type === ElementType.CHOICE_BOX || selectedElement.type === ElementType.DATE) && (
                        <>
                            <div className="w-[1px] h-5 bg-slate-700 shrink-0"></div>
                            {selectedElement.type !== ElementType.QRCODE && (
                            <>
                                <select value={selectedElement.fontFamily} onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white w-32 shrink-0 outline-none focus:border-amber-500">{FONTS.map(group => (<optgroup key={group.group} label={group.group}>{group.options.map(f => (<option key={f.value} value={f.value}>{f.name}</option>))}</optgroup>))}</select>
                                <select value={selectedElement.fontWeight || 400} onChange={(e) => updateElement(selectedElement.id, { fontWeight: Number(e.target.value) })} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white w-24 shrink-0 outline-none focus:border-amber-500">{FONT_WEIGHTS.map(w => (<option key={w.value} value={w.value}>{w.name}</option>))}</select>
                                {selectedElement.type !== ElementType.CHOICE_BOX && (
                                  <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 p-0.5 shrink-0">
                                    <button onClick={() => updateElement(selectedElement.id, { textAlign: 'left' })} className={`p-1 rounded ${selectedElement.textAlign === 'left' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`} title="Sola Hizala"><AlignLeft size={14} /></button>
                                    <button onClick={() => updateElement(selectedElement.id, { textAlign: 'center' })} className={`p-1 rounded ${(!selectedElement.textAlign || selectedElement.textAlign === 'center') ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`} title="Ortala"><AlignCenter size={14} /></button>
                                    <button onClick={() => updateElement(selectedElement.id, { textAlign: 'right' })} className={`p-1 rounded ${selectedElement.textAlign === 'right' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`} title="Sağa Hizala"><AlignRight size={14} /></button>
                                  </div>
                                )}
                                <button onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`p-1.5 rounded-lg border text-xs flex items-center justify-center shrink-0 ${selectedElement.fontStyle === 'italic' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'}`} title="İtalik"><Italic size={14} /></button>
                                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 shrink-0" title="Font Boyutu (px)">
                                  <span className="text-[10px] text-slate-500 font-mono mr-1">px</span>
                                  <input type="number" value={Math.round(selectedElement.fontSize || 0)} onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })} className="w-12 bg-transparent text-xs text-white text-center outline-none" />
                                </div>
                            </>
                            )}
                            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 shrink-0" title="Yazı Rengi">
                              <input type="color" value={selectedElement.color || '#000000'} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-none bg-transparent" />
                              <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedElement.color || '#000000'}</span>
                            </div>
                            {selectedElement.type === ElementType.DROPDOWN && (<button onClick={() => setShowOptionManager(true)} className="flex items-center gap-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition"><List size={13} /> Seçenekler ({selectedElement.options?.length || 0})</button>)}
                            {selectedElement.type === ElementType.CHOICE_BOX && selectedElement.options && (<div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 shrink-0"><span className="text-[10px] text-slate-400">Varsayılan:</span><select value={selectedElement.content} onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })} className="bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white outline-none">{selectedElement.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>)}
                            {(selectedElement.type === ElementType.TEXT || selectedElement.type === ElementType.DATE) && (<input value={selectedElement.content} onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white w-36 shrink-0 font-mono outline-none focus:border-amber-500" placeholder={selectedElement.type === ElementType.DATE ? "{Eğitim Tarihi}" : "Örn metin"} title="Varsayılan Değer / Yer Tutucu" />)}
                        </>
                        )}
                        {selectedElement.type === ElementType.SIGNATURE && (<button onClick={() => setShowSigPermissions(true)} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded-lg text-xs text-white border border-slate-600 shrink-0 transition"><Filter size={13} /> İmza İzinleri ({selectedElement.allowedSignatureIds?.length || 'Tümü'})</button>)}

                        {/* Top bar delete shortcut */}
                        <button 
                          onClick={() => { deleteElement(selectedElement.id); setSelectedId(null); }}
                          className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 shrink-0 transition ml-1"
                          title="Seçili Bileşeni Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                    </>
                    ) : (
                      <div className="flex items-center gap-3 text-xs text-slate-400 select-none">
                        <span className="font-mono bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded-lg text-[11px] text-slate-300">
                          📐 {activeProject.width} × {activeProject.height} px
                        </span>
                        <span className="bg-slate-900/60 border border-slate-700/60 px-2.5 py-0.5 rounded-lg text-[11px] text-slate-300">
                          {activeProject.width > activeProject.height ? 'Yatay Belge' : 'Dikey Belge'}
                        </span>
                        <span className="text-slate-500 hidden sm:inline">
                          • {currentSideElements.length} bileşen mevcut
                        </span>
                        <span className="text-amber-500/70 text-[11px] hidden lg:inline">
                          (Düzenlemek ve taşımak için bir bileşene tıklayın)
                        </span>
                      </div>
                    )}
                 </div>

                 {/* Right: Zoom Controls */}
                 <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700 shrink-0">
                    <button 
                      onClick={handleZoomOut} 
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition" 
                      title="Uzaklaştır (%5)"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-[11px] font-mono font-bold text-amber-400 px-1 min-w-[38px] text-center">
                      %{Math.round(scale * 100)}
                    </span>
                    <button 
                      onClick={handleZoomIn} 
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition" 
                      title="Yakınlaştır (%5)"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-700 mx-0.5"></div>
                    <button 
                      onClick={handleZoomFit} 
                      className="px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition" 
                      title="Ekrana Sığdır"
                    >
                      Sığdır
                    </button>
                 </div>
              </div>

              {/* Canvas Container with Smooth Scroll and Absolute Zero Jitter */}
              <div ref={editorContainerRef} className="flex-1 overflow-auto relative flex items-center justify-center p-4 md:p-8 bg-dots-pattern min-w-0 custom-scrollbar" style={{ backgroundImage: 'radial-gradient(#1e293b 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
                <CanvasEditor elements={currentSideElements} width={activeProject.width} height={activeProject.height} bgUrl={currentSideBg} selectedId={selectedId} onSelect={setSelectedId} onUpdateElement={updateElement} onDeleteElement={deleteElement} scale={scale} />
              </div>
              {showSigPermissions && selectedElement && selectedElement.type === ElementType.SIGNATURE && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      {/* ... Sig Permissions Modal ... */}
                      <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl w-[500px] max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                          <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800 rounded-t-xl"><div><h3 className="font-bold text-white flex items-center gap-2"><Filter size={18} className="text-amber-500"/> İmza Kısıtlamaları</h3><p className="text-xs text-slate-400 mt-1">Bu alana (Etiket: {selectedElement.label}) hangi imzaların eklenebileceğini seçin.</p></div><button onClick={() => setShowSigPermissions(false)} className="p-2 hover:bg-slate-700 rounded-full transition text-slate-400 hover:text-white"><X size={20} /></button></div>
                          <div className="p-5 overflow-y-auto flex-1 space-y-3 bg-slate-900">
                               {signatures.length === 0 ? (<div className="text-center py-10 text-slate-500 bg-slate-800/50 rounded-lg border border-slate-700 border-dashed"><AlertCircle className="mx-auto mb-2" />Henüz hiç imza yüklenmemiş.<div className="text-xs mt-2">Ayarlar sekmesinden imza yükleyebilirsiniz.</div></div>) : (
                                   <div className="grid grid-cols-1 gap-2">
                                       <div onClick={() => updateElement(selectedElement.id, { allowedSignatureIds: undefined })} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition ${!selectedElement.allowedSignatureIds || selectedElement.allowedSignatureIds.length === 0 ? 'bg-amber-900/20 border-amber-600/50' : 'bg-slate-800 border-slate-700 hover:bg-slate-800/80'}`}>{(!selectedElement.allowedSignatureIds || selectedElement.allowedSignatureIds.length === 0) ? <CheckSquare size={20} className="text-amber-500" /> : <Square size={20} className="text-slate-600" />}<span className="font-medium text-sm">Tüm İmzalara İzin Ver</span></div>
                                       <div className="my-2 h-[1px] bg-slate-800"></div><div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">VEYA SEÇİMLİ İZİN VER</div>
                                       {signatures.map(sig => { const isChecked = selectedElement.allowedSignatureIds?.includes(sig.id); return (<div key={sig.id} onClick={() => toggleAllowedSignature(selectedElement.id, sig.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition ${isChecked ? 'bg-slate-800 border-amber-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>{isChecked ? <CheckSquare size={20} className="text-green-500" /> : <Square size={20} className="text-slate-600" />}<div className="w-12 h-8 bg-white rounded p-1 flex items-center justify-center"><img src={sig.url} className="max-w-full max-h-full" alt="" /></div><span className="text-sm">{sig.name}</span></div>) })}
                                   </div>
                               )}
                          </div>
                          <div className="p-4 border-t border-slate-700 bg-slate-800 rounded-b-xl flex justify-end"><button onClick={() => setShowSigPermissions(false)} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-lg">Tamam</button></div>
                      </div>
                  </div>
              )}
              {showOptionManager && selectedElement && selectedElement.type === ElementType.DROPDOWN && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      {/* ... Option Manager Modal ... */}
                      <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl w-[500px] max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                          <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800 rounded-t-xl"><div><h3 className="font-bold text-white flex items-center gap-2"><List size={18} className="text-blue-500"/> Seçenek Yönetimi</h3><p className="text-xs text-slate-400 mt-1">Bu alan (Etiket: {selectedElement.label}) için kullanıcıların seçebileceği değerleri girin.</p></div><button onClick={() => setShowOptionManager(false)} className="p-2 hover:bg-slate-700 rounded-full transition text-slate-400 hover:text-white"><X size={20} /></button></div>
                          <div className="p-5 overflow-y-auto flex-1 bg-slate-900 flex flex-col gap-4">
                               <div className="flex gap-2"><input type="text" value={tempOptionInput} onChange={(e) => setTempOptionInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addOption(selectedElement.id)} className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="Yeni seçenek yazın..." autoFocus /><button onClick={() => addOption(selectedElement.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">Ekle</button></div>
                               <div className="border-t border-slate-800 pt-2"><div className="text-xs font-bold text-slate-500 uppercase mb-2">MEVCUT SEÇENEKLER</div><div className="space-y-2">{!selectedElement.options || selectedElement.options.length === 0 ? (<div className="text-sm text-slate-500 italic text-center py-4">Henüz seçenek eklenmemiş.</div>) : (selectedElement.options.map((opt, idx) => (<div key={idx} className="flex justify-between items-center bg-slate-800 p-2 rounded-lg border border-slate-700 group hover:border-slate-600"><span className="text-sm">{opt}</span><button onClick={() => removeOption(selectedElement.id, idx)} className="text-slate-500 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button></div>)))}</div></div>
                          </div>
                          <div className="p-4 border-t border-slate-700 bg-slate-800 rounded-b-xl flex justify-end"><button onClick={() => setShowOptionManager(false)} className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-2 rounded-lg font-medium transition">Kapat</button></div>
                      </div>
                  </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: SETTINGS */}
        {currentView === 'settings' && (
          <div className="flex-1 bg-slate-900 p-4 md:p-8 overflow-y-auto custom-scrollbar">
             <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                      <Settings className="text-amber-500" size={28} /> Ayarlar & Sistem Yönetimi
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 mt-1">
                      Firma kayıtları, İSG tehlike sınıfları, kullanıcı yetkileri, imzalar ve sistem parametreleri.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentView('fill')} 
                      className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-500/50 px-3.5 py-2 rounded-xl flex items-center gap-2 font-medium text-xs md:text-sm transition shadow-sm"
                      title="Sertifika Doldurma Ekranına Dön"
                    >
                      <PenTool size={15} /> Doldur Modu
                    </button>
                    <button 
                      onClick={handleAdminLogout} 
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-2 rounded-xl flex items-center gap-2 font-medium text-xs md:text-sm transition"
                      title="Yönetici Oturumunu Kilitle"
                    >
                      <Lock size={15} /> Kilitle
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs Nav */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80 custom-scrollbar">
                  {[
                    { id: 'companies', label: 'Firmalar & Tehlike Sınıfı', icon: Building2, count: companies.length },
                    { id: 'users', label: 'Kullanıcı & Roller', icon: ShieldCheck },
                    { id: 'signatures', label: 'Kayıtlı İmzalar', icon: PenTool, count: signatures.length },
                    { id: 'security', label: 'Sistem & Güvenlik', icon: Lock },
                    { id: 'backup', label: 'Yedekleme & Güncelleme', icon: Database },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = settingsSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsSubTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition shrink-0 ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: COMPANIES */}
                {settingsSubTab === 'companies' && (
                  <div className="space-y-6">
                    {/* New Company Addition Form Card */}
                    <div className="bg-slate-800/90 rounded-2xl p-5 md:p-6 border border-slate-700 shadow-xl backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            <Plus size={18} />
                          </div>
                          <div>
                            <h2 className="text-base md:text-lg font-bold text-white">Yeni Firma Ekle</h2>
                            <p className="text-xs text-slate-400">Firma unvanını, kısa kodunu ve İSG tehlike sınıfını tanımlayın.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowBatchCompanyInput(!showBatchCompanyInput)}
                          className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition underline-offset-4 hover:underline"
                        >
                          <FileText size={14} />
                          {showBatchCompanyInput ? 'Tekli Forma Dön' : 'Toplu Metin ile Ekle'}
                        </button>
                      </div>

                      {!showBatchCompanyInput ? (
                        <form onSubmit={handleAddSingleCompany} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                                Firma Tam Unvanı <span className="text-rose-400">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={singleCompanyName}
                                onChange={(e) => setSingleCompanyName(e.target.value)}
                                placeholder="Örn: ABC İnşaat Sanayi ve Ticaret A.Ş."
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                                Firma Kısa Kodu / Kısaltması <span className="text-slate-500 font-normal">(Opsiyonel)</span>
                              </label>
                              <input
                                type="text"
                                value={singleCompanyShortName}
                                onChange={(e) => setSingleCompanyShortName(e.target.value)}
                                placeholder="Örn: ABC_INSAAT veya ABC"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 outline-none transition font-mono"
                              />
                              <p className="text-[10px] text-slate-500 mt-1">
                                Boş bırakılırsa firma isminden otomatik üretilir. Sertifikada yer dar ise kullanılır.
                              </p>
                            </div>
                          </div>

                          {/* Danger Class Selector Cards */}
                          <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-2">
                              İSG Tehlike Sınıfı ve Sertifika Geçerlilik Süresi <span className="text-rose-400">*</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Cok Tehlikeli */}
                              <div
                                onClick={() => setSingleCompanyDangerClass('cok_tehlikeli')}
                                className={`cursor-pointer rounded-xl p-3.5 border transition relative flex items-start gap-3 ${
                                  singleCompanyDangerClass === 'cok_tehlikeli'
                                    ? 'bg-rose-500/10 border-rose-500 ring-1 ring-rose-500/50'
                                    : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600'
                                }`}
                              >
                                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                                  <Flame size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-rose-300">Çok Tehlikeli</span>
                                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold">1 Yıl</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                                    İnşaat, madencilik, ağır sanayi, tersaneler
                                  </p>
                                </div>
                                {singleCompanyDangerClass === 'cok_tehlikeli' && (
                                  <Check className="text-rose-400 shrink-0" size={16} />
                                )}
                              </div>

                              {/* Tehlikeli */}
                              <div
                                onClick={() => setSingleCompanyDangerClass('tehlikeli')}
                                className={`cursor-pointer rounded-xl p-3.5 border transition relative flex items-start gap-3 ${
                                  singleCompanyDangerClass === 'tehlikeli'
                                    ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50'
                                    : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600'
                                }`}
                              >
                                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                                  <AlertTriangle size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-300">Tehlikeli</span>
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">2 Yıl</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                                    İmalat sanayi, gıda üretimi, tekstil, lojistik
                                  </p>
                                </div>
                                {singleCompanyDangerClass === 'tehlikeli' && (
                                  <Check className="text-amber-400 shrink-0" size={16} />
                                )}
                              </div>

                              {/* Az Tehlikeli */}
                              <div
                                onClick={() => setSingleCompanyDangerClass('az_tehlikeli')}
                                className={`cursor-pointer rounded-xl p-3.5 border transition relative flex items-start gap-3 ${
                                  singleCompanyDangerClass === 'az_tehlikeli'
                                    ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50'
                                    : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600'
                                }`}
                              >
                                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                                  <ShieldCheck size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-300">Az Tehlikeli</span>
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">3 Yıl</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                                    Ofis, perakende, bilişim, eğitim, bürolar
                                  </p>
                                </div>
                                {singleCompanyDangerClass === 'az_tehlikeli' && (
                                  <Check className="text-emerald-400 shrink-0" size={16} />
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="submit"
                              disabled={!singleCompanyName.trim()}
                              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 text-xs md:text-sm transition shadow-lg shadow-amber-500/20 active:scale-95"
                            >
                              <Plus size={16} /> Yeni Firmayı Kaydet
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* Batch Add Mode */
                        <div className="space-y-3 pt-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs text-slate-300 font-semibold">
                              Toplu Metin Girişi (Satır Satır):
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">Varsayılan Tehlike Sınıfı:</span>
                              <select
                                value={selectedDangerClassInput}
                                onChange={(e) => setSelectedDangerClassInput(e.target.value as DangerClass)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-amber-500 outline-none"
                              >
                                <option value="cok_tehlikeli">Çok Tehlikeli (1 Yıl)</option>
                                <option value="tehlikeli">Tehlikeli (2 Yıl)</option>
                                <option value="az_tehlikeli">Az Tehlikeli (3 Yıl)</option>
                              </select>
                            </div>
                          </div>
                          <textarea
                            rows={5}
                            value={tempCompanyInput}
                            onChange={(e) => setTempCompanyInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:border-amber-500 outline-none resize-none"
                            placeholder={"Örnek Formatlar:\nFirma Tam Adı | Kısa Kod | az_tehlikeli\nArçelik A.Ş. | ARCELIK | tehlikeli\nKolin İnşaat | KOLIN\nSadece Firma Adı"}
                          />
                          <div className="flex justify-between items-center">
                            <p className="text-[11px] text-slate-500">
                              Her satıra bir firma gelecek şekilde yapıştırın. '|' ile kısaltma ve tehlike sınıfı belirtebilirsiniz.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                addCompany(tempCompanyInput);
                                setShowBatchCompanyInput(false);
                              }}
                              disabled={!tempCompanyInput.trim()}
                              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-900/20 active:scale-95"
                            >
                              <Plus size={15} /> Toplu Listeyi Ekle
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Companies List Table Card */}
                    <div className="bg-slate-800/90 rounded-2xl border border-slate-700 shadow-xl overflow-hidden backdrop-blur-sm">
                      {/* Filter & Search Header */}
                      <div className="p-4 md:p-5 border-b border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Building2 className="text-amber-500" size={20} />
                          <h3 className="font-bold text-white text-base">
                            Kayıtlı Firmalar
                          </h3>
                          <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-bold ml-1">
                            {companies.length}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Danger Class Filter Tabs */}
                          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-700 text-xs">
                            <button
                              onClick={() => setCompanyDangerFilter('all')}
                              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                                companyDangerFilter === 'all'
                                  ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Tümü
                            </button>
                            <button
                              onClick={() => setCompanyDangerFilter('cok_tehlikeli')}
                              className={`px-2 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                                companyDangerFilter === 'cok_tehlikeli'
                                  ? 'bg-rose-500 text-white font-bold'
                                  : 'text-rose-400 hover:text-rose-300'
                              }`}
                            >
                              <Flame size={12} /> Çok Tehlikeli
                            </button>
                            <button
                              onClick={() => setCompanyDangerFilter('tehlikeli')}
                              className={`px-2 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                                companyDangerFilter === 'tehlikeli'
                                  ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'text-amber-400 hover:text-amber-300'
                              }`}
                            >
                              <AlertTriangle size={12} /> Tehlikeli
                            </button>
                            <button
                              onClick={() => setCompanyDangerFilter('az_tehlikeli')}
                              className={`px-2 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                                companyDangerFilter === 'az_tehlikeli'
                                  ? 'bg-emerald-500 text-white font-bold'
                                  : 'text-emerald-400 hover:text-emerald-300'
                              }`}
                            >
                              <ShieldCheck size={12} /> Az Tehlikeli
                            </button>
                          </div>

                          {/* Search Input */}
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                              type="text"
                              value={companySearchQuery}
                              onChange={(e) => setCompanySearchQuery(e.target.value)}
                              placeholder="Firma veya kod ara..."
                              className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-none w-48 md:w-56 transition"
                            />
                            {companySearchQuery && (
                              <button
                                onClick={() => setCompanySearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Companies Table */}
                      <div className="overflow-x-auto">
                        {(() => {
                          const filtered = companies.filter(c => {
                            const matchesSearch = !companySearchQuery.trim() || 
                              turkishToLower(c.name).includes(turkishToLower(companySearchQuery)) || 
                              (c.shortName && turkishToLower(c.shortName).includes(turkishToLower(companySearchQuery)));
                            const matchesDanger = companyDangerFilter === 'all' || (c.dangerClass || 'cok_tehlikeli') === companyDangerFilter;
                            return matchesSearch && matchesDanger;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="py-12 text-center text-slate-500 space-y-2">
                                <Building2 size={36} className="mx-auto text-slate-600 opacity-60" />
                                <p className="text-sm">
                                  {companies.length === 0 ? "Henüz kayıtlı firma bulunmuyor." : "Arama kriterlerine uygun firma bulunamadı."}
                                </p>
                              </div>
                            );
                          }

                          return (
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-700/60 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                                  <th className="py-3 px-4 w-12 text-center">#</th>
                                  <th className="py-3 px-4">Firma Adı & Kısaltma</th>
                                  <th className="py-3 px-4 w-52">Tehlike Sınıfı</th>
                                  <th className="py-3 px-4 w-28 text-center">Geçerlilik</th>
                                  <th className="py-3 px-4 w-24 text-right">İşlemler</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/80">
                                {filtered.map((company, idx) => {
                                  const isEditing = editingCompanyId === company.id;
                                  const danger = company.dangerClass || 'cok_tehlikeli';
                                  const years = company.validityYears || getValidityYears(danger);

                                  return (
                                    <tr key={company.id} className="hover:bg-slate-800/50 transition">
                                      <td className="py-3 px-4 text-center text-slate-500 font-mono">
                                        {idx + 1}
                                      </td>
                                      <td className="py-3 px-4">
                                        {isEditing ? (
                                          <div className="space-y-2 max-w-md">
                                            <input
                                              type="text"
                                              value={editingCompanyName}
                                              onChange={(e) => setEditingCompanyName(e.target.value)}
                                              className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                                              placeholder="Firma Adı"
                                              autoFocus
                                            />
                                            <input
                                              type="text"
                                              value={editingCompanyShortName}
                                              onChange={(e) => setEditingCompanyShortName(e.target.value)}
                                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none font-mono"
                                              placeholder="Kısa Kod (opsiyonel)"
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-amber-400 shrink-0 text-xs">
                                              {company.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                              <div className="font-semibold text-white truncate max-w-md">
                                                {company.name}
                                              </div>
                                              {company.shortName && (
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                  Kod: <span className="text-amber-400/90">{company.shortName}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-3 px-4">
                                        <select
                                          value={danger}
                                          onChange={(e) => updateCompanyDangerClass(company.id, e.target.value as DangerClass)}
                                          className={`border rounded-lg px-2.5 py-1 text-xs font-semibold outline-none transition cursor-pointer ${
                                            danger === 'cok_tehlikeli'
                                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                              : danger === 'tehlikeli'
                                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                          }`}
                                        >
                                          <option value="cok_tehlikeli" className="bg-slate-900 text-rose-400">🔥 Çok Tehlikeli (1 Yıl)</option>
                                          <option value="tehlikeli" className="bg-slate-900 text-amber-400">⚠️ Tehlikeli (2 Yıl)</option>
                                          <option value="az_tehlikeli" className="bg-slate-900 text-emerald-400">🛡️ Az Tehlikeli (3 Yıl)</option>
                                        </select>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                          danger === 'cok_tehlikeli'
                                            ? 'bg-rose-500/20 text-rose-400'
                                            : danger === 'tehlikeli'
                                            ? 'bg-amber-500/20 text-amber-400'
                                            : 'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                          {years} Yıl
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                        {isEditing ? (
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              onClick={() => handleSaveEditCompany(company.id)}
                                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                                              title="Kaydet"
                                            >
                                              <Check size={14} />
                                            </button>
                                            <button
                                              onClick={() => setEditingCompanyId(null)}
                                              className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition"
                                              title="İptal"
                                            >
                                              <X size={14} />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-end gap-1">
                                            <button
                                              onClick={() => handleStartEditCompany(company)}
                                              className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-amber-400 rounded-lg transition"
                                              title="Düzenle"
                                            >
                                              <Pencil size={14} />
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (confirm(`"${company.name}" firmasını silmek istediğinize emin misiniz?`)) {
                                                  removeCompany(company.id);
                                                }
                                              }}
                                              className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition"
                                              title="Sil"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: USERS */}
                {settingsSubTab === 'users' && (
                  <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 shadow-xl backdrop-blur-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          <ShieldCheck size={24} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white">Kullanıcı & Rol Yönetimi</h2>
                          <p className="text-xs text-slate-400">
                            Sistemde sertifika düzenleyecek İSG uzmanlarını ve yöneticileri ekleyin veya şifrelerini düzenleyin.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowUserModal(true)} 
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs md:text-sm transition shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
                      >
                        <Plus size={16} /> Kullanıcıları Yönet & Ekle
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/80">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Yönetici (Admin) Rolü</h4>
                        <p className="text-xs text-slate-400">
                          Tüm şablonları düzenleyebilir, firma ve kullanıcı ekleyebilir/silebilir, sistem yedeklerini indirebilir ve güncellemeleri yönetebilir.
                        </p>
                      </div>
                      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/80">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">İSG Uzmanı / Kullanıcı Rolü</h4>
                        <p className="text-xs text-slate-400">
                          Kendi hesabı ile sisteme girerek tanımlı firmalar için sertifika düzenleyebilir, PDF indirebilir ve çalışan evraklarını görüntüleyebilir.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: SIGNATURES */}
                {settingsSubTab === 'signatures' && (
                  <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 shadow-xl backdrop-blur-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          <PenTool size={24} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white">Kayıtlı İmzalar</h2>
                          <p className="text-xs text-slate-400">
                            Sertifika şablonlarında İSG Uzmanı veya Eğitici imzası olarak kullanılacak imzaları yükleyin veya çizin.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setShowSignaturePad(true)} 
                          className="bg-slate-700 hover:bg-slate-600 text-white px-3.5 py-2 rounded-xl flex items-center gap-2 font-medium text-xs transition border border-slate-600"
                        >
                          <PenLine size={16} /> İmza Çiz
                        </button>
                        <label className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 font-bold text-xs transition shadow-lg shadow-amber-900/20 active:scale-95">
                          <Plus size={16} /> İmza Yükle
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleSignatureUpload} />
                        </label>
                      </div>
                    </div>

                    {signatures.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/40">
                        <Upload className="mx-auto text-slate-600 mb-3" size={36} />
                        <p className="text-slate-400 text-sm font-medium">Henüz kayıtlı imza bulunmuyor.</p>
                        <p className="text-slate-500 text-xs mt-1">Yukarıdaki butonları kullanarak yeni imza yükleyebilir veya çizebilirsiniz.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {signatures.map(sig => (
                          <div key={sig.id} className="group relative bg-white rounded-xl p-3 flex flex-col items-center justify-between min-h-[150px] shadow-sm border border-slate-600 transition hover:border-amber-500 overflow-hidden">
                            <div className="h-20 w-full flex items-center justify-center mb-2 z-10 relative">
                              <img src={sig.url} alt={sig.name} className="max-h-full max-w-full object-contain" />
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-sm z-20">
                              <button 
                                onClick={() => deleteSignature(sig.id)} 
                                className="bg-rose-500 p-2.5 rounded-full text-white hover:bg-rose-600 shadow-lg transform active:scale-95 transition"
                                title="İmzayı Sil"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                            <div className="w-full bg-slate-900 rounded-lg p-1.5 border border-slate-700 z-10 relative">
                              <span className="text-[11px] text-white font-medium truncate block text-center">{sig.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: SECURITY & SYSTEM */}
                {settingsSubTab === 'security' && (
                  <div className="space-y-6">
                    {/* Active Project Management */}
                    <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 shadow-xl backdrop-blur-sm">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-white mb-4">
                        <FileText className="text-blue-500" size={20} /> Aktif Proje Yönetimi
                      </h2>
                      <div className="max-w-xl space-y-2">
                        <label className="text-xs text-slate-300 font-semibold block">Proje Adı</label>
                        <input 
                          type="text" 
                          value={activeProject.name} 
                          onChange={(e) => updateProjectMeta({ name: e.target.value })} 
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none transition" 
                        />
                        <p className="text-[11px] text-slate-500">
                          Proje şablonlarını ve detaylarını yönetmek için sol menüdeki <button onClick={() => setCurrentView('projects')} className="text-amber-400 hover:underline">Projeler</button> sayfasını kullanabilirsiniz.
                        </p>
                      </div>
                    </div>

                    {/* QR Code Base URL */}
                    <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 shadow-xl backdrop-blur-sm">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-white mb-2">
                        <QrCode className="text-teal-400" size={20} /> Doğrulama ve QR Kod Ayarları
                      </h2>
                      <p className="text-xs text-slate-400 mb-4">
                        Sertifikalar oluşturulurken QR kodlara gömülecek temel web doğrulama adresini buradan düzenleyebilirsiniz.
                      </p>
                      <div className="max-w-xl space-y-2">
                        <label className="text-xs font-semibold text-slate-300 block">Sistem Doğrulama URL'si</label>
                        <input 
                          type="text"
                          value={qrBaseUrl}
                          onChange={(e) => {
                            setQrBaseUrl(e.target.value);
                            localStorage.setItem('vps_qr_base_url', e.target.value);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-teal-500 outline-none font-mono text-xs"
                          placeholder="http://194.146.36.153:5555/dogrula.html"
                        />
                        <p className="text-[11px] text-slate-500">
                          Örnek QR içeriği: <span className="font-mono text-slate-400">{qrBaseUrl || 'http://.../dogrula.html'}?s=ISG-2026-0001</span>
                        </p>
                      </div>
                    </div>

                    {/* Password Management */}
                    <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 shadow-xl backdrop-blur-sm">
                      <h2 className="text-lg font-bold flex items-center gap-2 text-white mb-2">
                        <Lock className="text-rose-400" size={20} /> Yönetici Şifresi Değiştir
                      </h2>
                      <p className="text-xs text-slate-400 mb-4">
                        Uygulama ayarlarına ve tasarımlara erişim sağlayan yönetici şifresini buradan güncelleyebilirsiniz.
                      </p>
                      <div className="max-w-xl flex flex-col sm:flex-row gap-3">
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-rose-500 outline-none transition"
                          placeholder="Yeni Yönetici Şifresi"
                        />
                        <button 
                          onClick={handlePasswordChange}
                          disabled={!newPassword.trim()}
                          className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl text-xs transition shadow-lg shadow-rose-900/20 active:scale-95 shrink-0"
                        >
                          Şifreyi Değiştir
                        </button>
                      </div>
                      {passwordMessage && (
                        <p className={`mt-3 text-xs font-semibold ${passwordMessage.includes('başarıyla') ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {passwordMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: BACKUP & UPDATE */}
                {settingsSubTab === 'backup' && (
                  <div className="space-y-6">
                    {/* Backup & Restore */}
                    <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 shadow-xl backdrop-blur-sm">
                      <h2 className="text-lg font-bold flex items-center gap-2 mb-2 text-white">
                        <Database className="text-blue-400" size={20} /> Yedekleme ve Geri Yükleme
                      </h2>
                      <p className="text-xs text-slate-400 mb-6">
                        Tüm projelerinizi, şablonlarınızı, ayarlarınızı ve yüklediğiniz görselleri (imzalar dahil) tek bir dosya olarak yedekleyin veya başka bir cihaza taşıyın.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700 flex flex-col items-center text-center hover:border-slate-600 transition">
                          <DownloadCloud size={36} className="text-emerald-400 mb-3" />
                          <h3 className="font-bold text-white text-sm mb-1">Sistemi Yedekle</h3>
                          <p className="text-xs text-slate-400 mb-4">Tüm verileri (projeler, görseller, ayarlar) içeren tek bir .json dosyası indirir.</p>
                          <button onClick={handleExportBackup} className="mt-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition w-full shadow-lg shadow-emerald-900/20 active:scale-95">
                            Yedek Dosyasını İndir
                          </button>
                        </div>
                        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700 flex flex-col items-center text-center hover:border-slate-600 transition">
                          <UploadCloud size={36} className="text-blue-400 mb-3" />
                          <h3 className="font-bold text-white text-sm mb-1">Yedeği Geri Yükle</h3>
                          <p className="text-xs text-slate-400 mb-4">Daha önce aldığınız yedek dosyasını seçerek tüm verilerinizi geri yükleyin.</p>
                          <div className="mt-auto w-full relative">
                            <input ref={backupInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" id="backup-upload" />
                            <label htmlFor="backup-upload" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition w-full flex items-center justify-center cursor-pointer shadow-lg shadow-blue-900/20 active:scale-95">
                              Dosya Seç ve Yükle
                            </label>
                          </div>
                          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-amber-400">
                            <AlertTriangle size={12} /><span>Dikkat: Mevcut verilerin üzerine yazılacaktır.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* GitHub PM2 Auto Update */}
                    <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 shadow-xl backdrop-blur-sm">
                      <h2 className="text-lg font-bold flex items-center gap-2 mb-2 text-white">
                        <Github className="text-white" size={20} /> Sunucu / GitHub Otomatik Güncelleme
                      </h2>
                      <p className="text-xs text-slate-400 mb-6">
                        Uygulamanın en son sürümünü GitHub deposundan (<span className="font-mono text-slate-300">szgnemin1/ProCertify</span>) çeker, arka planda derler ve sunucu sürecini PM2 ile yeniden başlatır. Mevcut verileriniz bu işlemden etkilenmez.
                      </p>
                      
                      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-white text-sm mb-1">Tek Tıkla Otomatik Güncelleme</h3>
                            <p className="text-xs text-slate-400">
                              Mevcut Çalışan Sürüm: <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono font-bold ml-1">{APP_VERSION}</span>
                            </p>
                          </div>
                          <button 
                            onClick={handleUpdateApp}
                            disabled={isUpdating}
                            className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center justify-center gap-2 select-none shadow-lg active:scale-95 ${
                              isUpdating 
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed animate-pulse' 
                                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'
                            }`}
                          >
                            {isUpdating ? 'Güncelleniyor...' : 'Sürümü Otomatik Güncelle'}
                          </button>
                        </div>
                        
                        {updateMessage && (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg flex items-start gap-2">
                            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-300 font-medium">{updateMessage}</span>
                          </div>
                        )}
                        
                        {updateLogs && (
                          <div className="space-y-2 mt-4">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                              <span>GÜNCELLEME LOGLARI</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded ${
                                updateLogs.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}>
                                {updateLogs.success ? 'KABUL EDİLDİ / BAŞARILI' : 'BAĞLANTI VEYA DERLEME HATASI'}
                              </span>
                            </div>
                            <div className="bg-black/80 font-mono text-xs text-slate-300 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-60 custom-scrollbar space-y-1">
                              {updateLogs.stdout && (
                                <div>
                                  <span className="text-emerald-400 font-bold">[Komut Çıktısı]:</span>
                                  <pre className="whitespace-pre-wrap mt-1 opacity-70">{updateLogs.stdout}</pre>
                                </div>
                              )}
                              {updateLogs.stderr && (
                                <div className="mt-2 pt-2 border-t border-slate-900">
                                  <span className="text-cyan-400 font-bold">[Bildirimler / Günlükler]:</span>
                                  <pre className="whitespace-pre-wrap mt-1 text-rose-400 opacity-90">{updateLogs.stderr}</pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* About Card */}
                    <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 shadow-xl backdrop-blur-sm">
                      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-700 flex items-start gap-4">
                        <div className="p-3 bg-slate-800 rounded-xl text-slate-400">
                          <Monitor size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-base">
                            ProCertify Studio <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full ml-2">{APP_VERSION}</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 mb-4">
                            Açık kaynak kodlu, profesyonel sertifika tasarım ve yönetim aracı. Projeyi GitHub üzerinde destekleyebilir veya katkıda bulunabilirsiniz.
                          </p>
                          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition border border-slate-700">
                            <Github size={14} /> GitHub Deposuna Git
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* VIEW: FILL & EXPORT */}
        {currentView === 'fill' && (
           <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Düzenleme Modu Bilgilendirme Çubuğu */}
              {editingCertificate && (
                <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 z-30">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Pencil size={14} className="text-amber-400 shrink-0" />
                    <span>
                      <strong>Sertifika Düzenleme Modu:</strong>{' '}
                      <span className="text-white font-bold">{editingCertificate.recipientName || 'İsimsiz'}</span>{' '}
                      (Seri No: <code className="bg-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold text-amber-200">{editingCertificate.serialNo}</code>)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCertificate(null)}
                      className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition"
                      title="Mevcut seri numarasını güncellemek yerine yeni bir kayıt üret"
                    >
                      Yeni Kayıt Olarak Üret
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition"
                    >
                      Düzenlemeyi İptal Et
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Steps Navigator */}
              <div className="md:hidden flex bg-slate-950 border-b border-slate-800 shrink-0 select-none z-30">
                  <button onClick={() => setMobileFillStep(0)} className={`flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition ${mobileFillStep === 0 ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>1. Sertifikalar</button>
                  <button onClick={() => setMobileFillStep(1)} className={`flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition ${mobileFillStep === 1 ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>2. Veri</button>
                  <button onClick={() => setMobileFillStep(2)} className={`flex-1 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition ${mobileFillStep === 2 ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>3. Önizle & İndir</button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
              {/* Pillar 1: Project Selection (Collapsible) */}
              <div className={`${mobileFillStep === 0 ? 'flex flex-1 w-full md:flex-none' : 'hidden md:flex'} ${isFillSidebarOpen ? 'md:w-48' : 'md:w-0'} bg-slate-950 border-r border-slate-800 flex-col shrink-0 transition-all duration-300 overflow-hidden relative`}>
                  <div className="p-4 border-b border-slate-800 bg-slate-900/30 whitespace-nowrap flex justify-between items-center">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sertifikalar</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar min-w-[192px]">
                     {projects.filter(p => p.isActive !== false).length === 0 ? (
                       <div className="text-[11px] text-slate-500 text-center py-8 px-2 space-y-2">
                          <EyeOff size={22} className="mx-auto text-slate-600" />
                          <p className="font-semibold text-slate-400">Aktif sertifika yok</p>
                          <p className="text-[10px] text-slate-500 leading-normal">Tüm projeler pasife alınmış. Projeler menüsünden şablonları aktif edebilirsiniz.</p>
                       </div>
                     ) : (
                       projects.filter(p => p.isActive !== false).map(p => {
                          const isSelected = selectedFillProjectIds.includes(p.id);
                          return (
                              <div 
                                key={p.id} 
                                onClick={() => { if (isSelected) { if (selectedFillProjectIds.length > 1) setSelectedFillProjectIds(prev => prev.filter(id => id !== p.id)); } else { setSelectedFillProjectIds(prev => [...prev, p.id]); } }} 
                                className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border transition-all text-xs select-none ${isSelected ? 'bg-amber-500/10 border-amber-500/50 text-amber-200' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}
                              >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-700'}`}>
                                    {isSelected && <Check size={10} className="text-slate-900 font-bold" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <span className="truncate block font-medium">{p.name}</span>
                                      {((p.frontVariants && p.frontVariants.length > 0) || (p.backVariants && p.backVariants.length > 0)) && (
                                          <span className="text-[9px] text-amber-500/80 block mt-0.5 font-mono">
                                            {((p.frontVariants?.length || 0) + (p.backVariants?.length || 0))} varyant
                                          </span>
                                      )}
                                  </div>
                              </div>
                          )
                       })
                     )}
                  </div>
              </div>

              {/* Sidebar Toggle Button */}
              <button 
                onClick={() => setIsFillSidebarOpen(!isFillSidebarOpen)}
                className={`hidden md:block absolute top-1/2 -translate-y-1/2 z-50 p-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-full shadow-xl hover:text-white transition-all ${isFillSidebarOpen ? 'left-[180px]' : 'left-2'}`}
              >
                {isFillSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {/* Pillar 2: Data Entry */}
              <div className={`${mobileFillStep === 1 ? 'flex flex-1 w-full md:flex-none' : 'hidden md:flex'} md:w-[360px] bg-slate-800 border-r border-slate-700 flex-col z-20 overflow-hidden shadow-2xl shrink-0`}>
                 <div className="p-5 border-b border-slate-700 bg-slate-900 shrink-0 flex justify-between items-center">
                   <div>
                     <h2 className="text-lg font-bold text-white leading-tight">Veri Girişi</h2>
                     <p className="text-[10px] text-slate-400 mt-0.5">Seçili {selectedFillProjectIds.length} sertifikayı doldurun.</p>
                   </div>
                   <button onClick={() => setIsChatMode(!isChatMode)} className="text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-1.5 transition bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 font-bold uppercase tracking-tight">
                     {isChatMode ? <><List size={12}/> Form</> : <><MessageSquare size={12}/> Sohbet</>}
                   </button>
                 </div>

                 {isChatMode ? (
                   <div className="flex-1 flex flex-col overflow-hidden p-4">
                    {/* Chat Messages */}
                     <div ref={chatScrollRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 pb-4">
                       {chatHistory.map(msg => (
                         <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[90%] p-3 text-sm shadow-md ${msg.sender === 'user' ? 'bg-amber-600 text-white rounded-2xl rounded-tr-sm' : 'bg-slate-700 text-slate-200 rounded-2xl rounded-tl-sm'}`}>
                             {msg.sender === 'bot' && <Bot size={16} className="inline-block mr-2 mb-1 text-amber-400"/>}
                             <span dangerouslySetInnerHTML={{__html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}} />
                           </div>
                         </div>
                       ))}
                     </div>

                     {/* Chat Input Area */}
                     {getUnifiedFillFields().length > 0 && currentChatStep < getUnifiedFillFields().length && (
                       <div className="mt-4 space-y-2 pt-2 border-t border-slate-700/50">
                         {/* Quick Replies */}
                         {(() => {
                            const field = getUnifiedFillFields()[currentChatStep];
                            let options: {label: string, value: string}[] = [];
                            const isBg = (field.type as any) === "bg_front" || (field.type as any) === "bg_back";
                            if (isBg) {
                              options = (field.variantOptions || []).map(v => ({label: v.name, value: v.id}));
                            } else if (field.type === ElementType.DROPDOWN || field.type === ElementType.CHOICE_BOX) {
                              options = (field.options || []).map(o => ({label: o, value: o}));
                            } else if (field.type === ElementType.COMPANY) {
                              options = companies.map(c => ({label: c.name, value: c.name}));
                            } else if (field.type === ElementType.SIGNATURE) {
                              options = signatures.filter(sig => !field.allowedSignatureIds || field.allowedSignatureIds.length === 0 || field.allowedSignatureIds.includes(sig.id)).map(sig => ({label: sig.name, value: sig.url}));
                            }

                            if (options.length > 0) {
                              const isSearchEmpty = chatInputValue.trim() === "";
                              const filteredOptions = isSearchEmpty ? options : options.filter(opt => turkishToLower(opt.label).includes(turkishToLower(chatInputValue)));
                              const shouldShowOptions = isBg || options.length <= 6 || !isSearchEmpty || field.type === ElementType.COMPANY;
                              const displayMax = isBg ? 20 : (field.type === ElementType.COMPANY ? 6 : 999);
                              const displayedOptions = filteredOptions.slice(0, displayMax);

                              if (!shouldShowOptions) return null;

                              return (
                                <div className="mb-2 space-y-2">
                                  {isBg && (
                                    <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
                                      <ImageIcon size={14} className="text-amber-500" />
                                      <span>Aşağıdaki seçeneklerden birine dokunun:</span>
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {displayedOptions.length > 0 ? displayedOptions.map((opt, i) => (
                                      <button 
                                        key={i} 
                                        onClick={() => handleChatSubmit(opt.value, opt.label)} 
                                        className={isBg 
                                          ? "bg-slate-800 hover:bg-amber-600 text-xs text-amber-200 hover:text-white px-3.5 py-2 rounded-xl transition border border-amber-500/40 hover:border-amber-400 shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer font-medium" 
                                          : "bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-full transition border border-slate-600 shadow-sm"
                                        }
                                      >
                                        {isBg && <ImageIcon size={12} className="text-amber-400" />}
                                        <span>{opt.label}</span>
                                      </button>
                                    )) : (
                                      <span className="text-xs text-slate-500">Sonuç bulunamadı.</span>
                                    )}
                                    {filteredOptions.length > displayMax && (
                                        <span className="text-[10px] text-slate-500 flex items-center px-2 italic">+{filteredOptions.length - displayMax} daha var (Yazarak arayın)</span>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                         })()}

                         <div className="flex items-center gap-2">
                           {currentChatStep > 0 && (
                             <button 
                               onClick={handleChatUndo} 
                               className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition border border-slate-600 flex items-center justify-center shrink-0 shadow-sm" 
                               title="Önceki Adıma Dön"
                             >
                               <ChevronLeft size={16} />
                             </button>
                           )}
                           <div className="relative flex-1 flex items-center">
                             <input
                               type="text"
                               value={chatInputValue}
                               onChange={(e) => setChatInputValue(e.target.value)}
                               onKeyDown={(e) => { if (e.key === 'Enter') handleChatSubmit(chatInputValue); }}
                               onFocus={() => {
                                 setTimeout(() => {
                                   if (chatScrollRef.current) {
                                     chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
                                   }
                                   window.scrollTo(0, document.body.scrollHeight);
                                 }, 300);
                               }}
                               placeholder={(getUnifiedFillFields()[currentChatStep]?.type as any) === "bg_front" || (getUnifiedFillFields()[currentChatStep]?.type as any) === "bg_back" ? "Aşağıdaki seçeneklerden birini seçin veya yazın..." : `${getUnifiedFillFields()[currentChatStep]?.displayLabel} girin...`}
                               className="w-full bg-slate-900 border border-slate-600 rounded-full pl-4 pr-20 py-3 focus:border-amber-500 outline-none text-white placeholder-slate-500 transition text-sm shadow-inner"
                             />
                             <div className="absolute right-2 flex items-center gap-1">
                               <div className="relative flex items-center justify-center w-8 h-8 group" title="Tarih Seç">
                                 <button onClick={() => { setIsCalendarOpen(!isCalendarOpen); if (!isCalendarOpen) setCalendarDate(new Date()); }} className="p-1 rounded-full hover:bg-slate-700 transition">
                                   <Calendar size={18} className={`transition ${isCalendarOpen ? 'text-amber-500' : 'text-slate-400 group-hover:text-amber-500'}`} />
                                 </button>
                                 
                                 {isCalendarOpen && (
                                   <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                                     <div className="flex justify-between items-center mb-2 gap-1">
                                       <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-700 rounded text-slate-300 transition-colors"><ChevronLeft size={14}/></button>
                                       <div className="flex items-center gap-1 overflow-hidden">
                                          <select 
                                            value={calendarDate.getMonth()} 
                                            onChange={(e) => setCalendarDate(new Date(calendarDate.getFullYear(), parseInt(e.target.value), 1))}
                                            className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[9px] font-bold text-white w-14 outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none text-center"
                                          >
                                            {Array.from({ length: 12 }, (_, i) => (
                                              <option key={i} value={i} className="bg-slate-800 text-white">
                                                {new Date(2000, i, 1).toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase()}
                                              </option>
                                            ))}
                                          </select>
                                          <select 
                                            value={calendarDate.getFullYear()} 
                                            onChange={(e) => setCalendarDate(new Date(parseInt(e.target.value), calendarDate.getMonth(), 1))}
                                            className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[9px] font-bold text-amber-500 w-14 outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none text-center"
                                          >
                                            {Array.from({ length: 141 }, (_, i) => 1920 + i).map(y => (
                                              <option key={y} value={y} className="bg-slate-800 text-white">{y}</option>
                                            ))}
                                            {calendarDate.getFullYear() < 1920 && <option value={calendarDate.getFullYear()}>{calendarDate.getFullYear()}</option>}
                                            {calendarDate.getFullYear() > 2060 && <option value={calendarDate.getFullYear()}>{calendarDate.getFullYear()}</option>}
                                          </select>
                                       </div>
                                       <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-700 rounded text-slate-300 transition-colors"><ChevronRight size={14}/></button>
                                     </div>
                                     <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                                       {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => <div key={d} className="text-[8px] text-slate-500 font-bold uppercase">{d}</div>)}
                                     </div>
                                     <div className="grid grid-cols-7 gap-0.5">
                                       {(() => {
                                         const year = calendarDate.getFullYear();
                                         const month = calendarDate.getMonth();
                                         const firstDay = new Date(year, month, 1).getDay();
                                         const daysInMonth = new Date(year, month + 1, 0).getDate();
                                         const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday first
                                         
                                         const days = [];
                                         for (let i = 0; i < offset; i++) days.push(<div key={`empty-${i}`} />);
                                         
                                         const selectedDates = getSelectedDatesFromText(chatInputValue);
                                         
                                         for (let i = 1; i <= daysInMonth; i++) {
                                           const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                                           const isSelected = selectedDates.includes(dateString);
                                           days.push(
                                             <button 
                                               key={i} 
                                               onClick={() => toggleDateSelection(dateString)}
                                               className={`w-6 h-6 rounded-md text-[10px] flex items-center justify-center transition ${isSelected ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-900/50' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                                             >
                                               {i}
                                             </button>
                                           );
                                         }
                                         return days;
                         })()}
                                     </div>
                                   </div>
                                 )}
                               </div>
                               <button onClick={() => { handleChatSubmit(chatInputValue); setIsCalendarOpen(false); }} className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full transition shadow-md">
                                 <Send size={16} />
                               </button>
                             </div>
                           </div>
                           <button onClick={() => { handleChatSubmit('', undefined, true); setIsCalendarOpen(false); }} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-sm font-medium transition border border-slate-600 whitespace-nowrap" title="Cevapsız Bırak">
                             Geç
                           </button>
                         </div>
                       </div>
                     )}
                     
                     {/* Restart Button */}
                     {getUnifiedFillFields().length > 0 && currentChatStep >= getUnifiedFillFields().length && (
                        <div className="flex flex-col gap-2 w-full mt-4">
                           <button onClick={handleChatUndo} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition flex items-center justify-center gap-2 border border-slate-700">
                             <ChevronLeft size={16} /> Son Adıma Geri Dön
                           </button>
                           <button onClick={() => {
                              setCurrentChatStep(0); setFillValues({}); setProjectFrontSelections({}); setProjectBackSelections({}); const first = getUnifiedFillFields()[0]; const isChoiceOrBg = first && (first.type === "bg_front" || first.type === "bg_back" || first.type === ElementType.DROPDOWN || first.type === ElementType.CHOICE_BOX);
                              setChatHistory([{ id: Date.now().toString(), sender: "bot", text: `Baştan başlıyoruz. Lütfen **${first?.displayLabel || "bilgileri"}** ${isChoiceOrBg ? "seçiniz:" : "giriniz:"}` }]);
                           }} className="w-full py-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 rounded-xl text-sm transition flex items-center justify-center gap-2 border border-amber-500/20">
                             <RotateCcw size={16} /> Formu Sıfırla
                           </button>
                        </div>
                     )}
                   </div>
                 ) : (
                   <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6 custom-scrollbar">
                    {getUnifiedFillFields().length === 0 ? (
                        <div className="text-slate-500 text-center py-10 select-none">
                          Seçili projelerde doldurulacak ortak alan bulunamadı veya seçim yapmadınız.
                        </div>
                      ) : (
                          <>
                          {getUnifiedFillFields().filter(f => f.type !== ElementType.CHOICE_BOX).map((field, idx) => (
                         <div key={idx} className="space-y-2">
                            {((field.type as any) === "bg_front" || (field.type as any) === "bg_back") ? (
                              <div className="space-y-2.5 bg-slate-900/80 p-4 rounded-xl border border-slate-700/80 shadow-md">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                                  <label className="text-sm font-semibold text-amber-400 flex items-center gap-2 select-none">
                                    <ImageIcon size={15} className="text-amber-500" />
                                    <span>{field.displayLabel}</span>
                                  </label>
                                  <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono uppercase font-bold">
                                    ARKAPLAN SEÇİMİ
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {field.variantOptions?.map((opt) => {
                                    const currentSelected = (field.type as any) === "bg_front"
                                      ? (projectFrontSelections[field.projectId!] !== undefined ? projectFrontSelections[field.projectId!] : (projects.find(p => p.id === field.projectId)?.selectedFrontId || "DEFAULT"))
                                      : (projectBackSelections[field.projectId!] !== undefined ? projectBackSelections[field.projectId!] : (projects.find(p => p.id === field.projectId)?.selectedBackId || "DEFAULT"));
                                    const isChosen = currentSelected === opt.id || (!currentSelected && opt.id === "DEFAULT");
                                    return (
                                      <button
                                        type="button"
                                        key={opt.id}
                                        onClick={() => {
                                          if ((field.type as any) === "bg_front") {
                                            setProjectFrontSelections(prev => ({ ...prev, [field.projectId!]: opt.id }));
                                          } else {
                                            setProjectBackSelections(prev => ({ ...prev, [field.projectId!]: opt.id }));
                                          }
                                          setFillValues(prev => ({ ...prev, [field.label]: opt.id }));
                                        }}
                                        className={`p-3 rounded-lg border text-left text-xs transition flex items-center justify-between cursor-pointer ${
                                          isChosen 
                                            ? "bg-amber-500/15 border-amber-500 text-amber-200 font-bold shadow-md shadow-amber-900/20" 
                                            : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <ImageIcon size={13} className={isChosen ? "text-amber-400" : "text-slate-500"} />
                                          <span className="truncate">{opt.name}</span>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                                          isChosen ? "border-amber-500 bg-amber-500" : "border-slate-600"
                                        }`}>
                                          {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-slate-950 font-bold" />}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <>
                            <label className="text-sm font-medium text-amber-500 flex justify-between select-none items-center">
                              <span className="truncate pr-2 flex items-center gap-2">
                                <span>{field.displayLabel}</span>
                                {(field.label === selectedTrainingDateKey || (field.type === ElementType.DATE && field.dateKind !== 'validity') || field.label.toLowerCase().includes('başlangıç') || field.label.toLowerCase().includes('baslangic')) && (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    ⭐ Başlangıç Tarihi (Grup Referansı)
                                  </span>
                                )}
                                {isValidityDateField(field.label) && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">
                                    ⌛ Otomatik Geçerlilik
                                  </span>
                                )}
                              </span>
                              <span className="text-slate-500 text-[10px] bg-slate-900 px-2 rounded uppercase shrink-0 font-bold">{field.type === ElementType.DROPDOWN ? 'SEÇENEK' : (field.type === ElementType.COMPANY ? 'FİRMA' : (field.type === ElementType.TCKN ? 'TC NO' : (field.type === ElementType.DATE ? 'TARİH BİLEŞENİ' : (field.type === ElementType.QRCODE ? 'QR VERİSİ' : field.type))))}</span>
                            </label>
                            {(field.type === ElementType.TEXT || field.type === ElementType.QRCODE || field.type === ElementType.TCKN) && (
                              <div>
                                <textarea rows={field.label.toLowerCase().includes('adres') ? 3 : 1} value={fillValues[field.label] || ''} onChange={(e) => handleFillFieldChange(field.label, e.target.value, field.type as ElementType)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:border-amber-500 outline-none text-white placeholder-slate-600 transition resize-y min-h-[46px]" placeholder={field.type === ElementType.QRCODE ? "https://site.com" : (field.type === ElementType.TCKN ? "TC Kimlik No Girin (11 Hane)" : "Metin değeri girin")} style={{ overflow: 'hidden' }} maxLength={field.type === ElementType.TCKN ? 11 : undefined} onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'; }} />
                                {(() => {
                                  const isDateText = (field.label.toLowerCase().includes('tarih') || field.label.toLowerCase().includes('date')) && !isValidityDateField(field.label);
                                  if (!isDateText) return null;
                                  const val = fillValues[field.label];
                                  if (!val) return null;
                                  const parsed = parseDateDetailed(val);
                                  if (parsed) {
                                    return (
                                      <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pl-1 mt-1">
                                        <Check size={12} />
                                        <span>
                                          {parsed.isMultiDay 
                                            ? `Çok Günlü Eğitim: Bitiş ${String(parsed.endDay).padStart(2,'0')}.${String(parsed.month+1).padStart(2,'0')}.${parsed.year}` 
                                            : `Algılanan Tarih: ${String(parsed.endDay).padStart(2,'0')}.${String(parsed.month+1).padStart(2,'0')}.${parsed.year}`}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                            {field.type === ElementType.DATE && (
                              <div className="space-y-1.5">
                                <div className="relative flex items-center">
                                  <input 
                                    type="text"
                                    value={fillValues[field.label] || ''} 
                                    onChange={(e) => handleFillFieldChange(field.label, e.target.value, ElementType.DATE)}
                                    placeholder="Örn: 22.25/10/2026 veya 25.10.2026"
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-4 pr-10 py-3 focus:border-amber-500 outline-none text-white transition placeholder-slate-600 font-mono text-sm"
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                    <input 
                                      type="date" 
                                      id={`native-date-picker-${idx}`}
                                      className="sr-only"
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          const [y, m, d] = e.target.value.split('-');
                                          handleFillFieldChange(field.label, `${d}.${m}.${y}`, ElementType.DATE);
                                        }
                                      }}
                                    />
                                    <label 
                                      htmlFor={`native-date-picker-${idx}`} 
                                      className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-amber-400 cursor-pointer transition"
                                      title="Takvimden Tek Gün Seç"
                                    >
                                      <Calendar size={16} />
                                    </label>
                                  </div>
                                </div>
                                {(() => {
                                  const val = fillValues[field.label];
                                  if (!val) return null;
                                  const parsed = parseDateDetailed(val);
                                  if (parsed) {
                                    return (
                                      <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pl-1">
                                        <Check size={12} />
                                        <span>
                                          {parsed.isMultiDay 
                                            ? `Çok Günlü Eğitim: Bitiş ${String(parsed.endDay).padStart(2,'0')}.${String(parsed.month+1).padStart(2,'0')}.${parsed.year}` 
                                            : `Algılanan Tarih: ${String(parsed.endDay).padStart(2,'0')}.${String(parsed.month+1).padStart(2,'0')}.${parsed.year}`}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        const now = new Date();
                                        const d = String(now.getDate()).padStart(2, '0');
                                        const m = String(now.getMonth() + 1).padStart(2, '0');
                                        const y = now.getFullYear();
                                        handleFillFieldChange(field.label, `${d}.${m}.${y}`, ElementType.DATE);
                                      }}
                                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 transition"
                                      title="Bugünün tarihini gir"
                                    >
                                      Bugün ({formatDateTR(new Date())})
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        const yesterday = new Date();
                                        yesterday.setDate(yesterday.getDate() - 1);
                                        const d = String(yesterday.getDate()).padStart(2, '0');
                                        const m = String(yesterday.getMonth() + 1).padStart(2, '0');
                                        const y = yesterday.getFullYear();
                                        handleFillFieldChange(field.label, `${d}.${m}.${y}`, ElementType.DATE);
                                      }}
                                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 transition"
                                      title="Dünün tarihini gir"
                                    >
                                      Dün
                                    </button>
                                  </div>
                                  <span className="text-[10px] text-amber-400/90 italic">
                                    ✦ Gruptaki tüm sertifikaların başlangıç tarihi kabul edilir
                                  </span>
                                </div>
                              </div>
                            )}
                            {field.type === ElementType.DROPDOWN && (<div className="relative"><select value={fillValues[field.label] || ''} onChange={(e) => handleFillFieldChange(field.label, e.target.value, ElementType.DROPDOWN)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:border-amber-500 outline-none text-white appearance-none cursor-pointer hover:bg-slate-800 transition"><option value="">Bir seçenek belirleyin...</option>{field.options && field.options.map((opt, i) => (<option key={i} value={opt}>{opt}</option>))}</select><div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div></div>)}
                            {field.type === ElementType.COMPANY && (() => {
                               const currentVal = fillValues[field.label] || '';
                               const filtered = currentVal ? companies.filter(c => turkishToLower(c.name).includes(turkishToLower(currentVal)) || (c.shortName && turkishToLower(c.shortName).includes(turkishToLower(currentVal)))) : companies;
                               return (
                                 <div className="relative">
                                   <input 
                                     list={`companies-list-${idx}`} 
                                     value={currentVal} 
                                     onChange={(e) => setFillValues(prev => ({ ...prev, [field.label]: e.target.value }))} 
                                     className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:border-green-500 outline-none text-white transition placeholder-slate-600" 
                                     placeholder="Yazarak arayın veya seçin..." 
                                   />
                                   <datalist id={`companies-list-${idx}`}>
                                     {filtered.map((company, i) => (
                                       <option key={i} value={company.name}>{company.name}</option>
                                     ))}
                                   </datalist>
                                   {companies.length === 0 && (
                                     <div className="text-[10px] text-red-400 mt-1">Firma listesi boş. Ayarlar sekmesinden ekleyebilirsiniz.</div>
                                   )}
                                 </div>
                               );
               })()}
                            {field.type === ElementType.SIGNATURE && (<div className="relative"><select value={fillValues[field.label] || ''} onChange={(e) => setFillValues(prev => ({ ...prev, [field.label]: e.target.value }))} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:border-amber-500 outline-none text-white appearance-none cursor-pointer hover:bg-slate-800 transition"><option value="">İmza Seçiniz...</option>{signatures.filter(sig => !field.allowedSignatureIds || field.allowedSignatureIds.length === 0 || field.allowedSignatureIds.includes(sig.id)).map(sig => (<option key={sig.id} value={sig.url}>{sig.name}</option>))}</select><div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>{field.allowedSignatureIds && field.allowedSignatureIds.length > 0 && (<div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><Filter size={10} /> Bu alan için {field.allowedSignatureIds.length} adet imza tanımlı.</div>)}</div>)}
                              </>
                            )}
                         </div>
                        ))}
                        {getUnifiedFillFields().some(f => f.type === ElementType.CHOICE_BOX) && (
                            <div className="border-t border-slate-700 pt-4 mt-4">
                                <button onClick={() => setShowChoiceFields(!showChoiceFields)} className="flex items-center justify-between w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-sm text-slate-300 font-medium"><div className="flex items-center gap-2"><SlidersHorizontal size={16} /><span>Seçim Kutuları / Onaylar</span><span className="bg-slate-600 text-white text-[10px] px-1.5 rounded-full">{getUnifiedFillFields().filter(f => f.type === ElementType.CHOICE_BOX).length}</span></div>{showChoiceFields ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
                                {showChoiceFields && (<div className="mt-3 space-y-4 pl-2 border-l-2 border-slate-700 animate-in fade-in slide-in-from-top-2">{getUnifiedFillFields().filter(f => f.type === ElementType.CHOICE_BOX).map((field, idx) => (<div key={`choice-${idx}`} className="space-y-2"><label className="text-xs font-medium text-slate-400 flex justify-between select-none"><span>{field.displayLabel}</span></label><div className="flex flex-col gap-2 bg-slate-900 p-2 rounded border border-slate-700">{field.options && field.options.map((opt, i) => { const currentVal = fillValues[field.label] || field.defaultValue || field.options?.[0]; const isChecked = currentVal === opt; return (<label key={i} className="flex items-center gap-3 cursor-pointer group p-1 rounded hover:bg-slate-800 transition"><input type="radio" name={field.label} value={opt} checked={isChecked} onChange={(e) => setFillValues(prev => ({ ...prev, [field.label]: e.target.value }))} className="hidden" /><div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${isChecked ? 'border-amber-500' : 'border-slate-500 group-hover:border-slate-400'}`}>{isChecked && <div className="w-2 h-2 bg-amber-500 rounded-full" />}</div><span className={`text-xs ${isChecked ? 'text-white' : 'text-slate-500'}`}>{opt}</span></label>)})}</div></div>))}</div>)}
                                {!showChoiceFields && (<p className="text-[10px] text-slate-500 mt-2 text-center">Varsayılan seçenekler (Örn: Evet) kullanılacak. Değiştirmek için tıklayın.</p>)}
                            </div>
                        )}
                        </>
                      )}
                   </div>
                 )}

                 <div className="hidden md:block">
                    <div className="p-6 border-t border-slate-700 bg-slate-900 shrink-0 select-none space-y-4">
                       {/* EXPORT MODE TOGGLE */}
                       {selectedFillProjectIds.length > 1 && (
                           <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                               <button 
                                   onClick={() => setExportMode('single')} 
                                   className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-medium transition ${exportMode === 'single' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                               >
                                   <FileStack size={14} /> Tek Dosya (Birleştir)
                               </button>
                               <button 
                                   onClick={() => setExportMode('separate')} 
                                   className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-medium transition ${exportMode === 'separate' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                               >
                                   <Files size={14} /> Ayrı Dosyalar (Klasör)
                               </button>
                           </div>
                       )}

                       <button 
                         onClick={exportPDF}
                         disabled={isGenerating}
                         className={`w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition active:scale-95 transform ${isGenerating ? 'opacity-70 cursor-wait' : ''}`}
                       >
                         {isGenerating ? (
                             <div className="flex items-center gap-2">
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                {progress > 0 && <span className="text-xs">{progress}%</span>}
                             </div>
                         ) : (
                             <Download size={22} />
                         )}
                         {isGenerating ? 'Kaydediliyor...' : `BİLGİSAYARA İNDİR (${selectedFillProjectIds.length})`}
                       </button>

                       {exportMode === 'separate' && selectedFillProjectIds.length > 1 && (
                           <p className="text-[10px] text-slate-500 text-center">Seçilen klasöre tüm sertifikalar ayrı ayrı kaydedilecektir.</p>
                       )}
                    </div>
                 </div>
              </div>

              {/* LIST PREVIEW MODE */}
              <div className={`${mobileFillStep === 2 ? 'flex w-full' : 'hidden md:flex'} flex-1 bg-[#0b0f19] overflow-auto p-4 md:p-10 flex-col items-center gap-6 md:gap-10 custom-scrollbar relative pb-32`}>
                <div className="md:hidden w-full max-w-md mx-auto mb-4 relative z-20">
                     <div className="p-4 border border-slate-700 bg-slate-900 rounded-xl select-none space-y-4 shadow-xl">
                       {selectedFillProjectIds.length > 1 && (
                           <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                               <button onClick={() => setExportMode('single')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-[10px] font-medium transition ${exportMode === 'single' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><FileStack size={14} /> Tek Dosya</button>
                               <button onClick={() => setExportMode('separate')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-[10px] font-medium transition ${exportMode === 'separate' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><Files size={14} /> Ayrı Dosyalar</button>
                           </div>
                       )}
                       <button onClick={exportPDF} disabled={isGenerating || selectedFillProjectIds.length === 0} className={`w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition active:scale-95 transform ${isGenerating ? 'opacity-70 cursor-wait' : ''} ${selectedFillProjectIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                         {isGenerating ? (<div className="flex items-center gap-2"><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />{progress > 0 && <span className="text-xs">{progress}%</span>}</div>) : (<Download size={22} />)}
                         {isGenerating ? 'Kaydediliyor...' : `BİLGİSAYARA İNDİR (${selectedFillProjectIds.length})`}
                       </button>

                    </div>
                </div>

                {selectedFillProjectIds.length > 0 && (
                    <div className="text-slate-500 text-sm mb-4 select-none whitespace-nowrap">
                        Önizleme ({selectedFillProjectIds.length} Proje). Arka yüzü olan kartları çevirmek için üzerine tıklayın.
                    </div>
                )}
                <div className="flex flex-col items-center gap-10 min-w-max">
                  {projects.filter(p => selectedFillProjectIds.includes(p.id)).map(p => {
                    const side = previewSides[p.id] || 'front';
                    const activeBack = getActiveSideData(p, 'back', true);
                    const hasBack = activeBack && (activeBack.bgUrl || activeBack.elements.length > 0);
                    const previewWidth = 700; 
                    const calcScale = previewWidth / p.width;
                    const activeSideData = getActiveSideData(p, side, true);
                    return (
                        <div key={p.id} onClick={() => { if (hasBack) { togglePreviewSide(p.id); } }} className={`relative group transition-all duration-300 ${hasBack ? 'cursor-pointer' : 'cursor-default'}`}>
                            <div className="absolute -top-3 left-4 z-10 flex gap-2 select-none"><span className="bg-slate-800 text-white text-xs px-3 py-1 rounded-full border border-slate-700 shadow-lg font-bold">{p.name}</span><span className={`text-xs px-2 py-1 rounded-full border shadow-lg font-bold flex items-center gap-1 ${side === 'front' ? 'bg-blue-900/80 text-blue-200 border-blue-700' : 'bg-purple-900/80 text-purple-200 border-purple-700'}`}>{side === 'front' ? 'ÖN YÜZ' : 'ARKA YÜZ'}</span>{hasBack && (<span className="bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded-full border border-slate-600 flex items-center gap-1 group-hover:bg-amber-600 group-hover:text-white transition-colors"><RotateCcw size={10} /> Çevir</span>)}</div>
                            <div className={`rounded-lg overflow-hidden border-4 shadow-2xl transition-colors ${activeProjectId === p.id ? 'border-amber-500/50' : 'border-slate-800'} ${hasBack ? 'hover:border-slate-600' : ''}`}><CanvasEditor elements={getPreviewElements(p, side)} width={p.width} height={p.height} bgUrl={activeSideData?.bgUrl || ''} selectedId={null} onSelect={() => {}} onUpdateElement={() => {}} onDeleteElement={() => {}} scale={calcScale} readOnly={true} /></div>
                        </div>
                    );
  })}
                </div>
                {selectedFillProjectIds.length === 0 && (<div className="flex flex-col items-center justify-center h-full text-slate-500 select-none"><LayoutTemplate size={48} className="mb-4 opacity-20" /><p>Önizleme için soldan proje seçiniz.</p></div>)}
              </div>
            </div>
           </div>
        )}
      </div>
      {showSignaturePad && (<SignaturePad onSave={handleSignatureDrawSave} onClose={() => setShowSignaturePad(false)} />)}
      {/* USER MANAGEMENT MODAL */}
      <UserManagementModal 
        isOpen={showUserModal} 
        onClose={() => setShowUserModal(false)} 
        getApiUrl={getApiUrl} 
      />

      {/* EMPLOYEE MODAL (ÇALIŞAN KARTI & EVRAKLAR) */}
      <EmployeeModal
        isOpen={showEmployeeModal}
        employeeIdOrTc={activeEmployeeIdOrTc || ''}
        onClose={() => {
          setShowEmployeeModal(false);
          setActiveEmployeeIdOrTc(null);
        }}
        onEditCertificate={handleEditCertificate}
        onStatusChanged={() => {
          fetchCertificatesAndStats();
        }}
        getApiUrl={getApiUrl}
      />
    </div>
  );
};

export default App;