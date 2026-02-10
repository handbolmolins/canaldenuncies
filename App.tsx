
import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, FileText, LayoutDashboard, Info, PlusCircle, CheckCircle, ChevronRight, ChevronLeft, Send, Users, Lock, LogOut, X, ShieldAlert, Loader2, Cloud, CloudOff, RefreshCw, Settings, Key, Smartphone } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { Report, ViolenceType, ReporterType, AppSettings } from './types';
import ReportForm from './components/ReportForm';
import Dashboard from './components/Dashboard';
import InfoProtocol from './components/InfoProtocol';
import Toast from './components/Toast';
import { signInAnonymously } from 'firebase/auth';
import { sharedStorage } from './services/storageService';
import { analyzeIncident } from './services/geminiService';
import { auth } from './services/firebase';

const EMAILJS_SERVICE_ID = "service_q9av1w9";
const EMAILJS_TEMPLATE_ID = "template_we1723c";
const EMAILJS_PUBLIC_KEY = "nnpheQb2O-_FCqSRa";

type View = 'home' | 'report' | 'dashboard' | 'info' | 'settings';

interface DraftReport {
  formData: any;
  step: number;
  isAnonymous: boolean;
  gdprAccepted: boolean;
}

const LOGO_URL = "https://github.com/handbolmolins/URLimagenes/blob/main/MOLINS%20COLOR.png?raw=true";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'error' | 'syncing'>('connected');
  const [draftReport, setDraftReport] = useState<DraftReport | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Nova clau per al formulari de canvi de PIN
  const [newPin, setNewPin] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(() => {
      if (isAdmin && currentView === 'dashboard') syncData();
    }, 120000);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isAdmin, currentView]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
  };

  const loadInitialData = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Anonymous auth failed", error);
    }
    setCloudStatus('syncing');
    const [remoteReports, remoteSettings] = await Promise.all([
      sharedStorage.fetchAll(),
      sharedStorage.fetchSettings()
    ]);
    setReports(remoteReports);
    setAppSettings(remoteSettings);
    setCloudStatus('connected');
  };

  const syncData = async () => {
    setIsSyncing(true);
    setCloudStatus('syncing');
    try {
      const remoteReports = await sharedStorage.fetchAll();
      setReports(remoteReports);
      setCloudStatus('connected');
    } catch (e) {
      setCloudStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Fix: Added missing handleAdminAccess function to fix line 163 error
  const handleAdminAccess = () => {
    if (isAdmin) {
      setCurrentView('dashboard');
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleAddReport = async (newReport: Report) => {
    setIsSending(true);
    try {
      const templateParams = {
        from_name: "CANAL DE DENÚNCIES - CH MOLINS",
        expedient_id: newReport.id,
        data_hora: new Date(newReport.createdAt).toLocaleString(),
        informant_nom: newReport.informant.isAnonymous ? 'ANÒNIM' : newReport.informant.name,
        informant_dni: newReport.informant.dni || 'N/A',
        informant_contacte: `${newReport.informant.email || 'N/A'} / ${newReport.informant.phone || 'N/A'}`,
        victima_nom: newReport.victim.name,
        victima_edat: newReport.victim.age,
        victima_genere: newReport.victim.gender,
        victima_categoria: newReport.victim.category,
        denunciat_nom: newReport.involved.accusedName || 'No identificat',
        denunciat_rol: newReport.involved.accusedRelation || 'No especificat',
        lloc: newReport.facts.location,
        tipus_violencia: newReport.facts.violenceType.join(', '),
        recurrent: newReport.facts.isRecurring ? 'SÍ' : 'NO',
        descripcio: newReport.facts.description,
        testimonis: newReport.facts.witnesses || 'Cap indicat',
        fitxers_adjunts: (newReport.attachments && newReport.attachments.length > 0)
          ? newReport.attachments.map((url, i) => `[Fitxer ${i + 1}]: ${url}`).join('\n')
          : 'Cap fitxer adjunt'
      };

      console.log("DEBUG - Paràmetres EmailJS:", templateParams);

      // 1. Save to Firestore immediately
      await sharedStorage.appendReport(newReport);

      // Update local state immediately
      setReports(prev => {
        if (prev.find(r => r.id === newReport.id)) return prev;
        return [newReport, ...prev];
      });

      // 2. Attempt to send Email
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      } catch (emailError) {
        console.error("EmailJS Error:", emailError);
        showToast(`La denúncia s'ha guardat (Expedient #${newReport.id}), però hi ha hagut un problema enviant la notificació per email.`, 'info');
      }

      setIsSending(false);
      setDraftReport(null);
      setCurrentView('home');
      showToast(`Expedient #${newReport.id} enviat i registrat correctament.`, 'success');
    } catch (error) {
      console.error("Submission Error:", error);
      setIsSending(false);
      showToast("Error crític en registrar la denúncia. Si us plau, verifica la teva connexió.", 'error');
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      showToast("El PIN ha de tenir almenys 4 caràcters.", 'error');
      return;
    }
    setIsSavingPin(true);
    const updatedSettings = {
      adminPin: newPin,
      lastUpdated: new Date().toISOString()
    };
    const success = await sharedStorage.saveSettings(updatedSettings);
    if (success) {
      setAppSettings(updatedSettings);
      showToast("PIN actualitzat correctament al núvol per a tots els administradors.", 'success');
      setNewPin("");
      setCurrentView('dashboard');
    } else {
      showToast("Error en desar el nou PIN.", 'error');
    }
    setIsSavingPin(false);
  };

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPin = appSettings?.adminPin || "handbolmolins1944";
    if (pinInput === currentPin) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setCurrentView('dashboard');
      setLoginError(false);
      setPinInput("");
    } else {
      setLoginError(true);
      setPinInput("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('home')}>
            <div className="h-14 w-14 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
              <img src={LOGO_URL} alt="Logo Handbol Molins" className="h-full w-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-black text-slate-900 leading-tight text-xl tracking-tight uppercase">Canal de Denúncies</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Protocol LOPIVI · CH Molins</p>
                {cloudStatus === 'connected' && <Cloud className="w-3 h-3 text-green-500" />}
                {cloudStatus === 'syncing' && <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />}
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-4 md:gap-6">
            <button onClick={() => setCurrentView('info')} className={`flex items-center gap-2 text-sm font-semibold transition-colors ${currentView === 'info' ? 'text-amber-600' : 'text-slate-600 hover:text-slate-900'}`}>
              <Info className="w-4 h-4" /> <span className="hidden md:inline">Protocol</span>
            </button>
            <button onClick={handleAdminAccess} className={`flex items-center gap-2 text-sm font-semibold transition-colors ${currentView === 'dashboard' || currentView === 'settings' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}>
              {isAdmin ? <LayoutDashboard className="w-4 h-4" /> : <Lock className="w-4 h-4" />} Gestió
            </button>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentView('settings')} className={`p-2 rounded-lg transition-colors ${currentView === 'settings' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>
                  <Settings className="w-5 h-5" />
                </button>
                <button onClick={() => { setIsAdmin(false); setCurrentView('home'); }} className="text-red-500 p-2"><LogOut className="w-5 h-5" /></button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="text-center mb-8">
              <ShieldAlert className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black">Accés Administrador</h3>
              <p className="text-slate-500 text-sm">Introdueix la clau compartida del club.</p>
            </div>
            <form onSubmit={submitLogin} className="space-y-6">
              <input
                type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="Clau d'accés"
                className={`w-full text-center text-2xl p-4 bg-slate-50 border-2 rounded-2xl outline-none ${loginError ? 'border-red-500 animate-shake' : 'border-slate-200 focus:border-blue-500'}`}
              />
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl">Accedir al Sistema</button>
              <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Tornar</button>
            </form>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {currentView === 'home' && (
          <div className="text-center space-y-8 py-12">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-10 rounded-full"></div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 relative text-shadow">Protegir és responsabilitat de tots.</h2>
            </div>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed text-shadow">Canal de denúncia segur i confidencial per a la protecció integral a la infància i adolescència.</p>
            <div className="flex flex-col items-center gap-4">
              <button onClick={() => { setCurrentView('report'); setDraftReport(null); }} className="bg-amber-500 hover:bg-amber-600 text-white px-6 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-black shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-3 w-full max-w-xs md:w-auto">
                <PlusCircle className="w-6 h-6" /> Nova Denúncia
              </button>
              {deferredPrompt && (
                <button onClick={handleInstallClick} className="bg-slate-900 hover:bg-slate-800 text-white px-6 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-black shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-3 w-full max-w-xs md:w-auto mt-2">
                  <Smartphone className="w-6 h-6" /> Instal·lar Aplicació
                </button>
              )}
              {draftReport && (
                <button onClick={() => setCurrentView('report')} className="bg-blue-500 hover:bg-blue-600 text-white px-4 md:px-8 py-3 md:py-4 rounded-2xl text-sm md:text-base font-bold shadow-lg transition-all hover:-translate-y-1 flex items-center justify-center gap-2 w-full max-w-xs md:w-auto">
                  <FileText className="w-5 h-5" /> Continuar denúncia incompleta
                </button>
              )}
            </div>
          </div>
        )}

        {currentView === 'report' && (
          <ReportForm
            onCancel={() => { setDraftReport(null); setCurrentView('home'); }}
            onSubmit={handleAddReport}
            onSaveDraft={(draft) => setDraftReport(draft)}
            initialDraft={draftReport}
            showToast={showToast}
          />
        )}

        {currentView === 'dashboard' && isAdmin && (
          <div className="space-y-4">
            <div className="flex justify-end no-print">
              <button onClick={syncData} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900">
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Sincronitzar Ara
              </button>
            </div>
            <Dashboard reports={reports} onDeleteReport={async (id) => {
              const success = await sharedStorage.deleteReport(id);
              if (success) {
                setReports(reports.filter(r => r.id !== id));
              } else {
                showToast("Error al eliminar l'expedient del servidor.", 'error');
              }
            }} onUpdateStatus={async (id, status) => {
              const updated = reports.map(r => r.id === id ? { ...r, status } : r);
              const success = await sharedStorage.saveAll(updated);
              if (success) {
                setReports(updated);
              } else {
                showToast("Error a l'actualitzar l'estat al servidor.", 'error');
              }
            }} />
          </div>
        )}

        {currentView === 'settings' && isAdmin && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-[2.5rem] p-12 border shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Key className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Configuració del Sistema</h3>
                  <p className="text-slate-500 text-sm">Canvia la clau d'accés compartida del club.</p>
                </div>
              </div>

              <form onSubmit={handleUpdatePin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nova Clau d'Accés</label>
                  <input
                    type="text"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Escriu la nova clau..."
                    className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-400 italic px-2">Aquest canvi afectarà a tots els administradors en temps real.</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentView('dashboard')}
                    className="flex-1 py-4 border rounded-2xl font-bold text-slate-500"
                  >
                    Cancel·lar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPin}
                    className="flex-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                  >
                    {isSavingPin ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Actualitzar Clau'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentView === 'info' && (
          <div className="space-y-4">
            {draftReport && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0" />
                  <p className="text-xs md:text-sm font-bold text-blue-900">Tens una denúncia incompleta guardada</p>
                </div>
                <button
                  onClick={() => setCurrentView('report')}
                  className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
                >
                  <ChevronLeft className="w-4 h-4" /> Tornar a la denúncia
                </button>
              </div>
            )}
            <InfoProtocol />
          </div>
        )}
      </main>

      <footer className="bg-slate-950 text-slate-400 py-8 px-4 mt-auto no-print text-center text-[10px] font-bold uppercase tracking-[0.2em]">
        &copy; {new Date().getFullYear()} Club Handbol Molins
      </footer>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default App;
