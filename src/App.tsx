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
import { PdfEditorCanvas } from './components/voucher/PdfEditorCanvas';
import { VoucherDetailsModal } from './components/voucher/VoucherDetailsModal';
import { InVoucher, UserProfile, UserRole, CreditVoucher, DebitVoucher } from './types/voucher';
import { voucherStorage } from './utils/voucherStorage';
import { ConfirmDeleteModal } from './components/voucher/ConfirmDeleteModal';
import { CheckCircle2, X } from 'lucide-react';
import { LoginScreen } from './components/auth/LoginScreen';
import { RolesAccessView } from './components/admin/RolesAccessView';
import { BrandModal } from './components/layout/BrandModal';
import { AccessProvider } from './components/AccessContext';
import {
  CLOUD_CHANGE_EVENT, CLOUD_ERROR_EVENT, CLOUD_STATUS_EVENT, cloudEnabled, signOutCloud, startCloudSession, supabase,
} from './utils/cloudSync';
import {
  AppUser, PermissionKey, accessStore, applySessionProfile, brandStore, ensureSeedUsers, getSessionUser, logout,
} from './utils/accessControl';

export default function App() {
  // Authentication: signed-in account + role permissions
  const [sessionUser, setSessionUser] = useState<AppUser | null>(() => getSessionUser());
  const [permVersion, setPermVersion] = useState(0);
  const [brand, setBrand] = useState(() => brandStore.get());
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [ready, setReady] = useState(false);
  const [cloudAuth, setCloudAuth] = useState<{ status: 'signed-out' | 'denied' | 'error'; email?: string; message?: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'live' | 'connecting' | 'offline' | null>(cloudEnabled ? 'connecting' : null);

  useEffect(() => {
    if (!cloudEnabled) {
      ensureSeedUsers().then(() => {
        setSessionUser(getSessionUser());
        setReady(true);
      });
      return;
    }
    let cancelled = false;
    const boot = async () => {
      const res = await startCloudSession();
      if (cancelled) return;
      if (res.status === 'ok') {
        setSessionUser(res.user);
        setCloudAuth(null);
        refreshData();
        setBrand(brandStore.get());
      } else {
        setSessionUser(null);
        setCloudAuth(res);
      }
      setReady(true);
    };
    boot();
    const { data: sub } = supabase!.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') boot();
      if (event === 'SIGNED_OUT') {
        setSessionUser(null);
        setCloudAuth({ status: 'signed-out' });
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live updates pushed from the cloud (other people's changes, role edits, branding …)
  useEffect(() => {
    if (!cloudEnabled) return;
    const onChange = () => {
      setPermVersion((v) => v + 1);
      refreshData();
      setBrand(brandStore.get());
      const u = getSessionUser();
      if (!u) {
        signOutCloud();
        setSessionUser(null);
        setCloudAuth({ status: 'denied', email: '' });
      } else {
        setSessionUser(u);
      }
    };
    const onError = (e: Event) => showToast(String((e as CustomEvent).detail || 'Cloud sync problem'));
    const onStatus = (e: Event) => setSyncStatus((e as CustomEvent).detail);
    window.addEventListener(CLOUD_CHANGE_EVENT, onChange);
    window.addEventListener(CLOUD_ERROR_EVENT, onError);
    window.addEventListener(CLOUD_STATUS_EVENT, onStatus);
    return () => {
      window.removeEventListener(CLOUD_CHANGE_EVENT, onChange);
      window.removeEventListener(CLOUD_ERROR_EVENT, onError);
      window.removeEventListener(CLOUD_STATUS_EVENT, onStatus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const permissions = React.useMemo(() => accessStore.getPermissions(), [permVersion, sessionUser]);
  const can = React.useCallback(
    (p: PermissionKey) => (sessionUser ? permissions[sessionUser.role]?.includes(p) ?? false : false),
    [permissions, sessionUser]
  );

  const currentUser: UserProfile = sessionUser
    ? { id: sessionUser.id, name: sessionUser.name, role: sessionUser.role, designation: sessionUser.designation, department: sessionUser.department, avatar: sessionUser.avatar || '' }
    : voucherStorage.getCurrentUser();

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

  // Confirmation Modal for Database Reset
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refresh vouchers from storage
  const refreshData = () => {
    setCreditVouchers(voucherStorage.getCreditVouchers());
    setDebitVouchers(voucherStorage.getDebitVouchers());
  };

  const handleLogout = async () => {
    if (cloudEnabled) {
      await signOutCloud();
      setCloudAuth({ status: 'signed-out' });
    }
    logout();
    setSessionUser(null);
    setEditingVoucher(null);
    setPrintingVoucher(null);
    setViewingVoucher(null);
    setActiveTab('dashboard');
  };

  const firstAllowedTab = (): ActiveTab => {
    const order: Array<[ActiveTab, PermissionKey]> = [
      ['dashboard', 'dashboard.view'], ['credit-register', 'in.view'], ['debit-register', 'out.view'],
      ['docs', 'docs.view'], ['pdf-editor', 'pdf.studio'], ['roles', 'roles.manage'],
    ];
    return order.find(([, p]) => can(p))?.[0] || 'dashboard';
  };

  // Reset Demo Data
  const handleResetData = () => {
    setShowResetModal(true);
  };

  const confirmResetData = () => {
    voucherStorage.resetToDefaultData();
    refreshData();
    showToast('Database reset to authentic initial ERP vouchers.');
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

  const TAB_PERMISSION: Record<ActiveTab, PermissionKey> = {
    dashboard: 'dashboard.view',
    'credit-entry': 'in.create',
    'credit-register': 'in.view',
    'debit-entry': 'out.create',
    'debit-register': 'out.view',
    docs: 'docs.view',
    'crm-leads': 'clients.view',
    'pdf-editor': 'pdf.studio',
    roles: 'roles.manage',
  };
  const tabAllowed = can(TAB_PERMISSION[activeTab]);

  // After sign-in (or a permission change) make sure we are on a page this role may open
  useEffect(() => {
    if (sessionUser && !can(TAB_PERMISSION[activeTab])) setActiveTab(firstAllowedTab());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser, permissions]);

  if (!ready) return <div className="min-h-screen bg-slate-950" />;
  if (!sessionUser) {
    return (
      <LoginScreen
        cloud={cloudEnabled ? cloudAuth || { status: 'signed-out' } : undefined}
        onLoggedIn={(u) => {
          applySessionProfile(u);
          setSessionUser(u);
          refreshData();
          setBrand(brandStore.get());
        }}
      />
    );
  }

  return (
    <AccessProvider can={can}>
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        contact={{ email: sessionUser.email, mobile: sessionUser.mobile }}
        brand={brand}
        canEditBrand={can('branding.edit')}
        onEditBrand={() => setShowBrandModal(true)}
        onLogout={handleLogout}
        hideReset={cloudEnabled}
        syncStatus={syncStatus}
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
          can={can}
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
          {!tabAllowed && !printingVoucher ? (
            <div className="mx-auto mt-10 max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <p className="text-lg font-extrabold text-slate-900">No access</p>
              <p className="mt-1 text-sm text-slate-500">Your role ({currentUser.role}) is not allowed to open this page. Ask an Admin to update your permissions.</p>
            </div>
          ) : printingVoucher ? (
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
              onDeleteSuccess={() => {
                refreshData();
                setEditingVoucher(null);
                setActiveTab('credit-register');
                showToast('Credit voucher deleted successfully.');
              }}
              onCancel={() => {
                refreshData();
                setEditingVoucher(null);
                setActiveTab('credit-register');
              }}
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
              onCreateNew={() => {
                setEditingVoucher(null);
                setActiveTab('credit-entry');
              }}
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
              onDeleteSuccess={() => {
                refreshData();
                setEditingVoucher(null);
                setActiveTab('debit-register');
                showToast('Debit voucher deleted successfully.');
              }}
              onCancel={() => {
                refreshData();
                setEditingVoucher(null);
                setActiveTab('debit-register');
              }}
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
              onCreateNew={() => {
                setEditingVoucher(null);
                setActiveTab('debit-entry');
              }}
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
              onNavigate={(tab) => {
                setEditingVoucher(null);
                setActiveTab(tab as any);
              }}
              onViewVoucher={(v) => setViewingVoucher(v)}
              onPrintVoucher={(v) => setPrintingVoucher(v)}
            />
          ) : activeTab === 'pdf-editor' ? (
            <PdfEditorCanvas
              onNotify={(msg) => showToast(msg)}
            />
          ) : activeTab === 'roles' ? (
            <RolesAccessView
              currentUserId={sessionUser.id}
              onPermissionsChanged={() => setPermVersion((v) => v + 1)}
              onNotify={(m) => showToast(m)}
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
        onDelete={(v) => {
          try {
            if (v.voucherType === 'OUT(Debit)') {
              voucherStorage.deleteDebitVoucher(v.id, currentUser);
            } else {
              voucherStorage.deleteCreditVoucher(v.id, currentUser);
            }
            refreshData();
            setViewingVoucher(null);
            showToast(`Voucher ${v.voucherNo} permanently deleted.`);
          } catch (err: any) {
            showToast(`Delete error: ${err.message}`);
          }
        }}
      />

      {showBrandModal && (
        <BrandModal
          brand={brand}
          onClose={() => setShowBrandModal(false)}
          onSave={(b) => {
            brandStore.save(b);
            setBrand(b);
            setShowBrandModal(false);
            showToast('App name & logo updated.');
          }}
        />
      )}

      {/* In-App Confirmation Modal for Database Reset */}
      <ConfirmDeleteModal
        isOpen={showResetModal}
        title="Reset Demo Records"
        message="Are you sure you want to reset the CRM database to default ERP records? Any unsaved custom records will be replaced."
        confirmLabel="Reset Database"
        isDangerous={true}
        onConfirm={confirmResetData}
        onClose={() => setShowResetModal(false)}
      />

    </div>
    </AccessProvider>
  );
}

