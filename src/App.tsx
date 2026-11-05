import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { CreditVoucherForm } from './components/voucher/CreditVoucherForm';
import { CreditVoucherRegister } from './components/voucher/CreditVoucherRegister';
import { DebitVoucherForm } from './components/voucher/DebitVoucherForm';
import { DebitVoucherRegister } from './components/voucher/DebitVoucherRegister';
import { PrintableVoucher } from './components/voucher/PrintableVoucher';
import { DocumentRegister } from './components/voucher/DocumentRegister';
import { VoucherDashboard } from './components/voucher/VoucherDashboard';
import { ClientsView } from './components/crm/ClientsView';
import { VoucherDetailsModal } from './components/voucher/VoucherDetailsModal';
import { InVoucher, UserProfile, UserRole, CreditVoucher, DebitVoucher } from './types/voucher';
import { voucherStorage } from './utils/voucherStorage';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  // Authentication & Role
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => voucherStorage.getCurrentUser());

  // Data Store
  const [creditVouchers, setCreditVouchers] = useState<CreditVoucher[]>(() => voucherStorage.getCreditVouchers());
  const [debitVouchers, setDebitVouchers] = useState<DebitVoucher[]>(() => voucherStorage.getDebitVouchers());

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Active Voucher for Editing or Printing
  const [editingVoucher, setEditingVoucher] = useState<InVoucher | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<InVoucher | null>(null);
  const [viewingVoucher, setViewingVoucher] = useState<InVoucher | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refresh vouchers from storage
  const refreshData = () => {
    setCreditVouchers(voucherStorage.getCreditVouchers());
    setDebitVouchers(voucherStorage.getDebitVouchers());
  };

  // Role Switcher Handler
  const handleRoleChange = (role: UserRole) => {
    const updatedUser = voucherStorage.setCurrentUser(role);
    setCurrentUser(updatedUser);
    showToast(`Switched active user to ${updatedUser.name} (${role})`);
  };

  // Reset Demo Data
  const handleResetData = () => {
    if (confirm('Reset database to default ERP records?')) {
      voucherStorage.resetToDefaultData();
      refreshData();
      setCurrentUser(voucherStorage.getCurrentUser());
      showToast('Database reset to authentic initial ERP vouchers.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Save Success Callback
  const handleSaveSuccess = (savedVoucher: InVoucher, andPrint = false) => {
    refreshData();
    setEditingVoucher(null);

    const isOut = savedVoucher.voucherType === 'OUT(Debit)';

    if (andPrint) {
      setPrintingVoucher(savedVoucher);
      showToast(`Voucher ${savedVoucher.voucherNo} saved successfully! Opening printable view...`);
    } else {
      if (isOut) {
        setActiveTab('debit-register');
        showToast(`Debit Voucher ${savedVoucher.voucherNo} saved successfully!`);
      } else {
        setActiveTab('credit-register');
        showToast(`Credit Voucher ${savedVoucher.voucherNo} saved successfully!`);
      }
    }
  };

  // Count documents
  const totalDocsCount = [...creditVouchers, ...debitVouchers].reduce((acc, v) => acc + (v.attachments ? v.attachments.length : 0), 0);

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onResetData={handleResetData}
        onGlobalSearch={(term) => {
          if (term.trim()) {
            setActiveTab('credit-register');
          }
        }}
        onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setPrintingVoucher(null);
            setEditingVoucher(null);
            setActiveTab(tab);
          }}
          inCount={creditVouchers.length}
          outCount={debitVouchers.length}
          docsCount={totalDocsCount}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Body */}
        <main className="flex-1 h-full p-3 sm:p-5 lg:p-7 min-w-0 overflow-y-auto">
          
          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="no-print mb-5 p-3.5 bg-emerald-700 text-white rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-2 z-50 relative">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-emerald-200 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Conditional Rendering */}
          {printingVoucher ? (
            <PrintableVoucher
              voucher={printingVoucher}
              onBack={() => setPrintingVoucher(null)}
              onEdit={() => {
                setEditingVoucher(printingVoucher);
                setPrintingVoucher(null);
                setActiveTab(printingVoucher.voucherType === 'OUT(Debit)' ? 'debit-entry' : 'credit-entry');
              }}
            />
          ) : activeTab === 'credit-entry' ? (
            <CreditVoucherForm
              initialVoucher={editingVoucher as CreditVoucher}
              currentUser={currentUser}
              onSaveSuccess={handleSaveSuccess}
              onCancel={() => setActiveTab('credit-register')}
              onSwitchToDebit={() => {
                setEditingVoucher(null);
                setActiveTab('debit-entry');
              }}
            />
          ) : activeTab === 'credit-register' ? (
            <CreditVoucherRegister
              currentUser={currentUser}
              vouchers={creditVouchers}
              onRefresh={refreshData}
              onCreateNew={() => setActiveTab('credit-entry')}
              onEdit={(v) => {
                setEditingVoucher(v);
                setActiveTab('credit-entry');
              }}
              onPrint={(v) => setPrintingVoucher(v)}
              onView={(v) => setViewingVoucher(v)}
            />
          ) : activeTab === 'debit-entry' ? (
            <DebitVoucherForm
              initialVoucher={editingVoucher as DebitVoucher}
              currentUser={currentUser}
              onSaveSuccess={handleSaveSuccess}
              onCancel={() => setActiveTab('debit-register')}
              onSwitchToCredit={() => {
                setEditingVoucher(null);
                setActiveTab('credit-entry');
              }}
            />
          ) : activeTab === 'debit-register' ? (
            <DebitVoucherRegister
              currentUser={currentUser}
              vouchers={debitVouchers}
              onRefresh={refreshData}
              onCreateNew={() => setActiveTab('debit-entry')}
              onEdit={(v) => {
                setEditingVoucher(v);
                setActiveTab('debit-entry');
              }}
              onPrint={(v) => setPrintingVoucher(v)}
              onView={(v) => setViewingVoucher(v)}
            />
          ) : activeTab === 'dashboard' ? (
            <VoucherDashboard
              inVouchers={creditVouchers}
              outVouchers={debitVouchers}
              onNavigate={(tab) => setActiveTab(tab as any)}
              onViewVoucher={(v) => setViewingVoucher(v)}
              onPrintVoucher={(v) => setPrintingVoucher(v)}
            />
          ) : activeTab === 'docs' ? (
            <DocumentRegister
              vouchers={[...creditVouchers, ...debitVouchers]}
              onViewVoucher={(v) => setViewingVoucher(v)}
            />
          ) : activeTab === 'crm-leads' ? (
            <ClientsView
              inVouchers={creditVouchers}
              onOpenVoucher={(v) => setViewingVoucher(v)}
            />
          ) : null}

        </main>
      </div>

      {/* Global Details Modal */}
      <VoucherDetailsModal
        voucher={viewingVoucher}
        isOpen={Boolean(viewingVoucher)}
        onClose={() => setViewingVoucher(null)}
        onPrint={(v) => {
          setViewingVoucher(null);
          setPrintingVoucher(v);
        }}
        onEdit={(v) => {
          setViewingVoucher(null);
          setEditingVoucher(v);
          setActiveTab(v.voucherType === 'OUT(Debit)' ? 'debit-entry' : 'credit-entry');
        }}
      />

    </div>
  );
}

