import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Login from './components/Login';
import CouncilPanel from './components/CouncilPanel';
import SessionDetail from './components/SessionDetail';
import LiveVoting from './components/LiveVoting';
import CommitteeManagement from './components/CommitteeManagement';
import AgendaCreation from './components/AgendaCreation';
import SessionCreation from './components/SessionCreation';
import SessionStatistics from './components/SessionStatistics';
import SessionSummary from './components/SessionSummary';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Publiczne */}
            <Route path="/"      element={<><Hero /><Features /></>} />
            <Route path="/login" element={<Login />} />

            {/* Każdy zalogowany */}
            <Route path="/panel"              element={<ProtectedRoute><CouncilPanel /></ProtectedRoute>} />
            <Route path="/sesja/:id"          element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
            <Route path="/statystyki/:id"     element={<ProtectedRoute><SessionStatistics /></ProtectedRoute>} />
            <Route path="/podsumowanie/:id"   element={<ProtectedRoute><SessionSummary /></ProtectedRoute>} />

            {/* Radny, Przewodniczący, Administrator */}
            <Route path="/live/:sessionId" element={
              <ProtectedRoute roles={['RADNY', 'PRZEWODNICZACY', 'ADMINISTRATOR']}>
                <LiveVoting />
              </ProtectedRoute>
            } />

            {/* Tylko Przewodniczący i Administrator */}
            <Route path="/sesja/nowa" element={
              <ProtectedRoute roles={['PRZEWODNICZACY', 'ADMINISTRATOR']}>
                <SessionCreation />
              </ProtectedRoute>
            } />
            <Route path="/komisje" element={
              <ProtectedRoute roles={['PRZEWODNICZACY', 'ADMINISTRATOR']}>
                <CommitteeManagement />
              </ProtectedRoute>
            } />
            <Route path="/agenda/:sessionId/edytuj" element={
              <ProtectedRoute roles={['PRZEWODNICZACY', 'ADMINISTRATOR']}>
                <AgendaCreation />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-blue-600 rounded" />
                  <span className="font-bold text-lg text-white">Urząd Gminy Nasza Gmina</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Oficjalny serwis informacyjny Rady Gminy Nasza Gmina. Informacje zawarte w portalu stanowią informację publiczną.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">Informacje</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Deklaracja Dostępności Cyfrowej</li>
                  <li>Polityka Prywatności i RODO</li>
                  <li>Biuletyn Informacji Publicznej</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-white text-sm">Kontakt</h4>
                <ul className="space-y-1.5 text-sm text-slate-400">
                  <li>ul. Samorządowa 1</li>
                  <li>32-000 Nasza Gmina</li>
                  <li className="pt-1 text-slate-300">tel. +48 12 345 67 89</li>
                  <li>e-mail: rada@nasza-gmina.pl</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
              <p>&copy; 2026 Rada Gminy Nasza Gmina. Wszelkie prawa zastrzeżone.</p>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
