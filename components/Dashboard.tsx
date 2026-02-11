
import React, { useState } from 'react';
import { Report } from '../types';
import { Clock, Shield, AlertTriangle, CheckCircle, FileText, Filter, Search, X, Printer, Trash2, User, MapPin, ExternalLink, EyeOff, Calendar, AlertCircle, Mail, Smartphone, Paperclip } from 'lucide-react';

interface DashboardProps {
  reports: Report[];
  onDeleteReport: (id: string) => void;
  onUpdateStatus: (id: string, status: Report['status']) => void;
  onUpdateObservations: (id: string, observations: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ reports, onDeleteReport, onUpdateStatus, onUpdateObservations }) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingObservations, setEditingObservations] = useState("");
  const [isSavingObs, setIsSavingObs] = useState(false);

  const selectedReport = reports.find(r => r.id === selectedReportId) || null;

  const getStatusStyles = (status: Report['status']) => {
    switch (status) {
      case 'Urgència': return 'bg-red-600 text-white';
      case 'Resolt': return 'bg-green-600 text-white';
      case 'En Procés': return 'bg-amber-400 text-amber-900';
      case 'Pendent': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };


  const stats = [
    { label: 'Total Expedients', val: reports.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Urgència', val: reports.filter(r => r.status === 'Urgència').length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Pendents', val: reports.filter(r => r.status === 'Pendent').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Resolts', val: reports.filter(r => r.status === 'Resolt').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const handlePrint = () => {
    if (selectedReport) {
      window.print();
    }
  };

  const handleDelete = () => {
    if (selectedReport) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (selectedReport) {
      onDeleteReport(selectedReport.id);
      setSelectedReportId(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleStatusChange = (newStatus: Report['status']) => {
    if (selectedReport) {
      onUpdateStatus(selectedReport.id, newStatus);
      setShowStatusMenu(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Gestió de Denúncies</h2>
          <p className="text-sm md:text-base text-slate-500">Accés exclusiu per al Delegat de Protecció.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-white border p-2 rounded-xl flex items-center gap-2 flex-1 md:flex-initial">
            <Search className="w-4 h-4" />
            <input type="text" placeholder="Cercar..." className="outline-none text-sm flex-1" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 no-print">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center gap-3 md:gap-4">
            <div className={`${s.bg} p-2 md:p-3 rounded-xl`}><s.icon className={`w-5 h-5 md:w-6 md:h-6 ${s.color}`} /></div>
            <div className="text-center md:text-left"><p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">{s.label}</p><p className="text-xl md:text-2xl font-black">{s.val}</p></div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-3xl border shadow-sm overflow-hidden no-print">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-6 text-[10px] font-black uppercase">Expedient</th>
              <th className="p-6 text-[10px] font-black uppercase">Víctima</th>
              <th className="p-6 text-[10px] font-black uppercase">Data</th>
              <th className="p-6 text-[10px] font-black uppercase">Estat</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reports.map(r => (
              <tr key={r.id} onClick={() => setSelectedReportId(r.id)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                <td className="p-6 font-bold text-sm">#{r.id}</td>
                <td className="p-6">
                  <p className="text-sm font-bold">{r.victim.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{r.victim.category}</p>
                </td>
                <td className="p-6 text-sm text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusStyles(r.status)}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-400 italic font-medium">No hi ha expedients registrats.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 no-print">
        {reports.map(r => (
          <div
            key={r.id}
            onClick={() => setSelectedReportId(r.id)}
            className="bg-white rounded-2xl border shadow-sm p-4 active:bg-slate-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-black text-sm text-slate-900">#{r.id}</p>
                <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getStatusStyles(r.status)}`}>
                {r.status}
              </span>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm font-bold text-slate-900">{r.victim.name}</p>
              <p className="text-[10px] text-slate-400 uppercase mt-1">{r.victim.category}</p>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div className="bg-white rounded-2xl border p-12 text-center text-slate-400 italic font-medium">
            No hi ha expedients registrats.
          </div>
        )}
      </div>

      {selectedReport && (
        <>
          <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm no-print"></div>
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-2 md:p-4 print:p-0">
            <div id="print-area" className="bg-white w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] rounded-2xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col print:max-h-none print:h-auto print:shadow-none print:rounded-none">
              <div className="p-4 md:p-8 bg-slate-50 border-b flex justify-between items-center no-print">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><FileText className="w-5 h-5 md:w-6 md:h-6" /></div>
                  <div>
                    <h3 className="text-base md:text-xl font-bold">Expedient #{selectedReport.id}</h3>
                    <p className="text-[10px] md:text-xs text-slate-500">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedReportId(null); setEditingObservations(""); }} className="p-2 hover:bg-slate-200 rounded-full">
                  <X className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-6 md:space-y-8">
                {/* Header for print */}
                <div className="hidden print:block mb-8 text-center border-b pb-6">
                  <h1 className="text-2xl font-black text-slate-900">CANAL DE DENÚNCIES - CH MOLINS</h1>
                  <p className="text-sm text-slate-600 mt-2">Protocol LOPIVI · Expedient #{selectedReport.id}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(selectedReport.createdAt).toLocaleString('ca-ES')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-amber-500 pl-3 print:text-black print:border-black">Informació de la Víctima</h4>
                    <div className="bg-slate-50 p-6 rounded-3xl space-y-3 border border-slate-100 print:bg-white print:border-slate-300">
                      <p className="text-lg font-bold text-slate-900">{selectedReport.victim.name}</p>
                      <p className="text-sm text-slate-600">Edat: {selectedReport.victim.age} · Gènere: {selectedReport.victim.gender}</p>
                      <p className="text-sm font-bold text-blue-600 uppercase tracking-tight print:text-slate-900">{selectedReport.victim.category}</p>
                    </div>

                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-amber-500 pl-3 print:text-black print:border-black">Informant</h4>
                    <div className="bg-slate-50 p-6 rounded-3xl space-y-2 border border-slate-100 print:bg-white print:border-slate-300">
                      <p className="text-sm font-bold text-slate-900">{selectedReport.informant.isAnonymous ? 'USUARI ANÒNIM' : selectedReport.informant.name}</p>
                      <p className="text-xs text-slate-500">{selectedReport.informant.type}</p>
                      {!selectedReport.informant.isAnonymous && (
                        <div className="text-xs text-slate-600 mt-2 space-y-1">
                          <p>Email: {selectedReport.informant.email || 'N/A'}</p>
                          <p>Telèfon: {selectedReport.informant.phone || 'N/A'}</p>
                          <p>DNI: {selectedReport.informant.dni || 'N/A'}</p>
                        </div>
                      )}
                      {selectedReport.requestMeeting && (
                        <div className="mt-4 p-4 bg-amber-100 border-2 border-amber-200 rounded-2xl flex items-start gap-3 animate-pulse">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                          <p className="text-xs font-black text-amber-900 leading-tight uppercase tracking-tight">
                            L'informant ha sol·licitat una reunió presencial amb l’organització.
                          </p>
                        </div>
                      )}
                    </div>

                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-amber-500 pl-3 print:text-black print:border-black">Persona Denunciada</h4>
                    <div className="bg-slate-50 p-6 rounded-3xl space-y-2 border border-slate-100 print:bg-white print:border-slate-300">
                      <p className="text-sm font-bold text-slate-900">{selectedReport.involved.accusedName || 'No identificat'}</p>
                      <p className="text-xs text-slate-500">{selectedReport.involved.accusedRelation || 'No especificat'}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-amber-500 pl-3 print:text-black print:border-black">Detalls dels Fets</h4>
                    <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100 print:bg-white print:border-slate-300">
                      <p className="text-sm font-medium leading-relaxed text-slate-700">{selectedReport.facts.description}</p>
                      <div className="pt-4 border-t border-slate-200 space-y-3 text-xs">
                        <div>
                          <p className="font-bold text-slate-400 uppercase mb-1 print:text-black">Lloc de l'incident</p>
                          <p className="text-slate-800">{selectedReport.facts.location}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-400 uppercase mb-1 print:text-black">Data i Hora</p>
                          <p className="text-slate-800">{selectedReport.facts.date} - {selectedReport.facts.time || 'No especificada'}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-400 uppercase mb-1 print:text-black">Tipus de Violència</p>
                          <p className="text-slate-800">{selectedReport.facts.violenceType.join(', ')}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-400 uppercase mb-1 print:text-black">És Recurrent?</p>
                          <p className="text-slate-800">{selectedReport.facts.isRecurring ? 'Sí' : 'No'}</p>
                        </div>
                        {selectedReport.facts.witnesses && (
                          <div>
                            <p className="font-bold text-slate-400 uppercase mb-1 print:text-black">Testimonis</p>
                            <p className="text-slate-800">{selectedReport.facts.witnesses}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-amber-500 pl-3 print:text-black print:border-black">Estat de l'Expedient</h4>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 print:bg-white print:border-slate-300">
                      <span className={`px-4 py-2 rounded-full text-xs font-black uppercase ${getStatusStyles(selectedReport.status)}`}>
                        {selectedReport.status}
                      </span>
                    </div>

                    {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                      <>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-amber-500 pl-3 print:text-black print:border-black">Arxius Adjunts</h4>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2 print:bg-white print:border-slate-300">
                          {selectedReport.attachments.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors group"
                            >
                              <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                              <span>Document {idx + 1}</span>
                              <ExternalLink className="w-3 h-3 opacity-50" />
                            </a>
                          ))}
                        </div>
                      </>
                    )}

                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-blue-500 pl-3 no-print">Observacions del Comitè (Públic)</h4>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 no-print">
                      <textarea
                        className="w-full p-4 rounded-2xl border bg-white min-h-[120px] text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Escriu observacions per al denunciant..."
                        value={editingObservations}
                        onChange={(e) => setEditingObservations(e.target.value)}
                        onFocus={() => {
                          if (editingObservations === "" && selectedReport.observations) {
                            setEditingObservations(selectedReport.observations);
                          }
                        }}
                      />
                      <button
                        onClick={async () => {
                          setIsSavingObs(true);
                          await onUpdateObservations(selectedReport.id, editingObservations);
                          setIsSavingObs(false);
                        }}
                        disabled={isSavingObs || editingObservations === selectedReport.observations}
                        className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all disabled:opacity-50"
                      >
                        {isSavingObs ? 'Guardant...' : 'Guardar Observacions'}
                      </button>
                    </div>

                    {selectedReport.observations && (
                      <div className="hidden print:block space-y-2 mt-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-blue-500 pl-3 print:text-black">Observacions del Comitè</h4>
                        <p className="text-sm border p-4 rounded-xl">{selectedReport.observations}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-8 bg-slate-50 border-t flex flex-col md:flex-row justify-between gap-3 md:gap-4 no-print">
                <div className="flex gap-2 justify-center md:justify-start">
                  <button
                    onClick={handlePrint}
                    title="Imprimir Expedient"
                    className="bg-white border p-3 rounded-xl hover:bg-slate-100 transition-all shadow-sm active:scale-95"
                  >
                    <Printer className="w-5 h-5 text-slate-600" />
                  </button>
                  <button
                    onClick={handleDelete}
                    title="Eliminar Expedient"
                    className="bg-white border p-3 rounded-xl hover:bg-red-50 text-red-500 shadow-sm active:scale-95"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2 relative justify-center md:justify-end">
                  <div className="relative w-full md:w-auto">
                    <button
                      onClick={() => setShowStatusMenu(!showStatusMenu)}
                      className="bg-blue-600 text-white px-6 md:px-8 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 w-full md:w-auto"
                    >
                      Canviar Estat
                    </button>
                    {showStatusMenu && (
                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border rounded-2xl shadow-2xl p-2 animate-in slide-in-from-bottom-2 z-10">
                        {(['Pendent', 'En Procés', 'Resolt', 'Urgència'] as Report['status'][]).map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className={`w-full text-left px-4 py-2 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors ${selectedReport.status === s ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {
        showDeleteConfirm && selectedReport && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Confirmar Eliminació</h3>
                <p className="text-slate-600">Estàs segur que vols eliminar definitivament l'expedient <span className="font-bold">#{selectedReport.id}</span>?</p>
                <p className="text-sm text-red-600 mt-2">Aquesta acció no es pot desfer.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel·lar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors shadow-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Dashboard;
