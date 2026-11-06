import React from 'react';
import { 
  FileEdit, 
  LayoutDashboard, 
  Building2, 
  Palette, 
  FolderKanban, 
  Settings, 
  LogOut,
  HeartPulse,
  FileSpreadsheet
} from 'lucide-react';
import { UserRole } from '../types';

export type ActiveNavTab = 'fill' | 'dashboard' | 'companies' | 'company-detail' | 'template' | 'projects' | 'settings' | 'field-health' | 'ek2-mapping';

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

  const navItems = [
    {
      id: 'fill' as ActiveNavTab,
      label: 'Yeni Sertifika Hazırla',
      shortLabel: 'Doldur',
      icon: FileEdit,
      isPrimary: true,
      requiresAdmin: false,
      section: 'main'
    },
    {
      id: 'dashboard' as ActiveNavTab,
      label: 'Genel Durum & Takip',
      shortLabel: 'Ana Sayfa',
      icon: LayoutDashboard,
      badge: stats && stats.expiringSoon > 0 ? stats.expiringSoon : null,
      requiresAdmin: false,
      section: 'main'
    },
    {
      id: 'companies' as ActiveNavTab,
      label: 'Kayıtlı Firmalar',
      shortLabel: 'Firmalar',
      icon: Building2,
      activeOnDetail: true,
      requiresAdmin: false,
      section: 'main'
    },
    {
      id: 'field-health' as ActiveNavTab,
      label: 'Saha Sağlık / Ek-2 Formu',
      shortLabel: 'Saha Sağlık',
      icon: HeartPulse,
      requiresAdmin: false,
      section: 'main'
    },
    // Admin section
    {
      id: 'template' as ActiveNavTab,
      label: 'Şablon Tasarım Stüdyosu',
      shortLabel: 'Tasarım',
      icon: Palette,
      requiresAdmin: true,
      section: 'admin'
    },
    {
      id: 'projects' as ActiveNavTab,
      label: 'Projelerim & Şablonlar',
      shortLabel: 'Projeler',
      icon: FolderKanban,
      requiresAdmin: true,
      section: 'admin'
    },
    {
      id: 'ek2-mapping' as ActiveNavTab,
      label: 'Ek-2 Evrak & Alan Eşleme',
      shortLabel: 'Evrak Eşleme',
      icon: FileSpreadsheet,
      requiresAdmin: true,
      section: 'admin'
    },
    {
      id: 'settings' as ActiveNavTab,
      label: 'Sistem & Firma Yönetimi',
      shortLabel: 'Ayarlar',
      icon: Settings,
      requiresAdmin: true,
      section: 'admin'
    }
  ];

  const isCompanyRep = userRole === 'company_rep';
  const visibleItems = navItems.filter(item => {
    if (isCompanyRep) {
      return item.id === 'dashboard' || item.id === 'companies';
    }
    return !item.requiresAdmin || isAdmin;
  }).map(item => {
    if (isCompanyRep && item.id === 'companies') {
      return { ...item, label: 'Personel & Sertifikalarım', shortLabel: 'Personel' };
    }
    if (isCompanyRep && item.id === 'dashboard') {
      return { ...item, label: 'Genel Durum & Belgeler', shortLabel: 'Özet' };
    }
    return item;
  });
  const userInitial = userName ? userName.substring(0, 1).toUpperCase() : 'U';

  return (
    <>
      {/* ========================================================================= */}
      {/* MASAÜSTÜ YAN MENÜ (DESKTOP ICON-ONLY RAIL: w-16 = 64px)                   */}
      {/* ========================================================================= */}
      <aside 
        className="hidden md:flex md:w-16 w-16 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex-col h-screen select-none shrink-0 z-30 shadow-2xl relative items-center justify-between py-3"
      >
        {/* Top: Brand Logo */}
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/25 font-black text-slate-950 text-base tracking-wider shrink-0 group-hover:scale-105 group-hover:shadow-amber-500/40 transition-all duration-200">
              PC
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50">
              <span className="font-bold text-amber-400">ProCertify</span> İSG Studio
            </div>
          </div>

          <div className="w-8 h-[1px] bg-slate-800 my-1"></div>

          {/* Navigation Items */}
          <div className="flex flex-col items-center gap-2 w-full px-2">
            {visibleItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id || (item.activeOnDetail && currentTab === 'company-detail');
              const isDividerBefore = item.requiresAdmin && index > 0 && !visibleItems[index - 1].requiresAdmin;

              return (
                <React.Fragment key={item.id}>
                  {isDividerBefore && (
                    <div className="w-8 h-[1px] bg-slate-800 my-1"></div>
                  )}

                  <div className="relative group w-full flex justify-center">
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${
                        isActive
                          ? item.isPrimary
                            ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-md shadow-amber-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                      }`}
                      title={item.label}
                    >
                      <Icon 
                        size={20} 
                        className={`transition-transform duration-200 ${
                          isActive 
                            ? item.isPrimary ? 'text-slate-950 scale-105' : 'text-amber-400 scale-105'
                            : 'group-hover:text-amber-300 group-hover:scale-110'
                        }`} 
                      />

                      {/* Notification Badge */}
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-slate-900 shadow-sm animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* Tooltip */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 flex items-center gap-2 drop-shadow-2xl">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Bottom: User Profile & Logout */}
        <div className="flex flex-col items-center gap-2 w-full px-2 pt-2 border-t border-slate-800">
          {/* User Avatar */}
          <div className="relative group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm cursor-pointer ${
              isAdmin 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              <span className="font-black text-xs">{userInitial}</span>
            </div>
            {/* User Tooltip */}
            <div className="absolute left-full ml-3 bottom-1 px-3 py-1.5 bg-slate-950 border border-slate-700/80 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50">
              <div className="font-bold text-white">{userName || 'Kullanıcı'}</div>
              <div className="text-[10px] text-slate-400">{isAdmin ? '🛡️ Yönetici' : '👤 İSG Uzmanı'}</div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="relative group">
            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Çıkış Yap"
            >
              <LogOut size={16} />
            </button>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-950 border border-slate-700/80 text-rose-300 text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50">
              Çıkış Yap
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBİL ALT NAVİGASYON BARI (MOBILE BOTTOM NAVIGATION BAR)                  */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 z-40 px-1 flex items-center justify-around select-none shadow-2xl">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.activeOnDetail && currentTab === 'company-detail');
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all relative ${
                isActive
                  ? item.isPrimary
                    ? 'text-amber-400 font-bold'
                    : 'text-amber-400 font-bold bg-amber-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon size={18} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-0.5 tracking-tight truncate max-w-[46px]">
                {item.shortLabel || item.label}
              </span>
            </button>
          );
        })}

        {/* Mobile Logout Button */}
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-lg text-slate-500 hover:text-rose-400 transition"
          title="Çıkış Yap"
        >
          <LogOut size={18} />
          <span className="text-[9px] mt-0.5 tracking-tight">Çıkış</span>
        </button>
      </nav>
    </>
  );
};
