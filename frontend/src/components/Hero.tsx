import { ArrowRight, Radio, FileText, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <div className="bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Lewa — treść */}
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter leading-[0.95] uppercase">
                Rada<br />
                <span className="text-blue-500">Gminy</span><br />
                Online
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md font-light">
                Transparentny dostęp do prac samorządu. Śledź głosowania, agendy sesji i uchwały Rady Gminy Nasza Gmina w czasie rzeczywistym.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="#glosowania"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
                Rejestr głosowań <ArrowRight className="w-4 h-4" />
              </a>
              <Link to="/login"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
                Panel Radnego
              </Link>
            </div>
          </div>

          {/* Prawa — opis systemu */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Radio className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">System e-Sesja</p>
                <p className="text-white font-extrabold text-lg leading-snug">Cyfrowa Rada Gminy</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <Radio className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Głosowania w czasie rzeczywistym dla radnych</span>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Publiczny rejestr uchwał i wyników głosowań</span>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Kalendarz posiedzeń i archiwum sesji</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700">
              <Link to="/login"
                className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition text-sm">
                Zaloguj się do panelu radnego
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
