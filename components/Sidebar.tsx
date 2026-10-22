import React from 'react';
import { 
  FileEdit, 
  LayoutDashboard, 
  Building2, 
  Palette, 
  FolderKanban, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '../types';

export type ActiveNavTab = 'fill' | 'dashboard' | 'companies' | 'company-detail' | 'template' | 'projects' | 'settings';

interface SidebarProps {
  currentTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  userRole: UserRole;
  userName: string;
  onLogout: () => void;
  stats?: {
    total: number;
    expired: number;
    expiringSoon: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  userRole,
  userName,
  onLogout,
  stats
}) => {
  const isAdmin = userRole === 'admin';

  return (
    <aside className="w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col h-screen select-none shrink-0 z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black text-slate-950 text-xl tracking-wider">
            PC
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight tracking-tight flex items-center gap-1.5">
              ProCertify
              <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                İSG
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Eğitim Takip Sistemi</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
        {/* User Standard Menu */}
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-500">
          Hızlı Erişim
        </div>

        {/* 1. DOLDUR (En Üstte) */}
        <button
          onClick={() => onTabChange('fill')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all group ${
            currentTab === 'fill'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <FileEdit size={18} className={currentTab === 'fill' ? 'text-slate-950' : 'text-amber-400 group-hover:scale-110 transition'} />
            <span>Yeni Sertifika (Doldur)</span>
          </div>
          {currentTab === 'fill' && <ChevronRight size={16} />}
        </button>

        {/* 2. ANA SAYFA (Dashboard) */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all group ${
            currentTab === 'dashboard'
              ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard size={18} className={currentTab === 'dashboard' ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400 group-hover:scale-110 transition'} />
            <span>Ana Sayfa (Dashboard)</span>
          </div>
          {stats && stats.expiringSoon > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {stats.expiringSoon}
            </span>
          )}
        </button>

        {/* 3. FİRMALAR */}
        <button
          onClick={() => onTabChange('companies')}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all group ${
            currentTab === 'companies' || currentTab === 'company-detail'
              ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <Building2 size={18} className={currentTab === 'companies' || currentTab === 'company-detail' ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400 group-hover:scale-110 transition'} />
            <span>Firmalar</span>
          </div>
        </button>

        {/* ADMIN EXCLUSIVE SECTION */}
        {isAdmin && (
          <div className="pt-5 mt-4 border-t border-slate-800/80 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-amber-500/80 flex items-center gap-1.5">
              <ShieldCheck size={12} />
              <span>Yönetici Paneli</span>
            </div>

            {/* 4. ŞABLON TASARIMI */}
            <button
              onClick={() => onTabChange('template')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                currentTab === 'template'
                  ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Palette size={18} className={currentTab === 'template' ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400 group-hover:scale-110 transition'} />
                <span>Şablon Tasarımı</span>
              </div>
            </button>

            {/* 5. PROJE YÖNETİMİ */}
            <button
              onClick={() => onTabChange('projects')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                currentTab === 'projects'
                  ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderKanban size={18} className={currentTab === 'projects' ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400 group-hover:scale-110 transition'} />
                <span>Projeler & Şablonlar</span>
              </div>
            </button>

            {/* 6. SİSTEM AYARLARI */}
            <button
              onClick={() => onTabChange('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                currentTab === 'settings'
                  ? 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings size={18} className={currentTab === 'settings' ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400 group-hover:scale-110 transition'} />
                <span>Sistem Ayarları</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* User Info & Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {isAdmin ? <ShieldCheck size={16} /> : <UserIcon size={16} />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {userName || 'Kullanıcı'}
              </p>
              <p className="text-[10px] text-slate-400 truncate capitalize font-medium">
                {isAdmin ? 'Yönetici' : 'İSG Uzmanı'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Çıkış Yap"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
