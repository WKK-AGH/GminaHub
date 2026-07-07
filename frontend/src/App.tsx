import { Route, Routes } from 'react-router-dom';
import AgendaCreation from './components/AgendaCreation';
import CommitteeManagement from './components/CommitteeManagement';
import CouncilPanel from './components/CouncilPanel';
import Features from './components/Features';
import Hero from './components/Hero';
import LiveVoting from './components/LiveVoting';
import Login from './components/Login';
import Navbar from './components/Navbar';
import SessionCreation from './components/SessionCreation';
import SessionDetail from './components/SessionDetail';
import SessionStatistics from './components/SessionStatistics';
import SessionSummary from './components/SessionSummary';
import UserManagement from './components/Usermanagement';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
                <Navbar />
                <main className="grow">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <>
                                    <Hero />
                                    <Features />
                                </>
                            }
                        />
                        <Route path="/login" element={<Login />} />

                        <Route
                            path="/panel"
                            element={
                                <ProtectedRoute>
                                    <CouncilPanel />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/sesja/:id"
                            element={
                                <ProtectedRoute>
                                    <SessionDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/statystyki/:id"
                            element={
                                <ProtectedRoute>
                                    <SessionStatistics />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/podsumowanie/:id"
                            element={
                                <ProtectedRoute>
                                    <SessionSummary />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/live/:sessionId"
                            element={
                                <ProtectedRoute roles={['MEMBER', 'CHAIRPERSON', 'ADMIN']}>
                                    <LiveVoting />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/sesja/nowa"
                            element={
                                <ProtectedRoute roles={['CHAIRPERSON', 'ADMIN']}>
                                    <SessionCreation />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/komisje"
                            element={
                                <ProtectedRoute roles={['CHAIRPERSON', 'ADMIN']}>
                                    <CommitteeManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/agenda/:sessionId/edytuj"
                            element={
                                <ProtectedRoute roles={['CHAIRPERSON', 'ADMIN']}>
                                    <AgendaCreation />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/uzytkownicy"
                            element={
                                <ProtectedRoute roles={['ADMIN']}>
                                    <UserManagement />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </main>

                <footer className="bg-[#B91C1C] text-red-200 py-8 mt-auto">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center">
                                        <span className="text-white font-bold text-xs">RG</span>
                                    </div>
                                    <span className="font-semibold text-white text-sm">
                                        Urząd Gminy Nasza Gmina
                                    </span>
                                </div>
                                <p className="text-xs text-red-300 leading-relaxed">
                                    Oficjalny serwis informacyjny Rady Gminy. Informacje stanowią
                                    informację publiczną.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-xs uppercase tracking-wide mb-3">
                                    Informacje
                                </h4>
                                <ul className="space-y-1.5 text-xs text-red-300">
                                    <li>Deklaracja Dostępności Cyfrowej</li>
                                    <li>Polityka Prywatności i RODO</li>
                                    <li>Biuletyn Informacji Publicznej</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-xs uppercase tracking-wide mb-3">
                                    Kontakt
                                </h4>
                                <ul className="space-y-1 text-xs text-red-300">
                                    <li>ul. Samorządowa 1, 32-000 Nasza Gmina</li>
                                    <li className="pt-1 text-white">tel. +48 12 345 67 89</li>
                                    <li>rada@nasza-gmina.pl</li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-white/10 pt-5 text-center text-xs text-red-400">
                            &copy; 2026 Rada Gminy Nasza Gmina · Wszelkie prawa zastrzeżone
                        </div>
                    </div>
                </footer>
            </div>
        </AuthProvider>
    );
}
