import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABEL } from '../api/api';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const isPanelRoute = ['/panel', '/sesja', '/live', '/komisje', '/statystyki', '/agenda', '/podsumowanie'].some(p =>
    location.pathname.startsWith(p)
  );

  return (
    <nav className="bg-slate-950 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-600 rounded" />
            <Link to="/" className="text-base font-bold tracking-tight text-slate-50">RADA GMINY NASZA GMINA</Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {!isPanelRoute && (
              <>
                <a href="/#glosowania"  className="text-sm font-medium text-slate-300 hover:text-white transition">Rejestr głosowań</a>
                <a href="/#nagrania"    className="text-sm font-medium text-slate-300 hover:text-white transition">Archiwum nagrań</a>
              </>
            )}

            {isPanelRoute && currentUser && (
              <>
                <Link to="/panel"
                  className={`text-sm font-medium transition ${location.pathname === '/panel' ? 'text-white' : 'text-slate-300 hover:text-white'}`}>
                  Panel
                </Link>
                {(currentUser.role === 'PRZEWODNICZACY' || currentUser.role === 'ADMINISTRATOR') && (
                  <Link to="/komisje"
                    className={`text-sm font-medium transition ${location.pathname.startsWith('/komisje') ? 'text-white' : 'text-slate-300 hover:text-white'}`}>
                    Komisje
                  </Link>
                )}
                <span className="text-xs text-slate-500 border border-slate-700 px-2 py-1 rounded">
                  {ROLE_LABEL[currentUser.role]}
                </span>
              </>
            )}

            {currentUser ? (
              isPanelRoute ? (
                <button onClick={logout} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-sm px-4 py-2 rounded font-semibold transition">
                  Wyloguj
                </button>
              ) : (
                <Link to="/panel" className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-sm px-4 py-2 rounded font-semibold transition">
                  Panel Radnego
                </Link>
              )
            ) : (
              <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded font-semibold transition">
                Panel Radnego
              </Link>
            )}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded hover:bg-slate-800 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden pb-4 border-t border-slate-800 px-4 pt-2 space-y-1 bg-slate-950">
          {!isPanelRoute ? (
            <>
              <a href="/#glosowania" className="block py-2 text-sm font-medium text-slate-300 hover:text-white">Rejestr głosowań</a>
              <a href="/#nagrania"   className="block py-2 text-sm font-medium text-slate-300 hover:text-white">Archiwum nagrań</a>
              <Link to={currentUser ? '/panel' : '/login'} onClick={() => setIsMenuOpen(false)}
                className="block w-full mt-2 text-center bg-blue-600 text-white text-sm py-2 rounded font-semibold">
                {currentUser ? 'Panel Radnego' : 'Zaloguj się'}
              </Link>
            </>
          ) : (
            <>
              <Link to="/panel" onClick={() => setIsMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-300 hover:text-white">Panel</Link>
              {currentUser && (currentUser.role === 'PRZEWODNICZACY' || currentUser.role === 'ADMINISTRATOR') && (
                <Link to="/komisje" onClick={() => setIsMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-300 hover:text-white">Komisje</Link>
              )}
              <button onClick={() => { logout(); setIsMenuOpen(false); }}
                className="block w-full mt-2 text-center bg-slate-800 text-white text-sm py-2 rounded font-semibold border border-slate-700">
                Wyloguj
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
