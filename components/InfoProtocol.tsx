
import React from 'react';
import { Info, Shield, CheckCircle, AlertCircle, HelpCircle, ExternalLink, Globe } from 'lucide-react';
import { INDICATORS } from '../constants';

const InfoProtocol: React.FC = () => {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom duration-500">
      <section className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <h2 className="text-4xl font-black">Com funciona el Protocol?</h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            El Protocol d'Actuació per a la Protecció Integral a la Infància i Adolescència defineix els passos a seguir davant de sospites o evidències de violència.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-bold">Confidencialitat</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-bold">Rapidesa</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-bold">No-Victimització</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-12 opacity-5 hidden lg:block">
          <Shield className="w-64 h-64" />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            Indicadors de Detecció
          </h3>
          <div className="space-y-4">
            {INDICATORS.map((indicator, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-3">{indicator.category}</h4>
                <ul className="space-y-2">
                  {indicator.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-blue-500" />
            Preguntes Freqüents
          </h3>
          <div className="space-y-4">
            {[
              { q: "Qui és el Delegat de Protecció?", a: "És la persona responsable dins de l'entitat encarregada de canalitzar les denúncies i assegurar el compliment del protocol." },
              { q: "Puc denunciar de forma anònima?", a: "Sí, el canal permet l'anonimat, tot i que proporcionar contacte ajuda a fer una investigació més profunda si calen més dades." },
              { q: "Què passa després d'enviar?", a: "El Delegat obre un expedient informatiu immediat (màxim 10 dies) per avaluar la gravetat i decidir si cal informar les autoritats (Policia/Fiscalia)." },
              { q: "Com es protegeix la víctima?", a: "S'apliquen mesures cautelars immediates per allunyar el presumpte agressor i s'ofereix suport psicològic i emocional." },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-colors">
                <p className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{faq.q}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* External Resources Section */}
      <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Globe className="w-6 h-6 text-green-600" />
          Canals i Recursos Externs
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-slate-100 bg-slate-50 p-6 rounded-2xl flex flex-col justify-between hover:border-blue-200 transition-all">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900">Generalitat de Catalunya</h4>
              <p className="text-sm text-slate-600">Infància i Adolescència - Telèfon d'atenció a la infància i l'adolescència.</p>
            </div>
            <a 
              href="https://dretssocials.gencat.cat/ca/ambits_tematics/infancia_i_adolescencia/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-6 inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors text-sm"
            >
              Web d'Infància Gencat
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="border border-slate-100 bg-slate-50 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-200 transition-all">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900">Mossos d'Esquadra</h4>
              <p className="text-sm text-slate-600">Unitat de Protecció de Menors i Atenció a la Víctima.</p>
            </div>
            <a 
              href="https://mossos.gencat.cat/ca/consells_de_seguretat/menors/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-6 inline-flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors text-sm"
            >
              Consells de Seguretat
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 rounded-3xl p-10 text-white text-center space-y-4">
        <h3 className="text-2xl font-black">Necessites ajuda urgent?</h3>
        <p className="max-w-2xl mx-auto font-medium">
          Si creus que la situació requereix una intervenció policial o mèdica immediata, truca ara mateix als telèfons d'emergències.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <div className="bg-white/20 backdrop-blur px-6 py-4 rounded-2xl border border-white/30">
            <span className="block text-xs font-bold uppercase tracking-widest opacity-70">Emergències</span>
            <span className="text-3xl font-black">112</span>
          </div>
          <div className="bg-white/20 backdrop-blur px-6 py-4 rounded-2xl border border-white/30">
            <span className="block text-xs font-bold uppercase tracking-widest opacity-70">Policia Local</span>
            <span className="text-3xl font-black">092</span>
          </div>
          <div className="bg-white/20 backdrop-blur px-6 py-4 rounded-2xl border border-white/30">
            <span className="block text-xs font-bold uppercase tracking-widest opacity-70">Atenció Menors</span>
            <span className="text-3xl font-black">116 111</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InfoProtocol;
