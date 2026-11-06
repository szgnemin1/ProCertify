import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle, 
  Layers, 
  MapPin, 
  SlidersHorizontal,
  ChevronRight,
  Eye,
  LayoutGrid,
  Columns,
  FileText,
  UserCheck,
  Activity,
  Heart,
  ShieldCheck,
  Sparkles,
  MousePointerClick
} from 'lucide-react';
import { Ek2FieldMappingConfig, Ek2FieldMappingItem } from '../types';

export const AdminEk2TemplateEditor: React.FC = () => {
  const [config, setConfig] = useState<Ek2FieldMappingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<Ek2FieldMappingItem | null>(null);

  // View modes: 'split' (Document + List), 'doc' (Full Visual Document), 'table' (Table only)
  const [viewMode, setViewMode] = useState<'split' | 'doc' | 'table'>('split');
  const [activeDocPage, setActiveDocPage] = useState<1 | 2>(1);
  const [selectedHighlightKey, setSelectedHighlightKey] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Tüm Alanlar' },
    { id: 'personal', label: 'Kişisel & İşyeri Bilgileri' },
    { id: 'past_work', label: 'Geçmiş İş Deneyimleri' },
    { id: 'anamnez_complaints', label: 'Anamnez - 1. Yakınmalar' },
    { id: 'anamnez_diseases', label: 'Anamnez - 2. Hastalıklar' },
    { id: 'anamnez_questions', label: 'Anamnez - 3-10. Sorular' },
    { id: 'physical_exam', label: 'Fizik Muayene & Vital' },
    { id: 'lab_results', label: 'Laboratuvar Bulguları' },
    { id: 'decision', label: 'Kanaat ve Hekim Kararı' }
  ];

  const fetchMapping = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/health/ek2-mapping');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error("Error loading Ek-2 mapping:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapping();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/health/ek2-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Eşleme kaydedilemedi.");
      }
    } catch (e) {
      console.error(e);
      alert("Bağlantı hatası!");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = (updated: Ek2FieldMappingItem) => {
    if (!config) return;
    const items = config.items.map(it => it.id === updated.id ? updated : it);
    setConfig({ ...config, items });
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (!config) return;
    if (!window.confirm("Bu alanı şablondan kaldırmak istediğinizden emin misiniz?")) return;
    const items = config.items.filter(it => it.id !== id);
    setConfig({ ...config, items });
  };

  const handleAddNewItem = (presetCategory?: string, presetLocation?: string) => {
    if (!config) return;
    const newItem: Ek2FieldMappingItem = {
      id: `f_${Date.now()}`,
      category: (presetCategory as any) || (activeCategory === 'all' ? 'personal' : (activeCategory as any)),
      label: 'Yeni Form Sorusu',
      fieldKey: `alan_${Date.now().toString().slice(-5)}`,
      type: 'text',
      targetCellOrLocation: presetLocation || (activeDocPage === 1 ? 'Sayfa 1 - Özel Alan' : 'Sayfa 2 - Özel Alan')
    };
    setConfig({ ...config, items: [...config.items, newItem] });
    setEditingItem(newItem);
  };

  const filteredItems = (config?.items || []).filter(item => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = !searchTerm || 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fieldKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.targetCellOrLocation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getItemByKey = (key: string) => config?.items.find(i => i.fieldKey === key);

  // Helper renderer for an interactive cell on the visual document
  const DocCell: React.FC<{
    title: string;
    fieldKey?: string;
    subText?: string;
    className?: string;
    locationDesc: string;
    category: string;
  }> = ({ title, fieldKey, subText, className = '', locationDesc, category }) => {
    const item = fieldKey ? getItemByKey(fieldKey) : null;
    const isSelected = selectedHighlightKey && (selectedHighlightKey === fieldKey);

    return (
      <div
        onClick={() => {
          if (item) {
            setSelectedHighlightKey(item.fieldKey);
            setEditingItem(item);
          } else {
            handleAddNewItem(category, locationDesc);
          }
        }}
        className={`p-2 border rounded-lg transition-all cursor-pointer relative group text-xs ${
          isSelected
            ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400 shadow-md'
            : item
            ? 'bg-teal-50/70 border-teal-200 hover:bg-teal-100 hover:border-teal-400'
            : 'bg-slate-50/60 border-dashed border-slate-300 hover:bg-amber-50 hover:border-amber-400'
        } ${className}`}
        title={`Hedef Konum: ${locationDesc} (Düzenlemek için tıklayın)`}
      >
        <div className="flex items-start justify-between gap-1">
          <span className="font-bold text-slate-800 leading-tight">
            {item?.label || title}
          </span>
          {item ? (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-600 text-white font-semibold">
              {item.fieldKey}
            </span>
          ) : (
            <span className="text-[9px] text-slate-400 font-semibold group-hover:text-amber-700">
              + Eşle
            </span>
          )}
        </div>
        {subText && (
          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{subText}</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden h-full">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-sm">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              EK-2 Evrak & Alan Eşleme Editörü
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
                {config?.items.length || 0} Alan Eşlendi
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Resmi Ek-2 belgesini canlı görerek soruların nereye yazıldığını inceleyebilir ve tıklayarak düzenleyebilirsiniz.
            </p>
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'split' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Yan Yana (Bölünmüş)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('doc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'doc' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Canlı Belge Haritası
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Tablo Listesi
            </button>
          </div>

          <button
            type="button"
            onClick={fetchMapping}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            type="button"
            onClick={() => handleAddNewItem()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition text-xs shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Yeni Alan Eşle
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition text-xs shadow-md"
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Kaydedildi!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Working Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT / CENTER: INTERACTIVE OFFICIAL EK-2 VISUAL DOCUMENT MAP             */}
        {/* ========================================================================= */}
        {(viewMode === 'split' || viewMode === 'doc') && (
          <div className={`${viewMode === 'doc' ? 'w-full' : 'w-1/2'} flex flex-col bg-slate-200 border-r border-slate-300 overflow-hidden`}>
            {/* Page Tab Selector */}
            <div className="bg-slate-800 text-white px-6 py-2.5 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-teal-400" />
                  Resmi Belge Sayfası:
                </span>
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setActiveDocPage(1)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                      activeDocPage === 1 ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1. Sayfa (Kimlik & Anamnez)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDocPage(2)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                      activeDocPage === 2 ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2. Sayfa (Fizik Muayene & Karar)
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 flex items-center gap-1">
                <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
                Hücreye tıklayarak düzenleyebilir veya yeni soru bağlayabilirsiniz
              </div>
            </div>

            {/* Document Canvas Container */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              {/* Paper simulation */}
              <div className="w-full max-w-3xl bg-white shadow-2xl rounded-sm p-8 text-slate-900 border border-slate-300 space-y-4">
                {activeDocPage === 1 ? (
                  /* ========================================= */
                  /* PAGE 1 CONTENT                            */
                  /* ========================================= */
                  <>
                    {/* Header: Title + Protocol + Photo */}
                    <div className="grid grid-cols-12 gap-2 border-b-2 border-slate-800 pb-3">
                      <div className="col-span-8 flex flex-col justify-center">
                        <h2 className="text-lg font-extrabold tracking-wider text-slate-900">
                          İŞE GİRİŞ / PERİYODİK MUAYENE FORMU
                        </h2>
                        <p className="text-[10px] text-slate-500 font-medium">6331 Sayılı İSG Kanunu ve Ek-2 Yönetmelik Formatı</p>
                      </div>
                      <div className="col-span-4 flex flex-col items-end justify-between">
                        <DocCell
                          title="Protokol No"
                          fieldKey="protokolNo"
                          locationDesc="Sayfa 1 - Başlık Sağ"
                          category="personal"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Company Details & Photo Box */}
                    <div className="grid grid-cols-12 gap-3 border border-slate-300 p-2.5 rounded-lg bg-slate-50/50">
                      <div className="col-span-9 space-y-1.5">
                        <DocCell
                          title="İşyeri Ünvanı"
                          fieldKey="isyeriUnvani"
                          locationDesc="Sayfa 1 - İşyeri Ünvanı Alanı"
                          category="personal"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <DocCell
                            title="SGK Sicil No"
                            fieldKey="sgkSicilNo"
                            locationDesc="Sayfa 1 - SGK Sicil No Alanı"
                            category="personal"
                          />
                          <DocCell
                            title="Tel / Faks / E-Posta"
                            fieldKey="isyeriIletisim"
                            locationDesc="Sayfa 1 - İletişim Alanı"
                            category="personal"
                          />
                        </div>
                        <DocCell
                          title="İşyeri Adresi"
                          fieldKey="isyeriAdresi"
                          locationDesc="Sayfa 1 - Adres Alanı"
                          category="personal"
                        />
                      </div>

                      {/* Photo Box */}
                      <div className="col-span-3 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-2 bg-white text-center">
                        <div className="w-12 h-14 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-bold">
                          FOTOĞRAF
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1">Vesikalık Alanı</span>
                      </div>
                    </div>

                    {/* Employee Declaration & Signature Box */}
                    <div className="border border-slate-300 p-3 rounded-lg bg-slate-50">
                      <p className="text-[10px] text-slate-600 italic leading-relaxed">
                        "İşe giriş/periyodik muayene olmayı kabul ettiğimi ve muayene sırasında verdiğim bilgilerin doğru ve eksiksiz olduğunu beyan ederim."
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-700">Çalışanın adı soyadı:</span>
                        <div className="border-b border-dashed border-slate-400 px-6 py-0.5 text-xs font-bold text-teal-800">
                          İMZA ALANI
                        </div>
                      </div>
                    </div>

                    {/* Employee Personal Details Grid */}
                    <div className="border border-slate-300 rounded-lg p-3 bg-white space-y-2">
                      <div className="font-bold text-xs text-slate-900 border-b pb-1">ÇALIŞANIN:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <DocCell title="Adı ve Soyadı" fieldKey="adSoyad" locationDesc="Sayfa 1 - Çalışan Adı Soyadı" category="personal" />
                        <DocCell title="T.C. Kimlik No" fieldKey="tckn" locationDesc="Sayfa 1 - T.C. Kimlik No" category="personal" />
                        <DocCell title="Ev Adresi" fieldKey="evAdresi" locationDesc="Sayfa 1 - Ev Adresi" category="personal" />
                        <DocCell title="Doğum Yeri ve Tarihi" fieldKey="dogumYeriTarihi" locationDesc="Sayfa 1 - Doğum Yeri/Tarihi" category="personal" />
                        <DocCell title="Medeni Durumu" fieldKey="medeniDurumu" locationDesc="Sayfa 1 - Medeni Durumu" category="personal" />
                        <DocCell title="Çocuk Sayısı" fieldKey="cocukSayisi" locationDesc="Sayfa 1 - Çocuk Sayısı" category="personal" />
                        <DocCell title="Telefon No" fieldKey="telefonNo" locationDesc="Sayfa 1 - Telefon No" category="personal" />
                        <DocCell title="Eğitim Durumu" fieldKey="egitimDurumu" locationDesc="Sayfa 1 - Eğitim Durumu" category="personal" />
                        <DocCell title="Cinsiyeti" fieldKey="cinsiyet" locationDesc="Sayfa 1 - Cinsiyeti" category="personal" />
                        <DocCell title="Mesleği" fieldKey="meslegi" locationDesc="Sayfa 1 - Mesleği" category="personal" />
                        <DocCell title="Çalıştığı Bölüm" fieldKey="calistigiBolum" locationDesc="Sayfa 1 - Çalıştığı Bölüm" category="personal" />
                        <DocCell title="Yaptığı İş (Ayrıntılı)" fieldKey="yaptigiIs" locationDesc="Sayfa 1 - Yaptığı İş" category="personal" />
                      </div>
                    </div>

                    {/* Past Work History Table */}
                    <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50">
                      <div className="font-bold text-xs text-slate-900 mb-1.5">Daha önce çalıştığı yerler (3 Satır):</div>
                      <DocCell
                        title="Geçmiş İş Deneyimleri Tablosu"
                        fieldKey="gecmisIsler"
                        locationDesc="Sayfa 1 - Geçmiş İş Deneyimleri (3 Satır)"
                        category="past_work"
                        subText="İşkolu / Yaptığı iş / Giriş-çıkış tarihi / Not"
                      />
                    </div>

                    {/* Anamnez 1 & 2 Table */}
                    <div className="border border-slate-300 rounded-lg p-2.5 bg-white space-y-2">
                      <div className="font-bold text-xs text-slate-900 border-b pb-1">TIBBİ ANAMNEZ:</div>
                      <div className="grid grid-cols-2 gap-3">
                        {/* 1. Yakınmalar */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-700">1. Yakınmalar:</span>
                          <DocCell title="Balgamlı öksürük" fieldKey="an_balgamli_oksuruk" locationDesc="Sayfa 1 - Anamnez 1" category="anamnez_complaints" />
                          <DocCell title="Nefes darlığı" fieldKey="an_nefes_darligi" locationDesc="Sayfa 1 - Anamnez 1" category="anamnez_complaints" />
                          <DocCell title="Göğüs ağrısı" fieldKey="an_gogus_agrisi" locationDesc="Sayfa 1 - Anamnez 1" category="anamnez_complaints" />
                          <DocCell title="Çarpıntı" fieldKey="an_carpinti" locationDesc="Sayfa 1 - Anamnez 1" category="anamnez_complaints" />
                          <DocCell title="Sırt ağrısı" fieldKey="an_sirt_agrisi" locationDesc="Sayfa 1 - Anamnez 1" category="anamnez_complaints" />
                          <DocCell title="İshal veya kabızlık" fieldKey="an_ishal_kabizlik" locationDesc="Sayfa 1 - Anamnez 1" category="anamnez_complaints" />
                          <DocCell title="Eklemlerde ağrı" fieldKey="an_eklem_agrisi" locationDesc="Sayfa 1 - Anamnez 1" category="anamnez_complaints" />
                          <DocCell title="Diğer belirtiniz" fieldKey="an_diger_belirti" locationDesc="Sayfa 1 - Anamnez 1 Dip" category="anamnez_complaints" />
                        </div>

                        {/* 2. Hastalıklar */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-700">2. Teşhis Edilen Hastalıklar:</span>
                          <DocCell title="Kalp hastalığı" fieldKey="an_kalp" locationDesc="Sayfa 1 - Anamnez 2" category="anamnez_diseases" />
                          <DocCell title="Şeker hastalığı" fieldKey="an_seker" locationDesc="Sayfa 1 - Anamnez 2" category="anamnez_diseases" />
                          <DocCell title="Böbrek rahatsızlığı" fieldKey="an_bobrek" locationDesc="Sayfa 1 - Anamnez 2" category="anamnez_diseases" />
                          <DocCell title="Sarılık" fieldKey="an_sarilik" locationDesc="Sayfa 1 - Anamnez 2" category="anamnez_diseases" />
                          <DocCell title="Mide veya 12 parmak ülseri" fieldKey="an_ulser" locationDesc="Sayfa 1 - Anamnez 2" category="anamnez_diseases" />
                          <DocCell title="İşitme kaybı" fieldKey="an_isitme" locationDesc="Sayfa 1 - Anamnez 2" category="anamnez_diseases" />
                          <DocCell title="Görme Bozukluğu" fieldKey="an_gorme" locationDesc="Sayfa 1 - Anamnez 2" category="anamnez_diseases" />
                          <DocCell title="Sinir sistemi Hastalığı" fieldKey="an_sinir" locationDesc="Sayfa 1 - Anamnez 2" category="anamnez_diseases" />
                        </div>
                      </div>
                    </div>

                    {/* Anamnez 3-10 Questions */}
                    <div className="grid grid-cols-2 gap-1.5 border border-slate-300 rounded-lg p-2.5 bg-slate-50">
                      <DocCell title="3. Hastanede yattınız mı?" fieldKey="an_hastane" locationDesc="Sayfa 1 - Madde 3" category="anamnez_questions" />
                      <DocCell title="4. Ameliyat oldunuz mu?" fieldKey="an_ameliyat" locationDesc="Sayfa 1 - Madde 4" category="anamnez_questions" />
                      <DocCell title="5. İş kazası geçirdiniz mi?" fieldKey="an_is_kazasi" locationDesc="Sayfa 1 - Madde 5" category="anamnez_questions" />
                      <DocCell title="6. Meslek hastalığı şüphesi?" fieldKey="an_meslek_hastaligi" locationDesc="Sayfa 1 - Madde 6" category="anamnez_questions" />
                      <DocCell title="7. Maluliyet aldınız mı?" fieldKey="an_maluliyet" locationDesc="Sayfa 1 - Madde 7" category="anamnez_questions" />
                      <DocCell title="8. Tedavi görüyor musunuz?" fieldKey="an_mevcut_tedavi" locationDesc="Sayfa 1 - Madde 8" category="anamnez_questions" />
                      <DocCell title="9. Sigara içiyor musunuz?" fieldKey="an_sigara" locationDesc="Sayfa 1 - Madde 9" category="anamnez_questions" />
                      <DocCell title="10. Alkol alıyor musunuz?" fieldKey="an_alkol" locationDesc="Sayfa 1 - Madde 10" category="anamnez_questions" />
                    </div>

                    {/* Official Footer: Çankaya OSGB Nilüfer / Bursa */}
                    <div className="text-center text-[10px] text-slate-500 pt-3 border-t border-slate-200">
                      <p className="font-semibold text-slate-700">Üçevler Mahallesi Özkan Sokak No:1 Daire No:5 NİLÜFER / BURSA</p>
                      <p>Telefon: 0532 402 94 61 - 0537 357 57 80 &bull; https://www.cankayaosgb.com/ &bull; info@cankayaosgb.com</p>
                    </div>
                  </>
                ) : (
                  /* ========================================= */
                  /* PAGE 2 CONTENT                            */
                  /* ========================================= */
                  <>
                    <div className="border-b-2 border-slate-800 pb-2 flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-slate-900 tracking-wide">
                        ÖZGEÇMİŞİ VE SOY GEÇMİŞİ (SAYFA 2)
                      </h3>
                      <span className="text-[11px] text-slate-500">EK-2 Sağlık Gözetimi</span>
                    </div>

                    {/* Özgeçmiş & Aşılar */}
                    <div className="border border-slate-300 rounded-lg p-3 bg-white space-y-2">
                      <span className="text-xs font-bold text-slate-900">Özgeçmişi:</span>
                      <div className="grid grid-cols-2 gap-2">
                        <DocCell title="Kan Grubu" fieldKey="kanGrubu" locationDesc="Sayfa 2 - Kan Grubu" category="personal" />
                        <DocCell title="Kronik Hastalık" fieldKey="kronikHastalik" locationDesc="Sayfa 2 - Kronik Hastalık" category="personal" />
                        <DocCell title="Tetanoz Aşısı" fieldKey="asiTetanoz" locationDesc="Sayfa 2 - Tetanoz Aşısı" category="personal" />
                        <DocCell title="Hepatit Aşısı" fieldKey="asiHepatit" locationDesc="Sayfa 2 - Hepatit Aşısı" category="personal" />
                      </div>
                    </div>

                    {/* Fizik Muayene & VİTAL BULGULAR */}
                    <div className="border border-slate-300 rounded-lg p-3 bg-white space-y-2">
                      <span className="text-xs font-bold text-slate-900">FİZİK MUAYENE SONUÇLARI:</span>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 p-2 bg-teal-50/70 border border-teal-200 rounded-lg">
                        <DocCell title="Tansiyon (TA)" fieldKey="vital_ta" locationDesc="Sayfa 2 - Vital TA" category="physical_exam" />
                        <DocCell title="Nabız (/dk)" fieldKey="vital_nb" locationDesc="Sayfa 2 - Vital Nb" category="physical_exam" />
                        <DocCell title="Boy (cm)" fieldKey="vital_boy" locationDesc="Sayfa 2 - Boy Alanı" category="physical_exam" />
                        <DocCell title="Kilo (kg)" fieldKey="vital_kilo" locationDesc="Sayfa 2 - Kilo Alanı" category="physical_exam" />
                        <DocCell title="VKİ İndeksi" fieldKey="vital_vki" locationDesc="Sayfa 2 - VKİ Hesabı" category="physical_exam" />
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <DocCell
                          title="Fizik Muayene Sistem Bulguları"
                          fieldKey="fm_sistemler"
                          locationDesc="Sayfa 2 - Sistem Muayeneleri (Göz, KBB, KVS, Solunum, vb.)"
                          category="physical_exam"
                          subText="Duyu, KVS, Solunum, Sindirim, Kas-İskelet, Nöroloji, Psikiyatri"
                        />
                      </div>
                    </div>

                    {/* Laboratuvar Bulguları */}
                    <div className="border border-slate-300 rounded-lg p-3 bg-white space-y-2">
                      <span className="text-xs font-bold text-slate-900">LABORATUVAR BULGULARI:</span>
                      <DocCell
                        title="Laboratuvar Bulguları ve Tetkikler"
                        fieldKey="lab_bulgulari"
                        locationDesc="Sayfa 2 - Laboratuvar Bulguları (Kan, İdrar, Radyoloji, Odyo, SFT)"
                        category="lab_results"
                        subText="a) Biyolojik, b) Radyolojik, c) Fizyolojik, d) Psikolojik, e) Diğer"
                      />
                    </div>

                    {/* Kanaat ve Sonuç (Hekim Kararı) */}
                    <div className="border-2 border-teal-600 rounded-lg p-3.5 bg-teal-50/30 space-y-2.5">
                      <span className="text-xs font-extrabold text-teal-900 tracking-wide">KANAAT VE SONUÇ:</span>
                      <div className="space-y-2">
                        <DocCell
                          title="1- İşinde bedenen ve ruhen çalışmaya elverişlidir / değildir"
                          fieldKey="dec_elverisli"
                          locationDesc="Sayfa 2 - Kanaat 1 (Çalışmaya Elverişlilik)"
                          category="decision"
                        />
                        <DocCell
                          title="2- Yüksekte / Gece / Vardiyalı çalışmaya elverişlidir / değildir"
                          fieldKey="dec_kosullar"
                          locationDesc="Sayfa 2 - Kanaat 2 (Çalışma Koşulları)"
                          category="decision"
                        />
                        <DocCell
                          title="3- Şartıyla çalışmaya elverişlidir"
                          fieldKey="dec_sart"
                          locationDesc="Sayfa 2 - Kanaat 3 (Özel Şartlar)"
                          category="decision"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-teal-200 text-xs">
                        <div>
                          <span className="font-semibold text-slate-700">Tarih: </span>
                          <span className="font-mono text-slate-900">.... / .... / 2026</span>
                        </div>
                        <div className="text-center font-bold text-slate-900 border border-slate-300 p-2 rounded-lg bg-white shadow-sm">
                          İŞYERİ HEKİMİ
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">Kaşe & İmza Alanı</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RIGHT: MAPPED FIELDS LIST & DETAILS EDITOR                                */}
        {/* ========================================================================= */}
        {(viewMode === 'split' || viewMode === 'table') && (
          <div className={`${viewMode === 'table' ? 'w-full' : 'w-1/2'} flex flex-col bg-slate-50 overflow-hidden`}>
            {/* Filter and Search Ribbon */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-xl no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      activeCategory === cat.id
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Soru veya hücre ara..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Field Table */}
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-3.5">Kategori</th>
                      <th className="py-3 px-3.5">Soru / Etiket</th>
                      <th className="py-3 px-3.5">Alan Anahtarı</th>
                      <th className="py-3 px-3.5">Resmi Belgedeki Konumu</th>
                      <th className="py-3 px-3.5 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredItems.map(item => {
                      const isHighlighted = selectedHighlightKey === item.fieldKey;
                      return (
                        <tr 
                          key={item.id} 
                          onClick={() => {
                            setSelectedHighlightKey(item.fieldKey);
                            if (item.targetCellOrLocation.includes('Sayfa 2')) {
                              setActiveDocPage(2);
                            } else {
                              setActiveDocPage(1);
                            }
                          }}
                          className={`transition cursor-pointer ${
                            isHighlighted ? 'bg-amber-50 ring-1 ring-inset ring-amber-400' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-2.5 px-3.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {categories.find(c => c.id === item.category)?.label.split('-')[0] || item.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-900">
                            {item.label}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-slate-500">
                            {item.fieldKey}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              {item.targetCellOrLocation}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                              >
                                Düzenle
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          Aramanıza uygun alan bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-teal-600" />
              Soru ve Hedef Hücre Eşlemesini Düzenle
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={editingItem.category}
                  onChange={e => setEditingItem({ ...editingItem, category: e.target.value as any })}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {categories.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Formda Gözüken Soru Başlığı
                </label>
                <input
                  type="text"
                  value={editingItem.label}
                  onChange={e => setEditingItem({ ...editingItem, label: e.target.value })}
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alan Anahtarı (fieldKey)
                  </label>
                  <input
                    type="text"
                    value={editingItem.fieldKey}
                    onChange={e => setEditingItem({ ...editingItem, fieldKey: e.target.value })}
                    className="w-full text-xs font-mono border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Veri Tipi
                  </label>
                  <select
                    value={editingItem.type}
                    onChange={e => setEditingItem({ ...editingItem, type: e.target.value as any })}
                    className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="text">Kısa Metin</option>
                    <option value="textarea">Uzun Açıklama / Çok Satırlı</option>
                    <option value="choice">Seçenekli (Dropdown)</option>
                    <option value="yes_no_date">Evet / Hayır / Tarih</option>
                    <option value="number">Sayısal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resmi Ek-2 Belgesindeki Hedef Hücre / Konum Açıklaması
                </label>
                <input
                  type="text"
                  value={editingItem.targetCellOrLocation}
                  onChange={e => setEditingItem({ ...editingItem, targetCellOrLocation: e.target.value })}
                  placeholder="örn: Sayfa 1 - Satır 18 / Tıbbi Anamnez Tablosu"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl px-3 py-2 bg-white text-emerald-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleUpdateItem(editingItem)}
                className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow transition"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
