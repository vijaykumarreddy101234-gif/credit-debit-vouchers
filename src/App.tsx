/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { InVoucherForm } from './components/voucher/InVoucherForm';
import { InVoucherRegister } from './components/voucher/InVoucherRegister';
import { PrintableVoucher } from './components/voucher/PrintableVoucher';
import { DocumentRegister } from './components/voucher/DocumentRegister';
import { OutVoucherModule } from './components/voucher/OutVoucherModule';
import { VoucherDashboard } from './components/voucher/VoucherDashboard';
import { ChartOfAccountsView } from './components/crm/ChartOfAccountsView';
import { ClientsView } from './components/crm/ClientsView';
import { VoucherDetailsModal } from './components/voucher/VoucherDetailsModal';
import { InVoucher, OutVoucher, UserProfile, UserRole } from './types/voucher';
import { voucherStorage } from './utils/voucherStorage';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  // Authentication & Role
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => voucherStorage.getCurrentUser());

  // Data Store
  const [inVouchers, setInVouchers] = useState<InVoucher[]>(() => voucherStorage.getInVouchers());
  const [outVouchers, setOutVouchers] = useState<OutVoucher[]>(() => voucherStorage.getOutVouchers());

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('in-register');

  // Active Voucher for Editing or Printing
  const [editingVoucher, setEditingVoucher] = useState<InVoucher | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<InVoucher | null>(null);
  const [viewingVoucher, setViewingVoucher] = useState<InVoucher | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refresh vouchers from storage
  const refreshData = () => {
    setInVouchers(voucherStorage.getInVouchers());
    setOutVouchers(voucherStorage.getOutVouchers());
  };

  // Role Switcher Handler
  const handleRoleChange = (role: UserRole) => {
    const updatedUser = voucherStorage.setCurrentUser(role);
    setCurrentUser(updatedUser);
    showToast(`Switched active user to ${updatedUser.name} (${role})`);
  };

  // Reset Demo Data
  const handleResetData = () => {
    if (confirm('Reset voucher database to default Raviraja Industries records?')) {
      voucherStorage.resetToDefaultData();
      refreshData();
      setCurrentUser(voucherStorage.getCurrentUser());
      showToast('Database reset to authentic initial Raviraja vouchers.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Save Success Callback from InVoucherForm
  const handleSaveSuccess = (savedVoucher: InVoucher, andPrint = false) => {
    refreshData();
    setEditingVoucher(null);

    const isOut =
      savedVoucher.voucherType === 'OUT' ||
      savedVoucher.voucherType === 'OUT(Debit)' ||
      (savedVoucher.voucherNo && savedVoucher.voucherNo.startsWith('OUT-'));

    if (andPrint) {
      setPrintingVoucher(savedVoucher);
      showToast(`Voucher ${savedVoucher.voucherNo} saved successfully! Opening printable view...`);
    } else {
      if (isOut) {
        setActiveTab('out-register');
        showToast(`OUT Voucher ${savedVoucher.voucherNo} saved successfully in database!`);
      } else {
        setActiveTab('in-register');
        showToast(`IN Voucher ${savedVoucher.voucherNo} saved successfully in database!`);
      }
    }
  };

  // Count documents
  const totalDocsCount = inVouchers.reduce((acc, v) => acc + (v.attachments ? v.attachments.length : 0), 0);

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onResetData={handleResetData}
        onGlobalSearch={(term) => {
          if (term.trim()) {
            setActiveTab('in-register');
          }
        }}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setPrintingVoucher(null);
            setEditingVoucher(null);
            setActiveTab(tab);
          }}
          inCount={inVouchers.length}
          outCount={outVouchers.length}
          docsCount={totalDocsCount}
        />

        {/* Content Body */}
        <main className="flex-1 h-full p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          
          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="no-print mb-5 p-3.5 bg-emerald-700 text-white rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-2">
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
            /* Printable Voucher View */
            <PrintableVoucher
              voucher={printingVoucher}
              onBack={() => setPrintingVoucher(null)}
              onEdit={() => {
                setEditingVoucher(printingVoucher);
                setPrintingVoucher(null);
                setActiveTab('in-entry');
              }}
            />
          ) : activeTab === 'in-entry' ? (
            /* IN Voucher Entry Form */
            <InVoucherForm
              initialVoucher={editingVoucher}
              currentUser={currentUser}
              onSaveSuccess={handleSaveSuccess}
              onCancel={() => {
                setEditingVoucher(null);
                setActiveTab('in-register');
              }}
            />
          ) : activeTab === 'in-register' ? (
            /* IN Voucher Register */
            <InVoucherRegister
              currentUser={currentUser}
              vouchers={inVouchers}
              onRefresh={refreshData}
              onCreateNew={() => {
                setEditingVoucher(null);
                setActiveTab('in-entry');
              }}
              onEdit={(v) => {
                setEditingVoucher(v);
                setActiveTab('in-entry');
              }}
              onPrint={(v) => {
                setPrintingVoucher(v);
              }}
            />
          ) : activeTab === 'dashboard' ? (
            /* Voucher Desk Dashboard */
            <VoucherDashboard
              inVouchers={inVouchers}
              outVouchers={outVouchers}
              onNavigate={(tab) => {
                if (tab === 'in-entry') {
                  setEditingVoucher(null);
                  setActiveTab('in-entry');
                } else if (tab === 'in-register') {
                  setActiveTab('in-register');
                } else if (tab === 'out-entry') {
                  setActiveTab('out-entry');
                } else if (tab === 'out-register') {
                  setActiveTab('out-register');
                } else if (tab === 'docs') {
                  setActiveTab('docs');
                }
              }}
              onViewVoucher={(v) => setViewingVoucher(v)}
              onPrintVoucher={(v) => setPrintingVoucher(v)}
            />
          ) : activeTab === 'out-entry' ? (
            /* Unified Voucher Entry with OUT(Debit) mode */
            <InVoucherForm
              initialVoucherType="OUT(Debit)"
              currentUser={currentUser}
              onSaveSuccess={handleSaveSuccess}
              onCancel={() => {
                setEditingVoucher(null);
                setActiveTab('out-register');
              }}
            />
          ) : activeTab === 'out-register' ? (
            /* OUT Voucher Register */
            <OutVoucherModule
              initialView="register"
              currentUser={currentUser}
              onCreateNewOut={() => {
                setEditingVoucher(null);
                setActiveTab('out-entry');
              }}
            />
          ) : activeTab === 'docs' ? (
            /* Central Document Register */
            <DocumentRegister
              vouchers={inVouchers}
              onViewVoucher={(v) => {
                setViewingVoucher(v);
              }}
            />
          ) : activeTab === 'accounts' ? (
            /* Chart of Accounts */
            <ChartOfAccountsView />
          ) : activeTab === 'crm-leads' ? (
            /* Clients & Debtors */
            <ClientsView
              inVouchers={inVouchers}
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
          setActiveTab('in-entry');
        }}
      />

    </div>
  );
}
