import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROLE_LABEL } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const { currentUser, logout } = useAuth();

    const isPanelRoute = [
        '/panel',
        '/sesja',
        '/live',
        '/komisje',
        '/statystyki',
        '/agenda',
        '/podsumowanie',
    ].some((p) => location.pathname.startsWith(p));

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            {/* Pasek flagowy */}
            <div className="flex h-1.5">
                <div className="flex-1 bg-white border-t border-slate-200" />
                <div className="flex-1 bg-[#DC143C]" />
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-14">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-[#B91C1C] rounded flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-xs leading-none">RG</span>
                        </div>
                        <div className="leading-tight">
                            <span className="block text-[#B91C1C] font-bold text-sm tracking-wide">
                                RADA GMINY
                            </span>
                            <span className="block text-slate-400 text-xs">Nasza Gmina</span>
                        </div>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-6">
                        {!isPanelRoute && (
                            <>
                                <a
                                    href="/#glosowania"
                                    className="text-sm text-slate-600 hover:text-[#B91C1C] transition font-medium"
                                >
                                    Rejestr głosowań
                                </a>
                                <a
                                    href="/#kalendarz"
                                    className="text-sm text-slate-600 hover:text-[#B91C1C] transition font-medium"
                                >
                                    Kalendarz
                                </a>
                                <a
                                    href="/#nagrania"
                                    className="text-sm text-slate-600 hover:text-[#B91C1C] transition font-medium"
                                >
                                    Archiwum nagrań
                                </a>
                            </>
                        )}

                        {isPanelRoute && currentUser && (
                            <>
                                <Link
                                    to="/panel"
                                    className={`text-sm font-medium transition ${location.pathname === '/panel' ? 'text-[#B91C1C] font-semibold' : 'text-slate-600 hover:text-[#B91C1C]'}`}
                                >
                                    Panel
                                </Link>
                                {currentUser.role === 'ADMINISTRATOR' && (
                                    <Link
                                        to="/uzytkownicy"
                                        className={`text-sm font-medium transition ${location.pathname.startsWith('/uzytkownicy') ? 'text-[#B91C1C] font-semibold' : 'text-slate-600 hover:text-[#B91C1C]'}`}
                                    >
                                        Użytkownicy
                                    </Link>
                                )}
                                {(currentUser.role === 'PRZEWODNICZACY' ||
                                    currentUser.role === 'ADMINISTRATOR') && (
                                    <Link
                                        to="/komisje"
                                        className={`text-sm font-medium transition ${location.pathname.startsWith('/komisje') ? 'text-[#B91C1C] font-semibold' : 'text-slate-600 hover:text-[#B91C1C]'}`}
                                    >
                                        Komisje
                                    </Link>
                                )}
                                <span className="text-xs text-slate-400 border border-slate-200 px-2 py-1 rounded bg-slate-50">
                                    {ROLE_LABEL[currentUser.role]}
                                </span>
                            </>
                        )}
                        {currentUser ? (
                            isPanelRoute ? (
                                <button
                                    onClick={logout}
                                    className="text-sm font-medium text-slate-600 border border-slate-300 px-4 py-1.5 rounded hover:bg-slate-50 transition"
                                >
                                    Wyloguj
                                </button>
                            ) : (
                                <Link
                                    to="/panel"
                                    className="text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] px-4 py-1.5 rounded transition"
                                >
                                    Panel radnego
                                </Link>
                            )
                        ) : (
                            <Link
                                to="/login"
                                className="text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] px-4 py-1.5 rounded transition"
                            >
                                Panel radnego
                            </Link>
                        )}
                    </div>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 text-slate-600 hover:text-[#B91C1C]"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {menuOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-2">
                    {!isPanelRoute ? (
                        <>
                            <a
                                href="/#glosowania"
                                onClick={() => setMenuOpen(false)}
                                className="block py-2 text-sm text-slate-600 font-medium border-b border-slate-100"
                            >
                                Rejestr głosowań
                            </a>
                            <a
                                href="/#kalendarz"
                                onClick={() => setMenuOpen(false)}
                                className="block py-2 text-sm text-slate-600 font-medium border-b border-slate-100"
                            >
                                Kalendarz
                            </a>
                            <a
                                href="/#nagrania"
                                onClick={() => setMenuOpen(false)}
                                className="block py-2 text-sm text-slate-600 font-medium border-b border-slate-100"
                            >
                                Archiwum nagrań
                            </a>
                            <Link
                                to={currentUser ? '/panel' : '/login'}
                                onClick={() => setMenuOpen(false)}
                                className="block w-full text-center bg-[#B91C1C] text-white text-sm py-2 rounded font-semibold mt-2"
                            >
                                {currentUser ? 'Panel radnego' : 'Zaloguj się'}
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/panel"
                                onClick={() => setMenuOpen(false)}
                                className="block py-2 text-sm text-slate-600 font-medium border-b border-slate-100"
                            >
                                Panel
                            </Link>
                            {currentUser && currentUser.role === 'ADMINISTRATOR' && (
                                <Link
                                    to="/uzytkownicy"
                                    onClick={() => setMenuOpen(false)}
                                    className="block py-2 text-sm text-slate-600 font-medium border-b border-slate-100"
                                >
                                    Użytkownicy
                                </Link>
                            )}
                            {currentUser &&
                                (currentUser.role === 'PRZEWODNICZACY' ||
                                    currentUser.role === 'ADMINISTRATOR') && (
                                    <Link
                                        to="/komisje"
                                        onClick={() => setMenuOpen(false)}
                                        className="block py-2 text-sm text-slate-600 font-medium border-b border-slate-100"
                                    >
                                        Komisje
                                    </Link>
                                )}
                            <button
                                onClick={() => {
                                    logout();
                                    setMenuOpen(false);
                                }}
                                className="block w-full text-center border border-slate-200 text-slate-600 text-sm py-2 rounded font-medium mt-2"
                            >
                                Wyloguj
                            </button>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
