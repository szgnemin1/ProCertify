import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Building2, 
  Calendar, 
  Award, 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  AlertCircle, 
  UserX, 
  UserCheck, 
  ExternalLink, 
  Pencil, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Employee, EmployeeDocument, IssuedCertificate } from '../types';
import { getCertificateStatus, getDaysRemaining, getStatusBadge, formatDateTR } from '../services/validityService';

interface EmployeeModalProps {
  employeeIdOrTc: string;
  initialEmployee?: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onEditCertificate?: (cert: IssuedCertificate) => void;
  onRenewCertificate?: (cert: IssuedCertificate) => void;
  onStatusChanged?: (updatedEmployee: Employee) => void;
  getApiUrl: (path: string) => string;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  employeeIdOrTc,
  initialEmployee,
  isOpen,
  onClose,
  onEditCertificate,
  onRenewCertificate,
  onStatusChanged,
  getApiUrl
}) => {
  const [employee, setEmployee] = useState<Employee | null>(initialEmployee || null);
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'certificates' | 'documents'>('certificates');

  // Status Change State
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [terminationNote, setTerminationNote] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Document Upload State
  const [docName, setDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchEmployeeData = async () => {
    if (!employeeIdOrTc) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('vps_session_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiUrl(`/api/employees/${encodeURIComponent(employeeIdOrTc)}`), { headers });
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
        setCertificates(data.certificates || []);
      }
    } catch (err) {
      console.error("Employee data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && employeeIdOrTc) {
      fetchEmployeeData();
      setShowStatusConfirm(false);
      setTerminationNote('');
      setUploadError('');
      setSelectedFile(null);
      setDocName('');
    }
  }, [isOpen, employeeIdOrTc]);

  if (!isOpen) return null;

  const handleToggleStatus = async (newStatus: 'active' | 'passive') => {
    if (!employee) return;
    setStatusLoading(true);
    try {
      const token = localStorage.getItem('vps_session_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiUrl(`/api/employees/${encodeURIComponent(employee.id)}/status`), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          status: newStatus,
          note: terminationNote.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEmployee(data.employee);
        setShowStatusConfirm(false);
        if (onStatusChanged) onStatusChanged(data.employee);
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !selectedFile) return;

    if (!docName.trim()) {
      setUploadError("Lütfen evrak için bir isim girin (Örn: Sağlık Raporu).");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setUploadError("Dosya boyutu 25 MB'den büyük olamaz.");
      return;
    }

    setUploadLoading(true);
    setUploadError('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileData = reader.result as string;
          const token = localStorage.getItem('vps_session_token');
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch(getApiUrl(`/api/employees/${encodeURIComponent(employee.id)}/documents`), {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: docName.trim(),
              fileName: selectedFile.name,
              fileData,
              mimeType: selectedFile.type
            })
          });

          if (res.ok) {
            const data = await res.json();
            setEmployee(prev => prev ? {
              ...prev,
              documents: [...(prev.documents || []), data.document]
            } : null);
            setDocName('');
            setSelectedFile(null);
          } else {
            const errData = await res.json();
            setUploadError(errData.error || "Dosya yüklenemedi.");
          }
        } catch (innerErr: any) {
          setUploadError(innerErr.message || "Yükleme hatası.");
        } finally {
          setUploadLoading(false);
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      setUploadError(err.message || "Dosya okunamadı.");
      setUploadLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!employee) return;
    if (!window.confirm("Bu evrakı silmek istediğinize emin misiniz?")) return;

    try {
      const token = localStorage.getItem('vps_session_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiUrl(`/api/employees/${encodeURIComponent(employee.id)}/documents/${docId}`), {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setEmployee(prev => prev ? {
          ...prev,
          documents: (prev.documents || []).filter(d => d.id !== docId)
        } : null);
      }
    } catch (err) {
      console.error("Document delete error:", err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const initials = employee?.name
    ? employee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'ÇL';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Üst Kart / Profil Başlığı */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0 shadow-inner">
              {initials}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  {employee?.name || 'Çalışan Yükleniyor...'}
                </h2>

                {/* Aktif / Pasif Rozeti */}
                {employee?.status === 'passive' ? (
                  <span className="inline-flex items-center gap-1 bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <UserX size={11} />
                    <span>İşten Ayrıldı (Pasif)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} />
                    <span>Aktif Çalışan</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                {employee?.tc && (
                  <span className="font-mono text-slate-300">
                    TC: <strong className="text-white">{employee.tc}</strong>
                  </span>
                )}
                {employee?.companyName && (
                  <span className="flex items-center gap-1 text-amber-300">
                    <Building2 size={12} />
                    <span>{employee.companyName}</span>
                  </span>
                )}
              </div>

              {employee?.status === 'passive' && employee.terminationNote && (
                <div className="mt-1 text-[11px] text-slate-400 italic">
                  Not: "{employee.terminationNote}"
                  {employee.terminatedAt && ` (${formatDateTR(new Date(employee.terminatedAt))})`}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* İşten Çıkarma / Pasife Alma Butonu */}
            {employee && (
              employee.status === 'passive' ? (
                <button
                  onClick={() => handleToggleStatus('active')}
                  disabled={statusLoading}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition"
                  title="Personeli Tekrar Aktif Yap"
                >
                  <UserCheck size={13} />
                  <span>Tekrar İşe Al</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowStatusConfirm(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-2.5 py-1 rounded-lg transition"
                  title="Personeli İşten Çıkarıldı / Pasif Olarak İşaretle"
                >
                  <UserX size={13} />
                  <span>İşten Çıkarıldı</span>
                </button>
              )
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* İşten Çıkarma Onay Diyaloğu */}
        {showStatusConfirm && (
          <div className="p-3 bg-red-950/40 border-b border-red-500/30 flex flex-col gap-2 shrink-0">
            <div className="flex items-start gap-2 text-xs text-red-300">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong>{employee?.name}</strong> isimli personeli pasife almak üzeresiniz.
                <div className="text-[11px] text-red-300/80 mt-0.5">
                  Evraklar ve sertifikalar <u>asla silinmez</u>, arşivde "İşten Ayrılanlar" listesinde saklanır.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <input
                type="text"
                placeholder="Ayrılma Sebebi / Not (İsteğe bağlı)..."
                value={terminationNote}
                onChange={(e) => setTerminationNote(e.target.value)}
                className="flex-1 min-w-[200px] bg-slate-900 border border-red-500/30 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={() => handleToggleStatus('passive')}
                disabled={statusLoading}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 rounded-lg text-xs transition"
              >
                {statusLoading ? 'İşleniyor...' : 'Evet, Pasife Al'}
              </button>
              <button
                onClick={() => setShowStatusConfirm(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg text-xs transition"
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}

        {/* Sekme Butonları */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-800 shrink-0 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition ${
              activeTab === 'certificates'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Award size={14} />
            <span>Alınan Eğitimler & Sertifikalar ({certificates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition ${
              activeTab === 'documents'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={14} />
            <span>Özlük & İSG Evrakları ({(employee?.documents || []).length})</span>
          </button>
        </div>

        {/* İçerik Alanı */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-amber-400" />
              <span>Çalışan bilgileri getiriliyor...</span>
            </div>
          ) : activeTab === 'certificates' ? (
            /* TAB 1: EĞİTİMLER VE SERTİFİKALAR */
            certificates.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                Bu çalışan için düzenlenmiş aktif sertifika kaydı bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2">
                {certificates.map((cert, certIdx) => {
                  const status = getCertificateStatus(cert.expiryDate);
                  const daysLeft = getDaysRemaining(cert.expiryDate);
                  const badge = getStatusBadge(status, daysLeft);
                  
                  const isNewestForAnyProject = certificates.findIndex(c => 
                    c.projects && cert.projects && c.projects.some(p => cert.projects.includes(p))
                  ) === certIdx;

                  return (
                    <div
                      key={cert.serialNo}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            {cert.serialNo}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge.className}`}>
                            {badge.label}
                          </span>
                          {certIdx === 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              ⭐ En Son Kayıt
                            </span>
                          )}
                          {!isNewestForAnyProject && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              🔄 Önceki Kayıt (Yenilendi)
                            </span>
                          )}
                        </div>

                        {cert.projects && Array.isArray(cert.projects) && cert.projects.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cert.projects.map((p, idx) => (
                              <span key={idx} className="text-[10px] bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                          <span>Eğitim: <strong className="text-slate-300">{cert.trainingDate || '-'}</strong></span>
                          <span>Bitiş: <strong className="text-slate-200 font-semibold">{cert.expiryDate ? formatDateTR(new Date(cert.expiryDate)) : '-'}</strong></span>
                        </div>
                      </div>

                      {/* İşlem Butonları */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {onRenewCertificate && (
                          <button
                            onClick={() => {
                              onRenewCertificate(cert);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/30 px-2.5 py-1.5 rounded-lg transition"
                            title="Bu çalışan için yeni bir sertifika düzenle"
                          >
                            <Plus size={12} />
                            <span>Yenile (Yeni Sertifika)</span>
                          </button>
                        )}

                        {onEditCertificate && (
                          <button
                            onClick={() => {
                              onEditCertificate(cert);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-2.5 py-1.5 rounded-lg transition"
                            title="Sertifikayı Düzenle / Hata Düzelt"
                          >
                            <Pencil size={12} />
                            <span>Düzenle</span>
                          </button>
                        )}

                        <a
                          href={`/dogrula?id=${cert.serialNo}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition"
                        >
                          <ExternalLink size={12} />
                          <span>Doğrula</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* TAB 2: ÖZLÜK & İSG EVRAKLARI */
            <div className="space-y-4">
              {/* Evrak Yükleme Formu */}
              <form onSubmit={handleFileUpload} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload size={14} className="text-amber-400" />
                  <span>Yeni Evrak Yükle</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Evrak Adı (Örn: Sağlık Raporu 2026, İşe Giriş Bildirgesi)..."
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          if (!docName) setDocName(file.name.replace(/\.[^/.]+$/, ''));
                        }
                      }}
                      className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 cursor-pointer"
                    />

                    <button
                      type="submit"
                      disabled={uploadLoading || !selectedFile}
                      className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50 shrink-0"
                    >
                      {uploadLoading ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Yükleniyor...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          <span>Yükle</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {uploadError && (
                  <div className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{uploadError}</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-500">
                  Desteklenen formatlar: PDF, Resim (PNG, JPG), Word (DOCX). Maksimum dosya boyutu 25 MB.
                </div>
              </form>

              {/* Yüklü Evraklar Listesi */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300">
                  Kayıtlı Evraklar ({(employee?.documents || []).length})
                </div>

                {(employee?.documents || []).length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    Bu çalışana ait henüz yüklenmiş bir evrak bulunmuyor.
                  </div>
                ) : (
                  employee?.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate max-w-sm">
                            {doc.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDateTR(new Date(doc.uploadedAt))}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={getApiUrl(doc.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          download={doc.fileName}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="İndir / Görüntüle"
                        >
                          <Download size={14} />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                          title="Evrakı Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
