
import React, { useState } from 'react';
import { Report } from '../types';
import { Clock, Shield, AlertTriangle, CheckCircle, FileText, Filter, Search, X, Printer, Trash2, User, MapPin, ExternalLink, EyeOff, Calendar, AlertCircle, Mail, Smartphone } from 'lucide-react';

interface DashboardProps {
  reports: Report[];
  onDeleteReport: (id: string) => void;
  onUpdateStatus: (id: string, status: Report['status']) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ reports, onDeleteReport, onUpdateStatus }) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const selectedReport = reports.find(r => r.id === selectedReportId) || null;

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
      if (window.confirm(`Estàs segur que vols eliminar definitivament l'expedient #${selectedReport.id}? Aquesta acció no es pot desfer.`)) {
        onDeleteReport(selectedReport.id);
        setSelectedReportId(null);
      }
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
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Gestió de Denúncies</h2>
          <p className="text-slate-500">Accés exclusiu per al Delegat de Protecció.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border p-2 rounded-xl flex items-center gap-2">
            <Search className="w-4 h-4" />
            <input type="text" placeholder="Cercar..." className="outline-none text-sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 no-print">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className={`${s.bg} p-3 rounded-xl`}><s.icon className={`w-6 h-6 ${s.color}`} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p><p className="text-2xl font-black">{s.val}</p></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden no-print">
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
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${r.status === 'Urgència' ? 'bg-red-600 text-white' : 'bg-slate-100'}`}>
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

      {selectedReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div id="print-area" className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center no-print">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><FileText className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-bold">Detall Expedient #{selectedReport.id}</h3>
                  <p className="text-xs text-slate-500">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedReportId(null)} className="p-2 hover:bg-slate-200 rounded-full">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-12">
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-amber-500 pl-2">Informació de la Víctima</h4>
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-3 border border-slate-100">
                    <p className="text-lg font-bold text-slate-900">{selectedReport.victim.name}</p>
                    <p className="text-sm text-slate-600">Edat: {selectedReport.victim.age} · Gènere: {selectedReport.victim.gender}</p>
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-tight">{selectedReport.victim.category}</p>
                  </div>

                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-amber-500 pl-2">Informant</h4>
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-2 border border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{selectedReport.informant.isAnonymous ? 'USUARI ANÒNIM' : selectedReport.informant.name}</p>
                    <p className="text-xs text-slate-500">{selectedReport.informant.type}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-amber-500 pl-2">Detalls dels Fets</h4>
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
                    <p className="text-sm font-medium leading-relaxed text-slate-700">{selectedReport.facts.description}</p>
                    <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400 uppercase">
                      <div>
                        <p className="mb-1 opacity-60">Lloc de l'incident</p>
                        <p className="text-slate-800">{selectedReport.facts.location}</p>
                      </div>
                      <div>
                        <p className="mb-1 opacity-60">Data i Hora</p>
                        <p className="text-slate-800">{selectedReport.facts.date} - {selectedReport.facts.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex justify-between gap-4 no-print">
              <div className="flex gap-2">
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
              <div className="flex gap-2 relative">
                <div className="relative group">
                  <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
                    Canviar Estat
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border rounded-2xl shadow-2xl p-2 hidden group-hover:block animate-in slide-in-from-bottom-2">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
