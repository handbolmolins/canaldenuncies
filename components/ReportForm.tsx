
import React, { useState } from 'react';
import {
  ChevronRight, ChevronLeft, Send, User, MapPin, Calendar,
  FileText, AlertCircle, Eye, EyeOff, Camera,
  Paperclip, Shield, CheckCircle, Clock, UserX, UserCheck, Smartphone, Mail, Hash, X
} from 'lucide-react';
import { ViolenceType, ReporterType, Report } from '../types';
import { storage, auth } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';

interface ReportFormProps {
  onCancel: () => void;
  onSubmit: (report: Report) => void;
  onSaveDraft: (draft: { formData: any; step: number; isAnonymous: boolean; gdprAccepted: boolean }) => void;
  initialDraft: { formData: any; step: number; isAnonymous: boolean; gdprAccepted: boolean } | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const HANDBOL_CATEGORIES = ["Escoleta", "Benjamí", "Aleví", "Infantil", "Cadet", "Juvenil", "Sènior", "Màster", "Altre"];
const ACCUSED_ROLES = ["Entrenador/a", "Delegat/da", "Jugador/a", "Familiar", "Públic", "Staff", "Àrbitre", "Altre"];
const GENDERS = ["Home", "Dona", "Altre", "No especificat"];

const MOLINS_LOCATIONS = [
  "Poliesportiu Municipal de Molins",
  "Pavelló Municipal (La Granja)",
  "Pista Escola Estel",
  "Pista Escola Madorell",
  "Bus / Desplaçament oficial",
  "Pavelló rival (partit fora)",
  "Gimnàs / Vestidors",
  "Zones comunes (bar, passadissos)",
  "Altre"
];

const ReportForm: React.FC<ReportFormProps> = ({ onCancel, onSubmit, onSaveDraft, initialDraft, showToast }) => {
  const [step, setStep] = useState(initialDraft?.step || 1);
  const [isAnonymous, setIsAnonymous] = useState(initialDraft?.isAnonymous || false);
  const [gdprAccepted, setGdprAccepted] = useState(initialDraft?.gdprAccepted || false);
  const [showErrors, setShowErrors] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState(initialDraft?.formData || {
    informant: { name: '', dni: '', email: '', phone: '', type: ReporterType.VICTIMA },
    involved: {
      victimName: '',
      victimAge: '',
      victimGender: 'No especificat' as any,
      victimCategory: '',
      accusedName: '',
      accusedRelation: ''
    },
    facts: {
      date: new Date().toISOString().split('T')[0],
      time: '',
      location: '',
      violenceTypes: [] as ViolenceType[],
      description: '',
      witnesses: '',
      isRecurring: false
    },
    attachments: (initialDraft?.formData?.attachments || []) as string[]
  });

  const handleToggleViolenceType = (type: ViolenceType) => {
    const current = [...formData.facts.violenceTypes];
    const index = current.indexOf(type);
    if (index > -1) current.splice(index, 1);
    else current.push(type);
    setFormData({ ...formData, facts: { ...formData.facts, violenceTypes: current } });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const newAttachments = [...(formData.attachments || [])];

      try {
        console.log(`Processing ${e.target.files.length} local files...`);

        for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];

          // Limit size to ~200KB to avoid EmailJS payload errors
          if (file.size > 200 * 1024) {
            showToast(`El fitxer "${file.name}" és massa gran (màxim 200KB). Si us plau, redueix la mida, passa'l per WhatsApp o fes una captura de pantalla.`, 'error');
            continue;
          }

          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const base64 = await base64Promise;
          newAttachments.push(base64);
          console.log(`File ${file.name} converted to Base64.`);
        }

        setFormData({ ...formData, attachments: newAttachments });
        if (newAttachments.length > (formData.attachments || []).length) {
          showToast("Fitxers preparats per a l'enviament.", "success");
        }
      } catch (error: any) {
        console.error("File processing error:", error);
        showToast("Error en processar els fitxers locals.", 'error');
      } finally {
        setIsUploading(false);
        if (e.target) e.target.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...(formData.attachments || [])];
    newAttachments.splice(index, 1);
    setFormData({ ...formData, attachments: newAttachments });
  };

  const isStepValid = () => {
    if (step === 1) {
      if (isAnonymous) return true;
      return formData.informant.name.length > 2 &&
        formData.informant.email.includes('@') &&
        formData.informant.phone.length >= 9;
    }
    if (step === 2) {
      return formData.involved.victimName.length > 2 &&
        formData.involved.victimCategory !== '' &&
        formData.involved.victimAge !== '';
    }
    if (step === 3) {
      return formData.facts.description.trim().length > 5 &&
        formData.facts.location !== '' &&
        formData.facts.violenceTypes.length > 0;
    }
    if (step === 5) return gdprAccepted;
    return true;
  };

  // Auto-save draft whenever form data changes
  React.useEffect(() => {
    if (step > 1 || isAnonymous || formData.informant.name || formData.involved.victimName || formData.facts.description) {
      onSaveDraft({ formData, step, isAnonymous, gdprAccepted });
    }
  }, [formData, step, isAnonymous, gdprAccepted]);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
      <div className="bg-slate-900 p-8 text-white flex items-center gap-4">
        <div className="h-16 w-16 flex items-center justify-center overflow-hidden">
          <img
            src="https://github.com/handbolmolins/URLimagenes/blob/main/MOLINS%20COLOR.png?raw=true"
            alt="Escut Handbol Molins"
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <h3 className="text-2xl font-black">Comunicació d'Incidents</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Protocol LOPIVI · Club Handbol Molins</p>
        </div>
      </div>

      <div className="p-8 md:p-12">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 max-w-md mx-auto px-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all ${step === s ? 'bg-amber-500 text-white ring-4 ring-amber-100' : step > s ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {step > s ? <CheckCircle className="w-5 h-5 md:w-6 md:h-6" /> : s}
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Informant */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h4 className="text-2xl font-black text-slate-900">1. Identificació de l'informant</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <button onClick={() => setIsAnonymous(false)} className={`p-6 rounded-3xl border-2 transition-all text-left flex items-start gap-4 ${!isAnonymous ? 'border-amber-500 bg-amber-50' : 'border-slate-100 hover:border-slate-200'}`}>
                <UserCheck className="w-6 h-6 text-amber-500" />
                <div><p className="font-bold">Identificada</p><p className="text-xs text-slate-500">Permet un seguiment directe i protecció jurídica.</p></div>
              </button>
              <button onClick={() => setIsAnonymous(true)} className={`p-6 rounded-3xl border-2 transition-all text-left flex items-start gap-4 ${isAnonymous ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:border-slate-200'}`}>
                <EyeOff className="w-6 h-6 text-slate-900" />
                <div><p className="font-bold">Anònima</p><p className="text-xs text-slate-500">No es requeriran dades de contacte personals.</p></div>
              </button>
            </div>
            {!isAnonymous && (
              <div className="space-y-4 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-black uppercase ml-2 ${showErrors && formData.informant.name.length <= 2 ? 'text-red-500' : 'text-slate-400'}`}>Nom i Cognoms {showErrors && formData.informant.name.length <= 2 && '*'}</label>
                    <input type="text" className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-amber-500 ${showErrors && formData.informant.name.length <= 2 ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={formData.informant.name} onChange={(e) => setFormData({ ...formData, informant: { ...formData.informant, name: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">DNI / NIE</label>
                    <input type="text" className="w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-amber-500" value={formData.informant.dni} onChange={(e) => setFormData({ ...formData, informant: { ...formData.informant, dni: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[10px] font-black uppercase ml-2 ${showErrors && !formData.informant.email.includes('@') ? 'text-red-500' : 'text-slate-400'}`}>Correu Electrònic {showErrors && !formData.informant.email.includes('@') && '*'}</label>
                    <input type="email" className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-amber-500 ${showErrors && !formData.informant.email.includes('@') ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={formData.informant.email} onChange={(e) => setFormData({ ...formData, informant: { ...formData.informant, email: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[10px] font-black uppercase ml-2 ${showErrors && formData.informant.phone.length < 9 ? 'text-red-500' : 'text-slate-400'}`}>Telèfon de contacte {showErrors && formData.informant.phone.length < 9 && '*'}</label>
                    <input type="tel" className={`w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-amber-500 ${showErrors && formData.informant.phone.length < 9 ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={formData.informant.phone} onChange={(e) => setFormData({ ...formData, informant: { ...formData.informant, phone: e.target.value } })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Relació amb el club / víctima</label>
                  <select className="w-full p-4 rounded-2xl border bg-white outline-none focus:ring-2 focus:ring-amber-500" value={formData.informant.type} onChange={(e) => setFormData({ ...formData, informant: { ...formData.informant, type: e.target.value as ReporterType } })}>
                    {Object.values(ReporterType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Victim & Accused */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h4 className="text-2xl font-black text-slate-900">2. Persones Implicades</h4>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4 p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                <p className="text-xs font-black uppercase text-blue-600 tracking-widest mb-4">Dades de la Víctima (Menor)</p>
                <div className="space-y-4">
                  <input type="text" placeholder="Nom complet del menor" className={`w-full p-4 rounded-2xl border bg-white ${showErrors && formData.involved.victimName.length <= 2 ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={formData.involved.victimName} onChange={(e) => setFormData({ ...formData, involved: { ...formData.involved, victimName: e.target.value } })} />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Edat" className={`w-full p-4 rounded-2xl border bg-white ${showErrors && formData.involved.victimAge === '' ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={formData.involved.victimAge} onChange={(e) => setFormData({ ...formData, involved: { ...formData.involved, victimAge: e.target.value } })} />
                    <select className="w-full p-4 rounded-2xl border bg-white" value={formData.involved.victimGender} onChange={(e) => setFormData({ ...formData, involved: { ...formData.involved, victimGender: e.target.value as any } })}>
                      <option value="">Gènere...</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <select className={`w-full p-4 rounded-2xl border bg-white ${showErrors && formData.involved.victimCategory === '' ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={formData.involved.victimCategory} onChange={(e) => setFormData({ ...formData, involved: { ...formData.involved, victimCategory: e.target.value } })}>
                    <option value="">Equip / Categoria...</option>
                    {HANDBOL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-4 p-8 bg-red-50/50 rounded-[2rem] border border-red-100">
                <p className="text-xs font-black uppercase text-red-600 tracking-widest mb-4">Persona Denunciada</p>
                <div className="space-y-4">
                  <input type="text" placeholder="Nom (o descripció física)" className="w-full p-4 rounded-2xl border bg-white" value={formData.involved.accusedName} onChange={(e) => setFormData({ ...formData, involved: { ...formData.involved, accusedName: e.target.value } })} />
                  <select className="w-full p-4 rounded-2xl border bg-white" value={formData.involved.accusedRelation} onChange={(e) => setFormData({ ...formData, involved: { ...formData.involved, accusedRelation: e.target.value } })}>
                    <option value="">Rol al club / Relació...</option>
                    {ACCUSED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: The Facts */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h4 className="text-2xl font-black text-slate-900">3. Detalls de l'Incident</h4>

            <div className="space-y-4">
              <label className={`text-sm font-bold block mb-2 ${showErrors && formData.facts.violenceTypes.length === 0 ? 'text-red-500' : 'text-slate-700'}`}>
                Tipus de violència detectada (marcar totes les que corresponguin):
                {showErrors && formData.facts.violenceTypes.length === 0 && <span className="text-red-500 text-xs ml-2">(Obligatori)</span>}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.values(ViolenceType).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleToggleViolenceType(type)}
                    className={`p-2 md:p-3 rounded-xl text-[9px] md:text-[10px] font-bold text-center border-2 transition-all min-h-[4rem] flex items-center justify-center leading-tight ${formData.facts.violenceTypes.includes(type)
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : showErrors && formData.facts.violenceTypes.length === 0
                        ? 'border-red-300 bg-red-50 text-red-700 hover:border-red-400'
                        : 'border-slate-100 text-slate-500 hover:border-slate-200'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Data</label>
                <input type="date" className="w-full p-4 rounded-2xl border bg-white" value={formData.facts.date} onChange={(e) => setFormData({ ...formData, facts: { ...formData.facts, date: e.target.value } })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Hora aproximada</label>
                <input type="time" className="w-full p-4 rounded-2xl border bg-white" value={formData.facts.time} onChange={(e) => setFormData({ ...formData, facts: { ...formData.facts, time: e.target.value } })} />
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-black uppercase ml-2 ${showErrors && !formData.facts.location ? 'text-red-500' : 'text-slate-400'}`}>Ubicació {showErrors && !formData.facts.location && '*'}</label>
                <select className={`w-full p-4 rounded-2xl border bg-white ${showErrors && !formData.facts.location ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={formData.facts.location} onChange={(e) => setFormData({ ...formData, facts: { ...formData.facts, location: e.target.value } })}>
                  <option value="">Selecciona lloc...</option>
                  {MOLINS_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <textarea placeholder="Descriu els fets amb el màxim detall possible (què ha passat, com ha passat...)" className={`w-full p-6 rounded-[2rem] border h-44 outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed ${showErrors && formData.facts.description.trim().length <= 5 ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={formData.facts.description} onChange={(e) => setFormData({ ...formData, facts: { ...formData.facts, description: e.target.value } })} />

              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer border border-slate-200">
                <input type="checkbox" checked={formData.facts.isRecurring} onChange={(e) => setFormData({ ...formData, facts: { ...formData.facts, isRecurring: e.target.checked } })} className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                <span className="text-sm font-bold text-slate-700 italic">És un fet que es repeteix en el temps (recurrent)?</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Evidence & Witnesses */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h4 className="text-2xl font-black text-slate-900">4. Proves i Testimonis</h4>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-700">Evidències Digitals o Documentals</p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-12 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 hover:border-amber-200 transition-colors group cursor-pointer relative"
                >
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  />
                  {isUploading ? (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-[2.5rem]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-slate-50 rounded-full text-slate-400 group-hover:text-amber-500 group-hover:bg-amber-50 transition-colors">
                        <Camera className="w-10 h-10" />
                      </div>
                      <p className="text-xs font-bold text-slate-400 group-hover:text-slate-600">Fes una foto o adjunta fitxers (àudios, captures, etc.)</p>
                    </>
                  )}
                </div>

                {formData.attachments && formData.attachments.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase">Fitxers adjunts ({formData.attachments.length})</p>
                    <div className="grid gap-2">
                      {formData.attachments.map((url, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">Document {idx + 1}</span>
                          </div>
                          <button onClick={() => removeAttachment(idx)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-700">Testimonis</p>
                <textarea placeholder="Si algú més ha vist els fets, indica el seu nom o com el podem identificar..." className="w-full p-6 rounded-[2rem] border h-44 outline-none focus:ring-2 focus:ring-amber-500" value={formData.facts.witnesses} onChange={(e) => setFormData({ ...formData, facts: { ...formData.facts, witnesses: e.target.value } })} />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Consent */}
        {step === 5 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h4 className="text-2xl font-black text-slate-900">5. Consentiment i Enviament</h4>
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1"><AlertCircle className="w-6 h-6 text-amber-500" /></div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  En prémer "Enviar", la teva comunicació serà enviada al **Delegat de Protecció de Menors del CH Molins**. Tota la informació serà tractada amb la màxima confidencialitat segons la **Llei Orgànica 8/2021 (LOPIVI)**.
                </p>
              </div>

              <label className={`flex items-center gap-4 p-6 bg-white rounded-3xl cursor-pointer shadow-sm hover:shadow-md transition-shadow ${showErrors && !gdprAccepted ? 'border-2 border-red-500' : ''}`}>
                <input type="checkbox" checked={gdprAccepted} onChange={(e) => setGdprAccepted(e.target.checked)} className="w-6 h-6 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Accepto el tractament de dades personals per a la gestió d'aquest expedient.</span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100 gap-2">
          <button onClick={() => step === 1 ? onCancel() : setStep(step - 1)} className="px-3 md:px-6 py-4 text-slate-400 font-black uppercase text-[9px] md:text-[10px] tracking-widest flex items-center gap-1 md:gap-2 hover:text-slate-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> {step === 1 ? 'Cancel·lar' : (
              <span className="truncate">Tornar</span>
            )}
          </button>

          <button
            onClick={() => {
              if (isStepValid()) {
                setShowErrors(false);
                if (step === 5) {
                  onSubmit({
                    id: Math.random().toString(36).substr(2, 6).toUpperCase(),
                    createdAt: new Date().toISOString(),
                    informant: { ...formData.informant, isAnonymous },
                    victim: {
                      name: formData.involved.victimName,
                      age: formData.involved.victimAge,
                      gender: formData.involved.victimGender,
                      category: formData.involved.victimCategory,
                      entity: 'CH Molins'
                    },
                    involved: { accusedName: formData.involved.accusedName, accusedRelation: formData.involved.accusedRelation },
                    facts: { ...formData.facts, violenceType: formData.facts.violenceTypes },
                    attachments: formData.attachments || [],
                    status: 'Pendent',
                    gdprAccepted: true
                  });
                } else {
                  setStep(step + 1);
                }
              } else {
                setShowErrors(true);
              }
            }}
            disabled={!isStepValid() || isUploading}
            className={`px-6 md:px-12 py-4 md:py-5 rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${isStepValid() && !isUploading ? 'bg-amber-500 text-white shadow-xl shadow-amber-100 hover:-translate-y-1 hover:bg-amber-600' : 'bg-slate-200 text-slate-400 hover:bg-slate-300 cursor-not-allowed hidden-while-loading'}`}
          >
            {isUploading ? 'Pujant...' : (step === 5 ? 'Enviar ara' : 'Següent pas')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;
