import React, { useState, useRef } from 'react';
import { 
  X, 
  Search, 
  Upload, 
  Sparkles, 
  FolderOpen, 
  Trash2, 
  Plus, 
  Check, 
  Layers, 
  ShieldCheck, 
  Award, 
  Image as ImageIcon,
  BoxSelect,
  Filter
} from 'lucide-react';
import { CERTIFICATE_LIBRARY_ASSETS, LibraryAsset, svgToDataUrl } from '../constants/certificateAssets';
import { UserAsset } from '../types';

interface AssetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAssets: UserAsset[];
  onUploadAsset: (newAsset: UserAsset) => void;
  onDeleteUserAsset: (id: string) => void;
  onInsertAsset: (asset: { name: string; dataUrl: string; width: number; height: number; isBorder?: boolean }) => void;
  initialTab?: 'elements' | 'uploads';
}

export const AssetLibraryModal: React.FC<AssetLibraryModalProps> = ({
  isOpen,
  onClose,
  userAssets,
  onUploadAsset,
  onDeleteUserAsset,
  onInsertAsset,
  initialTab = 'elements'
}) => {
  const [activeTab, setActiveTab] = useState<'elements' | 'uploads'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedAssetId, setAddedAssetId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter built-in elements
  const filteredLibraryAssets = CERTIFICATE_LIBRARY_ASSETS.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = !query || 
      item.name.toLowerCase().includes(query) || 
      item.tags.some(t => t.toLowerCase().includes(query));
    return matchesCat && matchesQuery;
  });

  // Filter user uploads
  const filteredUserAssets = userAssets.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    return !query || item.name.toLowerCase().includes(query);
  });

  const handleSelectLibraryAsset = (item: LibraryAsset) => {
    const dataUrl = svgToDataUrl(item.svg);
    onInsertAsset({
      name: item.name,
      dataUrl,
      width: item.defaultWidth,
      height: item.defaultHeight,
      isBorder: item.category === 'border'
    });
    setAddedAssetId(item.id);
    setTimeout(() => setAddedAssetId(null), 1800);
  };

  const handleSelectUserAsset = (item: UserAsset) => {
    onInsertAsset({
      name: item.name,
      dataUrl: item.dataUrl,
      width: item.width || 300,
      height: item.height || 200,
      isBorder: item.category === 'border'
    });
    setAddedAssetId(item.id);
    setTimeout(() => setAddedAssetId(null), 1800);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        const img = new Image();
        img.onload = () => {
          const newAsset: UserAsset = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            name: file.name.replace(/\.[^/.]+$/, ''),
            category: file.name.toLowerCase().includes('cerceve') || file.name.toLowerCase().includes('border') ? 'border' : 'custom',
            dataUrl,
            width: img.width || 300,
            height: img.height || 300,
            createdAt: Date.now(),
            fileSize: (file.size / 1024).toFixed(0) + ' KB',
            mimeType: file.type
          };
          onUploadAsset(newAsset);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-750 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Bileşen &amp; Varlık Deposu
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Canva Tarzı Kütüphane
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sertifikalarınıza resmi mühürler, varaklı çerçeveler, İSG ikonları ekleyin veya kendi dosyalarınızı depolayın.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Kapat (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Main Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('elements')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'elements' 
                  ? 'bg-amber-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              <span>Hazır Bileşenler</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                {CERTIFICATE_LIBRARY_ASSETS.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('uploads')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'uploads' 
                  ? 'bg-amber-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderOpen size={14} />
              <span>Yüklemelerim</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
                {userAssets.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'elements' ? "Bileşen ara: mühür, baret, altın, kurdele, ayraç..." : "Yüklenen dosyalarda ara..."}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Hazır Bileşenler */}
        {activeTab === 'elements' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Category Filter Pills */}
            <div className="px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 select-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === 'all' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Tümü ({CERTIFICATE_LIBRARY_ASSETS.length})
              </button>
              <button
                onClick={() => setSelectedCategory('seal')}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === 'seal' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Award size={13} /> Mühür &amp; Damgalar
              </button>
              <button
                onClick={() => setSelectedCategory('border')}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === 'border' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <BoxSelect size={13} /> Çerçeve &amp; Bordürler
              </button>
              <button
                onClick={() => setSelectedCategory('isg')}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === 'isg' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <ShieldCheck size={13} /> İSG &amp; Güvenlik
              </button>
              <button
                onClick={() => setSelectedCategory('ribbon')}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === 'ribbon' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Layers size={13} /> Kurdele &amp; Flamalar
              </button>
              <button
                onClick={() => setSelectedCategory('ornament')}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === 'ornament' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Sparkles size={13} /> Süsleme &amp; Ayraçlar
              </button>
            </div>

            {/* Assets Grid */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {filteredLibraryAssets.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                  <Search size={32} className="mb-2 opacity-50" />
                  <p className="text-sm font-medium">Aramanızla eşleşen bileşen bulunamadı.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} 
                    className="mt-2 text-xs text-amber-400 hover:underline"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredLibraryAssets.map((asset) => {
                    const isAdded = addedAssetId === asset.id;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => handleSelectLibraryAsset(asset)}
                        className="group relative bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/60 rounded-xl p-3 flex flex-col items-center justify-between transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1 select-none"
                      >
                        {/* Preview Area */}
                        <div className="w-full h-32 flex items-center justify-center p-2 rounded-lg bg-slate-900/60 overflow-hidden relative">
                          <div 
                            className="w-full h-full max-h-28 flex items-center justify-center transition duration-200 group-hover:scale-105 pointer-events-none"
                            dangerouslySetInnerHTML={{ __html: asset.svg }}
                          />
                          {isAdded && (
                            <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white font-bold text-xs rounded-lg animate-in fade-in zoom-in duration-150">
                              <Check size={24} className="mb-1" />
                              <span>Eklendi!</span>
                            </div>
                          )}
                        </div>

                        {/* Info Footer */}
                        <div className="w-full mt-2.5 flex flex-col gap-0.5 text-center">
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 truncate">
                            {asset.name}
                          </span>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                            <span>{asset.categoryLabel}</span>
                            <span className="font-mono text-[9px] bg-slate-900 px-1 py-0.5 rounded">
                              {asset.defaultWidth}×{asset.defaultHeight}
                            </span>
                          </div>
                        </div>

                        {/* Hover Overlay Button */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-lg shadow-lg flex items-center justify-center text-[10px] font-bold">
                            <Plus size={12} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Yüklemelerim (User Uploads) */}
        {activeTab === 'uploads' && (
          <div className="flex-1 flex flex-col min-h-0 p-6 overflow-y-auto custom-scrollbar">
            {/* Drag & Drop Upload Zone */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => handleFiles(e.target.files)} 
              accept="image/png,image/svg+xml,image/jpeg,image/webp" 
              multiple 
              className="hidden" 
            />

            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 select-none mb-6 ${
                isDraggingOver 
                  ? 'border-amber-400 bg-amber-500/10' 
                  : 'border-slate-750 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/70'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center shadow-inner">
                <Upload size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Dosyalarınızı buraya sürükleyin veya <span className="text-amber-400 underline">Gözatın</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  SVG (Vektörel), PNG (Şeffaf), JPG veya WEBP formatları desteklenir.
                </p>
              </div>
            </div>

            {/* Uploaded Items Grid */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Kayıtlı Varlıklarınız ({filteredUserAssets.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Tıkladığınız görsel doğrudan aktif sertifika tuvaline eklenir.
              </p>
            </div>

            {filteredUserAssets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-slate-500 border border-slate-800/80 rounded-xl bg-slate-950/20">
                <FolderOpen size={40} className="mb-2 opacity-40 text-amber-500" />
                <h4 className="text-sm font-semibold text-slate-300">Henüz dosya yüklemediniz</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Şirketinizin logosunu, resmi mühür ve kaşenizi, özel imzalarınızı veya hazır çerçevelerinizi buraya yükleyip tüm sertifikalarınızda dilediğiniz gibi kullanabilirsiniz.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow-md flex items-center gap-1.5"
                >
                  <Plus size={14} /> İlk Dosyanızı Yükleyin
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredUserAssets.map((asset) => {
                  const isAdded = addedAssetId === asset.id;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => handleSelectUserAsset(asset)}
                      className="group relative bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/60 rounded-xl p-3 flex flex-col items-center justify-between transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1 select-none"
                    >
                      {/* Checkered Transparency Background for Real Logos */}
                      <div 
                        className="w-full h-32 flex items-center justify-center p-2 rounded-lg overflow-hidden relative"
                        style={{
                          backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                          backgroundColor: '#0f172a'
                        }}
                      >
                        <img 
                          src={asset.dataUrl} 
                          alt={asset.name} 
                          className="max-w-full max-h-full object-contain pointer-events-none group-hover:scale-105 transition duration-200"
                        />
                        {isAdded && (
                          <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white font-bold text-xs rounded-lg animate-in fade-in zoom-in duration-150">
                            <Check size={24} className="mb-1" />
                            <span>Eklendi!</span>
                          </div>
                        )}
                      </div>

                      {/* Info & Delete */}
                      <div className="w-full mt-2.5 flex items-center justify-between">
                        <div className="min-w-0 pr-1 text-left">
                          <p className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 truncate" title={asset.name}>
                            {asset.name}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {asset.fileSize || `${asset.width}×${asset.height}`}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`"${asset.name}" dosyasını deponuzdan silmek istediğinize emin misiniz?`)) {
                              onDeleteUserAsset(asset.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition shrink-0"
                          title="Depodan Sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Add Pill on Hover */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-lg shadow-lg flex items-center justify-center text-[10px] font-bold">
                          <Plus size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Vektörel &amp; Yüksek Çözünürlüklü Varlık Motoru Aktif</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
