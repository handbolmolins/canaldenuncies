
import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, FileText, LayoutDashboard, Info, PlusCircle, CheckCircle, ChevronRight, ChevronLeft, Send, Users, Lock, LogOut, X, ShieldAlert, Loader2, Cloud, CloudOff, RefreshCw, Settings, Key, Smartphone, Search, Clock } from 'lucide-react';
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

type View = 'home' | 'report' | 'dashboard' | 'info' | 'settings' | 'submitted' | 'tracking';

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
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
  const [trackedReport, setTrackedReport] = useState<Report | null>(null);
  const [isSearchingReport, setIsSearchingReport] = useState(false);
  const [trackerInput, setTrackerInput] = useState("");

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
    const remoteSettings = await sharedStorage.fetchSettings();
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

  const handleAdminAccess = async () => {
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
      setLastSubmittedId(newReport.id);
      setCurrentView('submitted');
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

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentPin = appSettings?.adminPin || "handbolmolins1944";
    if (pinInput === currentPin) {
      setIsAdmin(true);
      setShowAdminLogin(false);

      // Load reports after admin login
      setCloudStatus('syncing');
      try {
        const remoteReports = await sharedStorage.fetchAll();
        setReports(remoteReports);
        setCloudStatus('connected');
      } catch (e) {
        setCloudStatus('error');
      }

      setCurrentView('dashboard');
      setLoginError(false);
      setPinInput("");
    } else {
      setLoginError(true);
      setPinInput("");
    }
  };

  const handleSearchReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trackerInput.length < 4) {
      showToast("Introdueix un codi d'expedient vàlid.", 'error');
      return;
    }
    setIsSearchingReport(true);
    try {
      const report = await sharedStorage.fetchReportById(trackerInput.toUpperCase());
      if (report) {
        setTrackedReport(report);
      } else {
        showToast("No s'ha trobat cap expedient amb aquest codi.", 'error');
      }
    } catch (error) {
      showToast("Error en cercar l'expedient.", 'error');
    } finally {
      setIsSearchingReport(false);
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
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  <a href="Protocol_LOPIVI_Club_Handbol_Molins.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">Protocol LOPIVI</a> · CH Molins
                </p>
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
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 relative">Protegir és responsabilitat de tots.</h2>
            </div>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">Canal de denúncia segur i confidencial per a la protecció integral a la infància i adolescència.</p>
            <div className="flex flex-col items-center gap-4">
              <button onClick={() => { setCurrentView('report'); setDraftReport(null); }} className="bg-amber-500 hover:bg-amber-600 text-white px-6 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-black shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-3 w-full max-w-xs md:w-auto">
                <PlusCircle className="w-6 h-6" /> Nova Denúncia
              </button>

              <button onClick={() => { setCurrentView('tracking'); setTrackedReport(null); setTrackerInput(""); }} className="bg-white border-2 border-slate-200 text-slate-600 px-6 md:px-10 py-3 md:py-4 rounded-2xl text-sm md:text-base font-bold shadow-sm transition-all hover:border-amber-500 hover:text-amber-600 flex items-center justify-center gap-2 w-full max-w-xs md:w-auto">
                <Search className="w-5 h-5" /> Consultar estat de denúncia
              </button>

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
            }} onUpdateObservations={async (id, observations) => {
              const updated = reports.map(r => r.id === id ? { ...r, observations } : r);
              const success = await sharedStorage.saveAll(updated);
              if (success) {
                setReports(updated);
                showToast("Observacions actualitzades.", "success");
              } else {
                showToast("Error a l'actualitzar les observacions.", "error");
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

        {currentView === 'submitted' && (
          <div className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Denúncia enviada satisfactòriament</h2>
              <p className="text-slate-500 font-medium">L'expedient ha estat registrat i el comitè de protecció ha estat notificat.</p>
            </div>

            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[2.5rem] space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">El teu codi de seguiment</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">#{lastSubmittedId}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(lastSubmittedId || "");
                    showToast("Codi copiat al porta-retalls", "success");
                  }}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                  title="Copiar codi"
                >
                  <RefreshCw className="w-6 h-6" />
                </button>
              </div>
              <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto">Guarda aquest codi per poder consultar l'estat de la teva denúncia en qualsevol moment.</p>
            </div>

            <div className="pt-8">
              <button
                onClick={() => setCurrentView('home')}
                className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all"
              >
                Tornar a l'Inici
              </button>
            </div>
          </div>
        )}

        {currentView === 'tracking' && (
          <div className="max-w-2xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-[2.5rem] border shadow-2xl p-8 md:p-12 space-y-8">
              <div className="text-center space-y-2">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mx-auto mb-4"><Search className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black text-slate-900">Seguiment de Denúncia</h3>
                <p className="text-slate-500 text-sm font-medium">Introdueix el codi de 6 digits per veure l'estat actual.</p>
              </div>

              {!trackedReport ? (
                <form onSubmit={handleSearchReport} className="space-y-6">
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">#</span>
                    <input
                      type="text"
                      value={trackerInput}
                      onChange={(e) => setTrackerInput(e.target.value.toUpperCase())}
                      placeholder="XXXXXX"
                      maxLength={6}
                      className="w-full pl-12 pr-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-3xl font-black tracking-widest outline-none focus:border-amber-500 transition-all text-center uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingReport}
                    className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSearchingReport ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Search className="w-5 h-5" /> Consultar Estat</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('home')}
                    className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest pt-2"
                  >
                    Cancel·lar
                  </button>
                </form>
              ) : (
                <div className="space-y-8 animate-in fade-in zoom-in-95">
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expedient</p>
                        <p className="text-2xl font-black text-slate-900">#{trackedReport.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Inici</p>
                        <p className="text-sm font-bold text-slate-700">{new Date(trackedReport.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Estat Actual</p>
                      <div className="flex items-center gap-4">
                        <div className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm ${trackedReport.status === 'Resolt' ? 'bg-green-500 text-white' :
                          trackedReport.status === 'En Procés' ? 'bg-amber-500 text-white' :
                            trackedReport.status === 'Urgència' ? 'bg-red-600 text-white' :
                              'bg-slate-200 text-slate-600'
                          }`}>
                          {trackedReport.status}
                        </div>
                        {trackedReport.status === 'Pendent' && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-[10px] font-bold italic">En espera de revisió</span>
                          </div>
                        )}
                        {trackedReport.status === 'En Procés' && (
                          <div className="flex items-center gap-2 text-amber-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-[10px] font-bold italic">S'està gestionant</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {trackedReport.observations && (
                      <div className="pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resposta del Comitè</p>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 text-sm md:text-base leading-relaxed text-slate-700 italic shadow-sm">
                          "{trackedReport.observations}"
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resum de la Denúncia</p>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                            {trackedReport.victim.category}
                          </span>
                          {trackedReport.facts.violenceType.map((v, i) => (
                            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                              {v}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {trackedReport.facts.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => setTrackedReport(null)}
                      className="w-full py-5 border-2 border-slate-100 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      Cercar un altre codi
                    </button>
                    <button
                      onClick={() => setCurrentView('home')}
                      className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest"
                    >
                      Tornar a l'Inici
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-950 text-slate-400 py-8 px-4 mt-auto no-print text-center text-[10px] font-bold uppercase tracking-[0.2em]">
        &copy; {new Date().getFullYear()} Club Handbol Molins
      </footer>

      {deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="fixed bottom-6 right-6 z-[200] bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 transition-all hover:scale-110 active:scale-95 flex items-center justify-center group"
          title="Instal·lar Aplicació"
        >
          <Smartphone className="w-5 h-5 md:w-6 md:h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
            Instal·lar App
          </span>
        </button>
      )}

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
