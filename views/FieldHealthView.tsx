import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  UserCheck, 
  PenTool, 
  CheckCircle2, 
  ArrowLeft, 
  AlertCircle, 
  Activity, 
  FileText, 
  Heart, 
  Stethoscope, 
  HelpCircle, 
  Sparkles, 
  Lock, 
  KeyRound, 
  LogOut,
  ChevronRight,
  ClipboardList,
  ShieldCheck,
  Plus,
  RefreshCw,
  FileCheck2
} from 'lucide-react';
import { Company, Employee, Ek2FormRecord, AppUser } from '../types';
import { FullScreenTabletSignature } from '../components/FullScreenTabletSignature';

interface FieldHealthViewProps {
  onBackToApp?: () => void;
  currentUser?: any;
}

export const FieldHealthView: React.FC<FieldHealthViewProps> = ({
  onBackToApp,
  currentUser: initialUser
}) => {
  // --- AUTH / PIN STATES ---
  const [activeUser, setActiveUser] = useState<AppUser | null>(initialUser || null);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [pinLoading, setPinLoading] = useState(false);

  // --- STEP STATES ---
  // 'pin' -> 'companies' -> 'form'
  const [step, setStep] = useState<'pin' | 'companies' | 'form'>('pin');

  // --- DATA STATES ---
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companySearch, setCompanySearch] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  // --- FORM FIELDS STATE ---
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('new');
  const [formData, setFormData] = useState<Record<string, any>>({
    // Header & Company
    protokolNo: '',
    isyeriUnvani: '',
    sgkSicilNo: '',
    isyeriAdresi: '',
    isyeriIletisim: '',

    // Employee
    adSoyad: '',
    tckn: '',
    evAdresi: '',
    dogumYeriTarihi: '',
    medeniDurumu: 'Bekar',
    cocukSayisi: '0',
    telefonNo: '',
    egitimDurumu: 'Lise',
    cinsiyet: 'Erkek',
    meslegi: '',
    calistigiBolum: '',
    yaptigiIs: '',

    // Past Jobs
    gecmisIsler: '1. -\n2. -\n3. -',

    // Anamnez Complaints (Evet/Hayır)
    an_balgamli_oksuruk: 'Hayır',
    an_nefes_darligi: 'Hayır',
    an_gogus_agrisi: 'Hayır',
    an_carpinti: 'Hayır',
    an_sirt_agrisi: 'Hayır',
    an_ishal_kabizlik: 'Hayır',
    an_eklem_agrisi: 'Hayır',
    an_diger_belirti: '',

    // Anamnez Diseases (Evet/Hayır)
    an_kalp: 'Hayır',
    an_seker: 'Hayır',
    an_bobrek: 'Hayır',
    an_sarilik: 'Hayır',
    an_ulser: 'Hayır',
    an_isitme: 'Hayır',
    an_gorme: 'Hayır',
    an_sinir: 'Hayır',
    an_deri: 'Hayır',
    an_besin: 'Hayır',
    an_diger_hastalik: '',

    // Anamnez Questions 3-10
    an_hastane: 'Hayır',
    an_ameliyat: 'Hayır',
    an_is_kazasi: 'Hayır',
    an_meslek_hastaligi: 'Hayır',
    an_maluliyet: 'Hayır',
    an_mevcut_tedavi: 'Hayır',
    an_sigara: 'Hayır',
    an_sigara_detay: '',
    an_alkol: 'Hayır',
    an_alkol_detay: '',

    // Özgeçmiş & Soygeçmiş
    kanGrubu: 'A Rh(+)',
    kronikHastalik: 'Yok',
    asiTetanoz: 'Var',
    asiHepatit: 'Bağışık',
    soy_anne: 'Sağ / Doğal',
    soy_baba: 'Sağ / Doğal',
    soy_kardes: 'Sağ / Doğal',
    soy_cocuk: 'Sağ / Doğal',

    // Fizik Muayene & Vital
    vital_ta: '120/80',
    vital_nb: '76',
    vital_boy: '175',
    vital_kilo: '75',
    vital_vki: '24.5 kg/m² (Normal)',
    fm_duyu_organlari: 'Göz, KBB ve Deri muayenesi doğal.',
    fm_kvs: 'S1, S2 ritmik, ek ses ve üfürüm yok.',
    fm_solunum: 'Solunum sesleri bilateral veziküler, ral-ronküs yok.',
    fm_sindirim: 'Batın rahat, defans/rebound yok.',
    fm_urogenital: 'Doğal.',
    fm_kas_iskelet: 'Eklem hareket açıklıkları tam, deformite yok.',
    fm_norolojik: 'Bilinç açık, oryante, koopere, patolojik refleks yok.',
    fm_psikiyatrik: 'Duygulanım ve düşünce içeriği doğal.',

    // Lab
    lab_bulgulari: 'Rutin biyolojik ve fizyolojik parametreler normal sınırlardadır.',

    // Kanaat ve Sonuç
    dec_elverisli: 'İşinde bedenen ve ruhen çalışmaya elverişlidir.',
    dec_kosullar: 'Yüksekte, Gece ve Vardiyalı çalışmaya elverişlidir.',
    dec_sart: 'Yoktur.',
    hekimAdi: 'Dr. İşyeri Hekimi'
  });

  // --- SIGNATURE AND POPUP STATES ---
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [employeeSignature, setEmployeeSignature] = useState<string>('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [testNotes, setTestNotes] = useState('');
  const [savingForm, setSavingForm] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

  // Auto calculate VKİ when boy or kilo changes
  useEffect(() => {
    const boyCm = parseFloat(formData.vital_boy);
    const kiloKg = parseFloat(formData.vital_kilo);
    if (boyCm > 50 && kiloKg > 20) {
      const boyM = boyCm / 100;
      const vki = kiloKg / (boyM * boyM);
      const rounded = vki.toFixed(1);
      let desc = 'Normal';
      if (vki < 18.5) desc = 'Zayıf';
      else if (vki >= 25 && vki < 30) desc = 'Fazla Kilolu';
      else if (vki >= 30) desc = 'Obez';

      setFormData(prev => ({
        ...prev,
        vital_vki: `${rounded} kg/m² (${desc})`
      }));
    }
  }, [formData.vital_boy, formData.vital_kilo]);

  // Helper for auth token retrieval across tablet and main session
  const getAuthToken = () => {
    try {
      return localStorage.getItem('vps_session_token') || localStorage.getItem('token') || '';
    } catch {
      return '';
    }
  };

  // Load companies and employees
  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const token = getAuthToken();
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [resData, resEmp] = await Promise.all([
        fetch('/api/data', { headers }),
        fetch('/api/employees', { headers })
      ]);

      if (resData.ok) {
        const d = await resData.json();
        setCompanies(d.companies || []);
      }
      if (resEmp.ok) {
        const emps = await resEmp.json();
        setEmployees(Array.isArray(emps) ? emps : []);
      }
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (activeUser) {
      setStep('companies');
      loadInitialData();
    } else {
      setStep('pin');
    }
  }, [activeUser]);

  // --- PIN NUMPAD HANDLERS ---
  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 8) {
      setPinInput(prev => prev + digit);
      setPinError('');
    }
  };

  const handlePinClear = () => {
    setPinInput('');
    setPinError('');
  };

  const handlePinDelete = () => {
    setPinInput(prev => prev.slice(0, -1));
    setPinError('');
  };

  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('Lütfen şifrenizi giriniz.');
      return;
    }

    try {
      setPinLoading(true);
      setPinError('');
      const res = await fetch('/api/health/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('vps_session_token', data.token);
        localStorage.setItem('token', data.token);
        setActiveUser(data.user);
        setStep('companies');
        setPinInput('');
      } else {
        setPinError(data.error || 'Şifre hatalı!');
      }
    } catch (err) {
      setPinError('Sunucu bağlantı hatası!');
    } finally {
      setPinLoading(false);
    }
  };

  // --- COMPANY SELECTION HANDLER ---
  const handleSelectCompany = (comp: Company) => {
    setSelectedCompany(comp);
  };

  const handleStartEk2Form = () => {
    if (!selectedCompany) return;

    // Prefill company details into formData
    setFormData(prev => ({
      ...prev,
      protokolNo: `PRT-${Date.now().toString().slice(-6)}`,
      isyeriUnvani: selectedCompany.name,
      sgkSicilNo: (selectedCompany as any).sgkSicilNo || '16.01.01.01.1234567.016',
      isyeriAdresi: (selectedCompany as any).address || 'Nilüfer / BURSA',
      isyeriIletisim: (selectedCompany as any).phone || '0224 000 00 00',
      hekimAdi: activeUser?.name || 'Dr. İşyeri Hekimi'
    }));

    setSelectedEmployeeId('new');
    setEmployeeSignature('');
    setStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Populate employee details if an existing one is selected
  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (empId === 'new') {
      setFormData(prev => ({
        ...prev,
        adSoyad: '',
        tckn: '',
        meslegi: '',
        calistigiBolum: '',
        yaptigiIs: ''
      }));
      return;
    }

    const emp = employees.find(e => e.id === empId || e.tc === empId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        adSoyad: emp.name,
        tckn: emp.tc,
        meslegi: (emp as any).jobTitle || '',
        calistigiBolum: (emp as any).department || '',
        yaptigiIs: (emp as any).jobDescription || (emp as any).jobTitle || ''
      }));
    }
  };

  // Quick template helpers
  const applyAllSystemsNormal = () => {
    setFormData(prev => ({
      ...prev,
      fm_duyu_organlari: 'Göz, KBB ve Deri muayenesi doğal.',
      fm_kvs: 'S1, S2 ritmik, ek ses ve üfürüm yok.',
      fm_solunum: 'Solunum sesleri bilateral veziküler, ral-ronküs yok.',
      fm_sindirim: 'Batın rahat, defans/rebound yok.',
      fm_urogenital: 'Doğal.',
      fm_kas_iskelet: 'Eklem hareket açıklıkları tam, deformite yok.',
      fm_norolojik: 'Bilinç açık, oryante, koopere, patolojik refleks yok.',
      fm_psikiyatrik: 'Duygulanım ve düşünce içeriği doğal.',
      lab_bulgulari: 'Tüm biyolojik ve fizyolojik analizler normal sınırlardadır.'
    }));
  };

  const applyAllAnamnezNegative = () => {
    setFormData(prev => ({
      ...prev,
      an_balgamli_oksuruk: 'Hayır',
      an_nefes_darligi: 'Hayır',
      an_gogus_agrisi: 'Hayır',
      an_carpinti: 'Hayır',
      an_sirt_agrisi: 'Hayır',
      an_ishal_kabizlik: 'Hayır',
      an_eklem_agrisi: 'Hayır',
      an_kalp: 'Hayır',
      an_seker: 'Hayır',
      an_bobrek: 'Hayır',
      an_sarilik: 'Hayır',
      an_ulser: 'Hayır',
      an_isitme: 'Hayır',
      an_gorme: 'Hayır',
      an_sinir: 'Hayır',
      an_deri: 'Hayır',
      an_besin: 'Hayır',
      an_hastane: 'Hayır',
      an_ameliyat: 'Hayır',
      an_is_kazasi: 'Hayır',
      an_meslek_hastaligi: 'Hayır',
      an_maluliyet: 'Hayır',
      an_mevcut_tedavi: 'Hayır'
    }));
  };

  // --- SAVE FORM FLOW ---
  const handleSaveFormClick = () => {
    if (!formData.adSoyad || !formData.tckn) {
      alert("Lütfen çalışanın Adı Soyadı ve T.C. Kimlik Numarasını giriniz.");
      return;
    }

    if (!employeeSignature) {
      // Prompt signature pad if not signed yet
      setShowSignaturePad(true);
      return;
    }

    // Next Step: Prompt "Tetkiki var mı?"
    setShowTestModal(true);
  };

  const handleSignatureConfirmed = (signatureDataUrl: string) => {
    setEmployeeSignature(signatureDataUrl);
    setShowSignaturePad(false);
    // After signature is recorded on tablet, immediately pop up "Tetkiki var mı?" as requested!
    setShowTestModal(true);
  };

  const finalizeSaveForm = async (hasTests: boolean) => {
    try {
      setSavingForm(true);
      const token = getAuthToken();
      const companyTitle = selectedCompany?.name || formData.isyeriUnvani || 'Genel Firma';
      const empName = formData.adSoyad || 'İsimsiz Çalışan';

      const formPayload: Partial<Ek2FormRecord> = {
        protocolNo: formData.protokolNo || `PRT-${Date.now().toString().slice(-6)}`,
        companyId: selectedCompany?.id || '',
        companyName: companyTitle,
        employeeTc: formData.tckn || '',
        employeeName: empName,
        fields: {
          ...formData,
          isyeriUnvani: companyTitle,
          adSoyad: empName
        },
        employeeSignature: employeeSignature,
        doctorName: formData.hekimAdi || 'Dr. İşyeri Hekimi',
        hasMedicalTests: hasTests,
        medicalTestNotes: hasTests ? testNotes : '',
        selectedTests: hasTests ? selectedTests : [],
        createdAt: Date.now(),
        createdById: activeUser?.id || 'saha-user',
        createdByName: activeUser?.name || 'Sağlık Personeli'
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/health/ek2-forms', {
        method: 'POST',
        headers,
        body: JSON.stringify(formPayload)
      });

      const data = await res.json().catch(() => null);

      if (res.ok && (data?.success || data?.form)) {
        setShowTestModal(false);
        setSaveSuccessMessage(`${empName} için EK-2 İşe Giriş / Periyodik Muayene Formu başarıyla kaydedildi!`);
        setTimeout(() => {
          setSaveSuccessMessage('');
          // Return to Step 2: Company List as requested!
          setStep('companies');
          setSelectedCompany(null);
          setEmployeeSignature('');
          // Clear employee specific fields for the next examination
          setFormData(prev => ({
            ...prev,
            adSoyad: '',
            tckn: '',
            meslegi: '',
            calistigiBolum: '',
            yaptigiIs: '',
            evAdresi: '',
            telefonNo: '',
            dogumYeriTarihi: '',
            protokolNo: ''
          }));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 2000);
      } else {
        const errorMsg = data?.error || res.statusText || 'Bilinmeyen hata';
        alert(`Form kaydedilemedi: ${errorMsg}`);
      }
    } catch (e: any) {
      console.error("Form kaydetme hatası:", e);
      alert(`Bağlantı hatası: ${e.message || e}`);
    } finally {
      setSavingForm(false);
    }
  };

  // Filter companies
  const filteredCompanies = useMemo(() => {
    if (!companySearch) return companies;
    const q = companySearch.toLowerCase();
    return companies.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.shortName && c.shortName.toLowerCase().includes(q))
    );
  }, [companies, companySearch]);

  // Company employees
  const companyEmployees = useMemo(() => {
    if (!selectedCompany) return [];
    return employees.filter(e => 
      (e.companyId && e.companyId === selectedCompany.id) || 
      (e.companyName && e.companyName.toLowerCase() === selectedCompany.name.toLowerCase())
    );
  }, [employees, selectedCompany]);

  // Input styling constant for 100% consistent high-contrast colors
  const inputCls = "w-full text-xs font-semibold bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-600 placeholder-slate-400 shadow-sm transition";
  const labelCls = "block text-xs font-bold text-slate-700 mb-1.5";

  // ==========================================
  // RENDER SCREEN 1: PIN NUMPAD (Tablet Auth)
  // ==========================================
  if (step === 'pin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex flex-col justify-center items-center p-6 text-white select-none">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/10">
            <Stethoscope className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white text-center">
            Saha Sağlık & Muayene Modülü
          </h1>
          <p className="text-xs text-slate-400 text-center mt-1 mb-6">
            Lütfen size tanımlanan tablet PIN şifrenizi giriniz
          </p>

          <div className="w-full flex items-center justify-center gap-3 py-4 mb-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            {pinInput.length === 0 ? (
              <span className="text-slate-500 text-sm font-medium">Şifrenizi tuşlayınız</span>
            ) : (
              pinInput.split('').map((_, idx) => (
                <div key={idx} className="w-3.5 h-3.5 rounded-full bg-teal-400 animate-scaleUp shadow-sm shadow-teal-400"></div>
              ))
            )}
          </div>

          {pinError && (
            <div className="w-full mb-4 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 w-full mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handlePinDigit(num)}
                className="h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-teal-600 text-2xl font-bold text-white shadow-md transition active:scale-95 flex items-center justify-center border border-slate-700/50"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handlePinClear}
              className="h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700/60 active:scale-95 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center border border-slate-700/40"
            >
              Temizle
            </button>

            <button
              type="button"
              onClick={() => handlePinDigit('0')}
              className="h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-teal-600 text-2xl font-bold text-white shadow-md transition active:scale-95 flex items-center justify-center border border-slate-700/50"
            >
              0
            </button>

            <button
              type="button"
              onClick={handlePinDelete}
              className="h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700/60 active:scale-95 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center border border-slate-700/40"
            >
              Sil
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePinSubmit()}
            disabled={pinLoading || pinInput.length === 0}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition active:scale-95 flex items-center justify-center gap-2 ${
              pinInput.length > 0 && !pinLoading
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-teal-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <KeyRound className="w-5 h-5" />
            {pinLoading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
          </button>

          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="mt-6 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Sertifika Yönetim Masasına Geri Dön &rarr;
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER SCREEN 2: FİRMA ARAMA & SEÇİMİ
  // ==========================================
  if (step === 'companies') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col pb-32">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  Çankaya OSGB &bull; Saha Muayene
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Giriş Yapan: <strong>{activeUser?.name || 'Sağlık Personeli'}</strong> ({activeUser?.title || 'Yetkili'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onBackToApp && (
                <button
                  type="button"
                  onClick={onBackToApp}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Sertifika Masası
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setActiveUser(null);
                  setStep('pin');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Çıkış
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-8 w-full">
          {saveSuccessMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500 text-white shadow-xl flex items-center gap-3 animate-bounce">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <p className="font-bold text-sm">{saveSuccessMessage}</p>
            </div>
          )}

          <div className="mb-8">
            <div className="relative">
              <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
                placeholder="Firma Adı veya Ünvanı ile Arayınız..."
                className="w-full pl-13 pr-4 py-4 text-base font-semibold bg-white text-slate-900 border-2 border-slate-300 focus:border-teal-600 rounded-2xl shadow-sm focus:outline-none transition"
              />
              {companySearch && (
                <button
                  onClick={() => setCompanySearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-2 py-1 rounded-md"
                >
                  Temizle
                </button>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-2 px-1">
              Muayene yapacağınız firmayı aşağıdaki listeden seçiniz ({filteredCompanies.length} firma listeleniyor).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map(comp => {
              const isSelected = selectedCompany?.id === comp.id;
              return (
                <div
                  key={comp.id}
                  onClick={() => handleSelectCompany(comp)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-teal-50/90 border-teal-600 shadow-md ring-2 ring-teal-500/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        comp.dangerClass === 'cok_tehlikeli' 
                          ? 'bg-rose-100 text-rose-700' 
                          : comp.dangerClass === 'tehlikeli' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {comp.dangerClass === 'cok_tehlikeli' ? 'Çok Tehlikeli' : comp.dangerClass === 'tehlikeli' ? 'Tehlikeli' : 'Az Tehlikeli'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base line-clamp-2">
                      {comp.name}
                    </h3>
                    {comp.shortName && comp.shortName !== comp.name && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{comp.shortName}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Geçerlilik: {comp.validityYears || 1} Yıl</span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 font-bold text-teal-700">
                        <CheckCircle2 className="w-4 h-4" /> Seçildi
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Bottom Sticky Action Bar */}
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 shadow-2xl z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              {selectedCompany ? (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Seçilen Firma:</p>
                  <p className="text-base font-bold text-slate-900">{selectedCompany.name}</p>
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-600">
                  Devam etmek için listeden bir firma seçiniz.
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={!selectedCompany}
              onClick={handleStartEk2Form}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transition active:scale-95 ${
                selectedCompany
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-600/25 cursor-pointer animate-pulse'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
              }`}
            >
              <ClipboardList className="w-6 h-6" />
              EK-2 DOLDUR
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER SCREEN 3: EK-2 FORM DOLDURMA
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-36 text-slate-900">
      {/* Form Top Navigation Bar */}
      <div className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep('companies')}
            className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white transition bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Firma Listesine Dön
          </button>

          <div className="text-center">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
              İŞE GİRİŞ / PERİYODİK MUAYENE FORMU (EK-2)
            </h1>
            <p className="text-xs text-teal-300 font-medium">
              {selectedCompany?.name} &bull; Protokol No: {formData.protokolNo}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyAllAnamnezNegative}
              className="text-xs font-bold bg-teal-800/80 hover:bg-teal-700 text-teal-100 px-3 py-1.5 rounded-lg border border-teal-500/40 transition"
              title="Tüm yakınma ve hastalıkları tek tıkla Hayır yapar"
            >
              Anamnez Normal
            </button>
            <button
              type="button"
              onClick={applyAllSystemsNormal}
              className="text-xs font-bold bg-teal-800/80 hover:bg-teal-700 text-teal-100 px-3 py-1.5 rounded-lg border border-teal-500/40 transition"
              title="Tüm sistem bulgularını tek tıkla doğal olarak doldurur"
            >
              Fizik Muayene Normal
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-6 w-full space-y-6">
        {/* 1. ÇALIŞAN SEÇİMİ / HIZLI GİRİŞİ */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <UserCheck className="w-5 h-5 text-teal-600" />
            Çalışan Bilgileri (Havuzdan Seç veya Yeni Gir)
          </h2>

          <div className="mb-4">
            <label className={labelCls}>
              Kayıtlı Çalışan Seçimi
            </label>
            <select
              value={selectedEmployeeId}
              onChange={e => handleEmployeeChange(e.target.value)}
              className={inputCls}
            >
              <option value="new">+ Yeni Çalışan Olarak Doldur</option>
              {companyEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (T.C.: {emp.tc})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Adı ve Soyadı *</label>
              <input
                type="text"
                value={formData.adSoyad}
                onChange={e => setFormData({ ...formData, adSoyad: e.target.value })}
                placeholder="Ad Soyad"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>T.C. Kimlik No *</label>
              <input
                type="text"
                maxLength={11}
                value={formData.tckn}
                onChange={e => setFormData({ ...formData, tckn: e.target.value })}
                placeholder="11 haneli TCKN"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Mesleği / Görevi</label>
              <input
                type="text"
                value={formData.meslegi}
                onChange={e => setFormData({ ...formData, meslegi: e.target.value })}
                placeholder="örn: Kaynakçı, Torna vb."
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Çalıştığı Bölüm</label>
              <input
                type="text"
                value={formData.calistigiBolum}
                onChange={e => setFormData({ ...formData, calistigiBolum: e.target.value })}
                placeholder="Bölüm"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Doğum Yeri ve Tarihi</label>
              <input
                type="text"
                value={formData.dogumYeriTarihi}
                onChange={e => setFormData({ ...formData, dogumYeriTarihi: e.target.value })}
                placeholder="Bursa - 15.05.1990"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Telefon No</label>
              <input
                type="text"
                value={formData.telefonNo}
                onChange={e => setFormData({ ...formData, telefonNo: e.target.value })}
                placeholder="05XX XXX XX XX"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Cinsiyeti</label>
              <select
                value={formData.cinsiyet}
                onChange={e => setFormData({ ...formData, cinsiyet: e.target.value })}
                className={inputCls}
              >
                <option value="Erkek">Erkek</option>
                <option value="Kadın">Kadın</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Medeni Durumu</label>
              <select
                value={formData.medeniDurumu}
                onChange={e => setFormData({ ...formData, medeniDurumu: e.target.value })}
                className={inputCls}
              >
                <option value="Evli">Evli</option>
                <option value="Bekar">Bekar</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Çocuk Sayısı</label>
              <input
                type="number"
                min={0}
                value={formData.cocukSayisi}
                onChange={e => setFormData({ ...formData, cocukSayisi: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className={labelCls}>Yaptığı İş (Ayrıntılı Tanım)</label>
            <input
              type="text"
              value={formData.yaptigiIs}
              onChange={e => setFormData({ ...formData, yaptigiIs: e.target.value })}
              placeholder="Çalışanın vardiya, cihaz ve operasyonel iş detayları..."
              className={inputCls}
            />
          </div>
        </div>

        {/* 2. ÇALIŞAN BEYANI & İMZA ALANI (RESMİ EK-2 SAYFA 1 BÖLÜMÜ) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-teal-600" />
              Çalışan Beyanı & İmzası (Mevzuat Zorunlu)
            </h2>
            {employeeSignature ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                İmza Alındı
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                İmza Bekleniyor
              </span>
            )}
          </div>

          <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 leading-relaxed">
            "İşe giriş/periyodik muayene olmayı kabul ettiğimi ve muayene sırasında verdiğim bilgilerin doğru ve eksiksiz olduğunu beyan ederim."
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-4">
              {employeeSignature ? (
                <div className="bg-white p-2.5 rounded-xl border border-slate-300 shadow-sm">
                  <img src={employeeSignature} alt="Çalışan İmzası" className="h-14 max-w-[220px] object-contain" />
                </div>
              ) : (
                <div className="h-14 w-48 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 bg-white font-medium">
                  İmza Atılmadı
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-900">{formData.adSoyad || 'Çalışan Adı Soyadı'}</p>
                <p className="text-xs text-slate-500">
                  {employeeSignature ? 'İmza Ek-2 belgesine tam ölçekli aktarılacak' : 'Lütfen butona basarak tabletten imza alınız'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSignaturePad(true)}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
            >
              <PenTool className="w-4 h-4" />
              {employeeSignature ? 'İmzayı Yenile / Değiştir' : '✍️ İmzayı Başlat (Tam Ekran Tuval)'}
            </button>
          </div>
        </div>

        {/* 3. TIBBİ ANAMNEZ (YAKINMALAR VE HASTALIKLAR) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Tıbbi Anamnez (1. Yakınmalar ve 2. Teşhis Edilen Hastalıklar)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sol Sütun: Yakınmalar */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200">
                1. Yakınmalardan Herhangi Birini Yaşadınız mı?
              </h3>
              {[
                { key: 'an_balgamli_oksuruk', label: 'Balgamlı öksürük' },
                { key: 'an_nefes_darligi', label: 'Nefes darlığı' },
                { key: 'an_gogus_agrisi', label: 'Göğüs ağrısı' },
                { key: 'an_carpinti', label: 'Çarpıntı' },
                { key: 'an_sirt_agrisi', label: 'Sırt ağrısı' },
                { key: 'an_ishal_kabizlik', label: 'İshal veya kabızlık' },
                { key: 'an_eklem_agrisi', label: 'Eklemlerde ağrı' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2 px-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-800">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, [item.key]: 'Hayır' })}
                      className={`px-3.5 py-1 text-xs font-bold rounded-lg transition ${
                        formData[item.key] === 'Hayır'
                          ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      Hayır
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, [item.key]: 'Evet' })}
                      className={`px-3.5 py-1 text-xs font-bold rounded-lg transition ${
                        formData[item.key] === 'Evet'
                          ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-700'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      Evet
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sağ Sütun: Hastalıklar */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200">
                2. Hastalıklardan Herhangi Biri Teşhis Edildi mi?
              </h3>
              {[
                { key: 'an_kalp', label: 'Kalp hastalığı' },
                { key: 'an_seker', label: 'Şeker hastalığı' },
                { key: 'an_bobrek', label: 'Böbrek rahatsızlığı' },
                { key: 'an_sarilik', label: 'Sarılık' },
                { key: 'an_ulser', label: 'Mide / Oniki Parmak Ülseri' },
                { key: 'an_isitme', label: 'İşitme kaybı' },
                { key: 'an_gorme', label: 'Görme Bozukluğu' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2 px-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-800">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, [item.key]: 'Hayır' })}
                      className={`px-3.5 py-1 text-xs font-bold rounded-lg transition ${
                        formData[item.key] === 'Hayır'
                          ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      Hayır
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, [item.key]: 'Evet' })}
                      className={`px-3.5 py-1 text-xs font-bold rounded-lg transition ${
                        formData[item.key] === 'Evet'
                          ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-700'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      Evet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. FİZİK MUAYENE VE VİTAL BULGULAR (CANLI VKİ HESABI) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Heart className="w-5 h-5 text-teal-600" />
            Fizik Muayene & Vital Bulgular (Otomatik VKİ)
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-teal-50/70 rounded-2xl border border-teal-200 mb-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Tansiyon (TA)
              </label>
              <input
                type="text"
                value={formData.vital_ta}
                onChange={e => setFormData({ ...formData, vital_ta: e.target.value })}
                placeholder="120/80"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Nabız (/dk)
              </label>
              <input
                type="number"
                value={formData.vital_nb}
                onChange={e => setFormData({ ...formData, vital_nb: e.target.value })}
                placeholder="76"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Boy (cm)
              </label>
              <input
                type="number"
                value={formData.vital_boy}
                onChange={e => setFormData({ ...formData, vital_boy: e.target.value })}
                placeholder="175"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Kilo (kg)
              </label>
              <input
                type="number"
                value={formData.vital_kilo}
                onChange={e => setFormData({ ...formData, vital_kilo: e.target.value })}
                placeholder="75"
                className={inputCls}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-teal-900 mb-1">
                Vücut Kitle İndeksi (VKİ)
              </label>
              <input
                type="text"
                readOnly
                value={formData.vital_vki}
                className="w-full text-xs font-extrabold bg-teal-100 text-teal-950 border border-teal-300 rounded-xl px-3 py-2.5 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className={labelCls}>Kardiyovasküler & Solunum Sistemi</label>
              <input
                type="text"
                value={formData.fm_solunum}
                onChange={e => setFormData({ ...formData, fm_solunum: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Kas-İskelet Sistemi ve Diğer Muayeneler</label>
              <input
                type="text"
                value={formData.fm_kas_iskelet}
                onChange={e => setFormData({ ...formData, fm_kas_iskelet: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* 5. KANAAT VE SONUÇ (HEKİM KARARI) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Hekim Kanaat ve Sonuç Kararı
          </h2>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>1- Çalışmaya Elverişlilik Durumu</label>
              <select
                value={formData.dec_elverisli}
                onChange={e => setFormData({ ...formData, dec_elverisli: e.target.value })}
                className={inputCls}
              >
                <option value="İşinde bedenen ve ruhen çalışmaya elverişlidir.">
                  İşinde bedenen ve ruhen çalışmaya elverişlidir.
                </option>
                <option value="İşinde çalışmaya elverişli DEĞİLDİR.">
                  İşinde çalışmaya elverişli DEĞİLDİR.
                </option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>2- Yüksekte / Gece / Vardiyalı Çalışma</label>
                <input
                  type="text"
                  value={formData.dec_kosullar}
                  onChange={e => setFormData({ ...formData, dec_kosullar: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>İşyeri Hekimi Kaşe / İsim</label>
                <input
                  type="text"
                  value={formData.hekimAdi}
                  onChange={e => setFormData({ ...formData, hekimAdi: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Sticky Action Bar: BİLGİLERİ KAYDET */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-300 px-6 py-4 shadow-2xl z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="text-xs text-slate-700">
            Çalışan: <strong className="text-slate-900 font-bold">{formData.adSoyad || 'Girilmedi'}</strong> &bull; TCKN: <span className="font-mono">{formData.tckn || '-'}</span>
          </div>

          <button
            type="button"
            onClick={handleSaveFormClick}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-lg shadow-xl shadow-teal-600/25 active:scale-95 transition cursor-pointer"
          >
            <PenTool className="w-5 h-5" />
            BİLGİLERİ KAYDET
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SCREEN 4: FULLSCREEN TABLET SIGNATURE PAD */}
      {showSignaturePad && (
        <FullScreenTabletSignature
          employeeName={formData.adSoyad || 'Çalışan'}
          onSave={handleSignatureConfirmed}
          onClose={() => setShowSignaturePad(false)}
        />
      )}

      {/* SCREEN 5: "TETKİKİ VAR MI?" POP-UP MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 mx-auto flex items-center justify-center mb-4">
              <Stethoscope className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Tetkiki Var mı?
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              <strong className="text-slate-900">{formData.adSoyad}</strong> için laboratuvar veya sağlık tetkiki talep edilecek mi?
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                disabled={savingForm}
                onClick={() => finalizeSaveForm(false)}
                className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-lg shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                HAYIR
              </button>

              <button
                type="button"
                disabled={savingForm}
                onClick={() => finalizeSaveForm(true)}
                className="py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold text-lg shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                EVET
              </button>
            </div>

            <p className="text-xs text-slate-500">
              * "HAYIR" seçildiğinde Ek-2 belgesi doğrudan kaydedilerek firma listesine geri dönülür.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
