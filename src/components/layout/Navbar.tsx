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
import { UserProfile, UserRole } from '../../types/voucher';
import { DEFAULT_USERS } from '../../utils/voucherStorage';

interface NavbarProps {
  currentUser: UserProfile;
  onRoleChange: (role: UserRole) => void;
  onResetData: () => void;
  onGlobalSearch: (term: string) => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleChange,
  onResetData,
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

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-sm sm:text-base shadow-md tracking-tighter shrink-0">
            RIL
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-xs sm:text-base tracking-tight text-white uppercase whitespace-nowrap">
                RAVIRAJA CRM
              </span>
              <span className="hidden xs:inline-block bg-emerald-500/20 text-emerald-400 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap">
                FINANCE DESK
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden md:block">
              Raviraja Industries Private Limited • Hyderabad
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
          
          {/* Security Role Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs transition-colors"
            >
              <Shield className={`w-3.5 h-3.5 ${
                currentUser.role === 'Admin' ? 'text-amber-400' : currentUser.role === 'Authorized Accounts Manager' ? 'text-indigo-400' : 'text-emerald-400'
              }`} />
              <div className="text-left hidden sm:block">
                <span className="text-[10px] text-slate-400 block leading-tight">Role Switcher:</span>
                <span className="font-bold text-white leading-tight">{currentUser.role}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select CRM Security Role
                </div>

                {(['Admin', 'Accounts Staff', 'Authorized Accounts Manager'] as UserRole[]).map((role) => {
                  const user = DEFAULT_USERS[role];
                  const isCurrent = currentUser.role === role;

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        onRoleChange(role);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                        isCurrent ? 'bg-slate-800/80 font-bold text-blue-400' : 'text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{role}</div>
                        <div className="text-[10px] text-slate-400">{user.name} • {user.designation}</div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  );
                })}

                <div className="pt-2 px-3 border-t border-slate-800 text-[10px] text-slate-400">
                  {currentUser.role === 'Admin' && '✓ Full privileges: can delete and edit any voucher.'}
                  {currentUser.role === 'Accounts Staff' && '✓ Entry privilege: can create & view vouchers.'}
                  {currentUser.role === 'Authorized Accounts Manager' && '✓ Approver privilege: can sign-off and verify.'}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar & Name */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs overflow-hidden">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-white truncate max-w-[130px] leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-[130px] leading-tight">
                {currentUser.designation}
              </p>
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <button
            type="button"
            onClick={onResetData}
            title="Reset system sequence and load default Raviraja vouchers"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
