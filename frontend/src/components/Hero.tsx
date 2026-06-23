import { ArrowRight, Radio, FileText, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <div className="bg-white">

      {/* Breadcrumb */}
      <div className="bg-slate-100 border-b border-slate-200 text-xs py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-slate-500">
          <span>Urząd Gminy Nasza Gmina</span>
          <ChevronRight className="w-3 h-3 opacity-40" />
          <span>Rada Gminy</span>
          <ChevronRight className="w-3 h-3 opacity-40" />
          <span className="text-[#B91C1C] font-medium">System e-Sesja</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="max-w-2xl space-y-6">
          <div>
            <p className="text-xs font-semibold text-[#B91C1C] uppercase tracking-widest mb-2">
              System cyfrowej obsługi posiedzeń
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Rada Gminy<br />
              <span className="text-[#B91C1C]">Nasza Gmina</span>
            </h1>
            <p className="text-slate-500 text-base mt-2">e-Sesja: Cyfrowa Rada Gminy</p>
          </div>

          <p className="text-slate-600 leading-relaxed text-sm">
            Transparentny dostęp do prac samorządu. Śledź głosowania, agendy sesji
            i uchwały w czasie rzeczywistym.
          </p>

          <div className="flex flex-wrap gap-3">
            <a href="#glosowania"
              className="inline-flex items-center gap-2 bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold px-5 py-2.5 rounded text-sm transition">
              Rejestr głosowań <ArrowRight className="w-4 h-4" />
            </a>
            <Link to="/login"
              className="inline-flex items-center gap-2 border border-[#B91C1C] text-[#B91C1C] hover:bg-red-50 font-semibold px-5 py-2.5 rounded text-sm transition">
              Panel radnego
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            {[
              { icon: <Radio className="w-4 h-4" />,    label: 'Głosowania online',   desc: 'w czasie rzeczywistym' },
              { icon: <FileText className="w-4 h-4" />, label: 'Rejestr uchwał',      desc: 'publiczny dostęp'      },
              { icon: <Calendar className="w-4 h-4" />, label: 'Kalendarz posiedzeń', desc: 'wszystkie komisje'     },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-9 h-9 bg-red-50 border border-red-100 rounded flex items-center justify-center mx-auto mb-2 text-[#B91C1C]">
                  {item.icon}
                </div>
                <p className="text-xs font-semibold text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
