import React, { useState } from 'react';
import {
  Building2,
  Shield,
  User,
  Bell,
  Search,
  Check,
  ChevronDown,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Pencil, LogOut, Mail, Smartphone } from 'lucide-react';
import { UserProfile } from '../../types/voucher';
import { AppBrand } from '../../utils/accessControl';

interface NavbarProps {
  currentUser: UserProfile;
  contact?: { email?: string; mobile?: string };
  brand: AppBrand;
  canEditBrand?: boolean;
  onEditBrand?: () => void;
  onLogout: () => void;
  onResetData: () => void;
  hideReset?: boolean;
  syncStatus?: 'live' | 'connecting' | 'offline' | null;
  onGlobalSearch: (term: string) => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  contact,
  brand,
  canEditBrand,
  onEditBrand,
  onLogout,
  onResetData,
  hideReset,
  syncStatus,
  onGlobalSearch,
  onToggleSidebar,
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGlobalSearch(searchQuery);
  };

  return (
    <header className="no-print bg-slate-900 text-white border-b border-slate-800 shrink-0 z-40 shadow-md">
      <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile / Tablet Hamburger Toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg focus:outline-none transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center font-black text-slate-900 text-sm sm:text-base shadow-md tracking-tighter shrink-0 overflow-hidden p-1">
            {brand.logoImage ? (
              <img src={brand.logoImage} alt="" className="max-w-full max-h-full object-contain" />
            ) : (
              brand.logoText
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-xs sm:text-base tracking-tight text-white uppercase whitespace-nowrap truncate max-w-[40vw] sm:max-w-none">
                {brand.appName}
              </span>
              {brand.badge && (
                <span className="hidden xs:inline-block bg-emerald-500/20 text-emerald-400 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap">
                  {brand.badge}
                </span>
              )}
              {canEditBrand && (
                <button
                  type="button"
                  onClick={onEditBrand}
                  title="Edit app name & logo"
                  aria-label="Edit app name and logo"
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden md:block truncate max-w-[320px]">
              {brand.subtitle}
            </p>
          </div>
        </div>

        {/* Global Search */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search IN vouchers, accounts, receipts, parties..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onGlobalSearch(e.target.value);
              }}
              className="w-full bg-slate-800/90 text-xs text-white placeholder-slate-400 rounded-lg pl-9 pr-4 py-2 border border-slate-700 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Right Action Tools: Role Switcher & User Profile */}
        <div className="flex items-center gap-3">
          
          {/* Signed-in user menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 pl-1.5 pr-2.5 py-1.5 rounded-lg border border-slate-700 text-xs transition-colors"
            >
              <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-[10px] overflow-hidden ring-2 ring-white/10">
                {currentUser.name.slice(0, 2).toUpperCase()}
                {currentUser.avatar && (
                  <img src={currentUser.avatar} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 w-full h-full object-cover" />
                )}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-[10px] text-slate-400 block leading-tight">{currentUser.name}</span>
                <span className={`font-bold leading-tight ${
                  currentUser.role === 'Admin' ? 'text-amber-400' : currentUser.role === 'Authorized Accounts Manager' ? 'text-indigo-300' : 'text-emerald-400'
                }`}>{currentUser.role}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-sm font-bold text-white">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400">{currentUser.designation}</p>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-300">
                      {contact?.email && <p className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 text-slate-500 shrink-0" />{contact.email}</p>}
                      {contact?.mobile && <p className="flex items-center gap-1.5"><Smartphone className="w-3 h-3 text-slate-500 shrink-0" />+91 {contact.mobile}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsRoleDropdownOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-xs font-bold text-rose-300 hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>

          {syncStatus && (
            <span
              title={syncStatus === 'live' ? 'Cloud sync is live' : syncStatus === 'connecting' ? 'Connecting to cloud…' : 'Cloud offline – reconnecting'}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                syncStatus === 'live' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : syncStatus === 'connecting' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${syncStatus === 'live' ? 'bg-emerald-400 animate-pulse' : syncStatus === 'connecting' ? 'bg-amber-400' : 'bg-rose-400'}`} />
              {syncStatus === 'live' ? 'Live' : syncStatus === 'connecting' ? 'Syncing' : 'Offline'}
            </span>
          )}

          {/* Reset Demo Data Button */}
          {!hideReset && <button
            type="button"
            onClick={onResetData}
            title="Reset system sequence and load default Raviraja vouchers"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>}
        </div>

      </div>
    </header>
  );
};
