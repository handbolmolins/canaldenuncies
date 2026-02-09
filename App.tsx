
import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, FileText, LayoutDashboard, Info, PlusCircle, CheckCircle, ChevronRight, ChevronLeft, Send, Users, Lock, LogOut, X, ShieldAlert, Loader2, Cloud, CloudOff, RefreshCw, Settings, Key } from 'lucide-react';
import emailjs from 'https://esm.sh/@emailjs/browser';
import { Report, ViolenceType, ReporterType, AppSettings } from './types';
import ReportForm from './components/ReportForm';
import Dashboard from './components/Dashboard';
import InfoProtocol from './components/InfoProtocol';
import { sharedStorage } from './services/storageService';
import { analyzeIncident } from './services/geminiService';

const EMAILJS_SERVICE_ID = "service_q9av1w9";
const EMAILJS_TEMPLATE_ID = "template_we1723c";
const EMAILJS_PUBLIC_KEY = "nnpheQb2O-_FCqSRa";

type View = 'home' | 'report' | 'dashboard' | 'info' | 'settings';

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

  // Nova clau per al formulari de canvi de PIN
  const [newPin, setNewPin] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(() => {
      if (isAdmin && currentView === 'dashboard') syncData();
    }, 120000);
    return () => clearInterval(interval);
  }, [isAdmin, currentView]);

  const loadInitialData = async () => {
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
      // Integration: Add AI analysis to the report automatically
      const analysis = await analyzeIncident(newReport.facts.description);
      if (analysis) {
        newReport.aiAnalysis = analysis;
      }

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
        testimonis: newReport.facts.witnesses || 'Cap indicat'
      };

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      await sharedStorage.appendReport(newReport);
      setReports([newReport, ...reports]);
      setIsSending(false);
      setCurrentView('home');
      alert(`Expedient #${newReport.id} enviat i registrat correctament.`);
    } catch (error) {
      setIsSending(false);
      alert("Error en l'enviament. La denúncia s'ha guardat però l'email podria haver fallat.");
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      alert("El PIN ha de tenir almenys 4 caràcters.");
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
      alert("PIN actualitzat correctament al núvol per a tots els administradors.");
      setNewPin("");
      setCurrentView('dashboard');
    } else {
      alert("Error en desar el nou PIN.");
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
            <button onClick={() => setCurrentView('info')} className={`hidden md:flex items-center gap-2 text-sm font-semibold transition-colors ${currentView === 'info' ? 'text-amber-600' : 'text-slate-600 hover:text-slate-900'}`}>
              <Info className="w-4 h-4" /> Protocol
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
            <button onClick={() => setCurrentView('report')} className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md transition-all flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Nova Denúncia
            </button>
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
            <div className="flex justify-center gap-4">
              <button onClick={() => setCurrentView('report')} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl text-lg font-black shadow-xl transition-all hover:-translate-y-1">
                <AlertCircle className="w-6 h-6" /> Informar d'un incident
              </button>
            </div>
          </div>
        )}

        {currentView === 'report' && <ReportForm onCancel={() => setCurrentView('home')} onSubmit={handleAddReport} />}
        
        {currentView === 'dashboard' && isAdmin && (
          <div className="space-y-4">
            <div className="flex justify-end no-print">
              <button onClick={syncData} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900">
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Sincronitzar Ara
              </button>
            </div>
            <Dashboard reports={reports} onDeleteReport={async (id) => {
               const updated = reports.filter(r => r.id !== id);
               setReports(updated);
               await sharedStorage.saveAll(updated);
            }} onUpdateStatus={async (id, status) => {
               const updated = reports.map(r => r.id === id ? { ...r, status } : r);
               setReports(updated);
               await sharedStorage.saveAll(updated);
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

        {currentView === 'info' && <InfoProtocol />}
      </main>

      <footer className="bg-slate-950 text-slate-400 py-8 px-4 mt-auto no-print text-center text-[10px] font-bold uppercase tracking-[0.2em]">
        &copy; {new Date().getFullYear()} Club Handbol Molins de Rei · Sistema de Gestió Compartit
      </footer>
    </div>
  );
};

export default App;
