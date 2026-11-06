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
  ChevronRight
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

  const handleAddNewItem = () => {
    if (!config) return;
    const newItem: Ek2FieldMappingItem = {
      id: `f_${Date.now()}`,
      category: activeCategory === 'all' ? 'personal' : (activeCategory as any),
      label: 'Yeni Form Sorusu',
      fieldKey: `custom_${Date.now()}`,
      type: 'text',
      targetCellOrLocation: 'Sayfa 1 - Özel Alan'
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

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden h-full">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-sm">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              EK-2 Evrak & Alan Eşleme Editörü
              <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                v{config?.version || 1} &bull; {config?.items.length || 0} Alan Tanımlı
              </span>
            </h1>
            <p className="text-sm text-slate-500">
              Saha tablet formunda sorulan soruların ve cevapların resmi Ek-2 belgesinde hangi hücreye/konuma gideceğini buradan yönetebilirsiniz.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchMapping}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition active:scale-95 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            type="button"
            onClick={handleAddNewItem}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition active:scale-95 shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Yeni Soru / Alan Ekle
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition active:scale-95 shadow-md text-sm"
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

      {/* Filter and Category Ribbon */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-4xl no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Soru veya hedef ara..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Formda Gözüken Soru / Başlık</th>
                <th className="py-3.5 px-4">Alan Anahtarı (Field Key)</th>
                <th className="py-3.5 px-4">Veri Tipi</th>
                <th className="py-3.5 px-4">Resmi Ek-2 Belgesindeki Hedef Konum</th>
                <th className="py-3.5 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <Layers className="w-3 h-3 text-teal-600" />
                      {categories.find(c => c.id === item.category)?.label || item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {item.label}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                    {item.fieldKey}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 font-medium text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {item.targetCellOrLocation}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    Aramanıza veya seçilen kategoriye uygun alan bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-teal-600" />
              Soru / Alan Eşlemesini Düzenle
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kategori
                </label>
                <select
                  value={editingItem.category}
                  onChange={e => setEditingItem({ ...editingItem, category: e.target.value as any })}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {categories.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Formda Gözüken Soru Başlığı
                </label>
                <input
                  type="text"
                  value={editingItem.label}
                  onChange={e => setEditingItem({ ...editingItem, label: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Alan Anahtarı (fieldKey)
                  </label>
                  <input
                    type="text"
                    value={editingItem.fieldKey}
                    onChange={e => setEditingItem({ ...editingItem, fieldKey: e.target.value })}
                    className="w-full text-sm font-mono border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Veri Tipi
                  </label>
                  <select
                    value={editingItem.type}
                    onChange={e => setEditingItem({ ...editingItem, type: e.target.value as any })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="text">Kısa Metin</option>
                    <option value="textarea">Uzun Açıklama / Çok Satırlı</option>
                    <option value="choice">Seçenekli (Dropdown)</option>
                    <option value="yes_no_date">Evet / Hayır / Tarih</option>
                    <option value="number">Sayısal (Boy, Kilo, Yaş vb.)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Resmi Ek-2 Belgesindeki Hedef Hücre / Konum Açıklaması
                </label>
                <input
                  type="text"
                  value={editingItem.targetCellOrLocation}
                  onChange={e => setEditingItem({ ...editingItem, targetCellOrLocation: e.target.value })}
                  placeholder="örn: Sayfa 1 - Satır 18 / Tıbbi Anamnez Tablosu"
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-sm transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleUpdateItem(editingItem)}
                className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow transition"
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
