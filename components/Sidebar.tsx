import React, { useState } from 'react';
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
  ChevronRight,
  ChevronLeft,
  Menu
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
  // Default to compact icon-only mode as requested by user
  const [isCollapsed, setIsCollapsed] = useState(true);

  const navItems = [
    {
      id: 'fill' as ActiveNavTab,
      label: 'Yeni Sertifika (Doldur)',
      shortLabel: 'Doldur',
      icon: FileEdit,
      isPrimary: true,
      requiresAdmin: false
    },
    {
      id: 'dashboard' as ActiveNavTab,
      label: 'Ana Sayfa (Dashboard)',
      shortLabel: 'Ana Sayfa',
      icon: LayoutDashboard,
      badge: stats && stats.expiringSoon > 0 ? stats.expiringSoon : null,
      requiresAdmin: false
    },
    {
      id: 'companies' as ActiveNavTab,
      label: 'Kayıtlı Firmalar',
      shortLabel: 'Firmalar',
      icon: Building2,
      activeOnDetail: true,
      requiresAdmin: false
    },
    // Admin only
    {
      id: 'template' as ActiveNavTab,
      label: 'Şablon Tasarımı',
      shortLabel: 'Tasarım',
      icon: Palette,
      requiresAdmin: true
    },
    {
      id: 'projects' as ActiveNavTab,
      label: 'Projeler & Şablonlar',
      shortLabel: 'Projeler',
      icon: FolderKanban,
      requiresAdmin: true
    },
    {
      id: 'settings' as ActiveNavTab,
      label: 'Sistem Ayarları',
      shortLabel: 'Ayarlar',
      icon: Settings,
      requiresAdmin: true
    }
  ];

  const visibleItems = navItems.filter(item => !item.requiresAdmin || isAdmin);
  const userInitial = userName ? userName.substring(0, 1).toUpperCase() : 'U';

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`hidden md:flex ${
          isCollapsed ? 'md:w-16' : 'md:w-56'
        } bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex-col h-screen select-none shrink-0 z-30 transition-all duration-200`}
      >
        {/* Brand & Collapse Toggle Header */}
        <div className={`p-3 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2.5 cursor-pointer group"
            title={isCollapsed ? "Genişlet" : "Daralt"}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md shadow-amber-500/20 font-black text-slate-950 text-sm tracking-wider shrink-0 group-hover:scale-105 transition">
              PC
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-white text-sm leading-tight tracking-tight flex items-center gap-1">
                  <span>ProCertify</span>
                  <span className="text-[9px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded">
                    İSG
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium truncate">Eğitim Takip</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Yan Menüyü Daralt (Sadece İkon)"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 custom-scrollbar">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.activeOnDetail && currentTab === 'company-detail');
            const isDividerBefore = item.requiresAdmin && index > 0 && !visibleItems[index - 1].requiresAdmin;

            return (
              <React.Fragment key={item.id}>
                {isDividerBefore && (
                  <div className="my-2 border-t border-slate-800/80 w-full" />
                )}

                <div className="relative group">
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                    } py-2.5 rounded-xl font-medium text-xs transition-all ${
                      isActive
                        ? item.isPrimary
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-amber-400 font-bold border border-amber-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} relative`}>
                      <Icon 
                        size={18} 
                        className={`shrink-0 ${
                          isActive
                            ? item.isPrimary ? 'text-slate-950' : 'text-amber-400'
                            : 'group-hover:text-amber-400 group-hover:scale-110 transition'
                        }`} 
                      />

                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}

                      {/* Badge for collapsed mode (indicator dot) */}
                      {isCollapsed && item.badge && (
                        <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center ring-2 ring-slate-900">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Floating Tooltip in collapsed mode */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-950 border border-slate-700 text-white text-xs font-semibold rounded-lg shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500 text-slate-950">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* User Info & Footer */}
        <div className="p-2 border-t border-slate-800 bg-slate-950/40">
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'} p-1.5 rounded-xl bg-slate-900 border border-slate-800/80`}>
            <div className="relative group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 cursor-pointer ${
                isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                <span className="font-bold text-xs">{userInitial}</span>
              </div>

              {/* Tooltip for user avatar in collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-2.5 bottom-0 px-2.5 py-1 bg-slate-950 border border-slate-700 text-white text-xs rounded-lg shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50">
                  <div className="font-bold">{userName || 'Kullanıcı'}</div>
                  <div className="text-[10px] text-slate-400">{isAdmin ? 'Yönetici' : 'İSG Uzmanı'}</div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1 px-2">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {userName || 'Kullanıcı'}
                </p>
                <p className="text-[10px] text-slate-400 truncate capitalize font-medium">
                  {isAdmin ? 'Yönetici' : 'İSG Uzmanı'}
                </p>
              </div>
            )}

            <div className="relative group">
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                title="Çıkış Yap"
              >
                <LogOut size={16} />
              </button>

              {/* Tooltip for logout in collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-950 border border-red-500/30 text-red-300 text-xs font-semibold rounded-lg shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50">
                  Çıkış Yap
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
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
          className="flex flex-col items-center justify-center py-1 px-1 rounded-lg text-slate-500 hover:text-red-400 transition"
          title="Çıkış Yap"
        >
          <LogOut size={18} />
          <span className="text-[9px] mt-0.5 tracking-tight">Çıkış</span>
        </button>
      </nav>
    </>
  );
};
