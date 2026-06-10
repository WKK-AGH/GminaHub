import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Login from './components/Login';
import PanelRadnego from './components/PanelRadnego';
import SesjaDetail from './components/SesjaDetail';
import LiveGlosowanie from './components/LiveGlosowanie';
import ZarzadzanieKomisjami from './components/ZarzadzanieKomisjami';
import StatystykiSesji from './components/StatystykiSesji';
import TworzenieAgendy from './components/TworzenieAgendy';
import TworzenieSesji from './components/Tworzeniesesji';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Publiczne */}
            <Route path="/" element={<><Hero /><Features /></>} />
            <Route path="/login" element={<Login />} />

            {/* Każdy zalogowany */}
            <Route path="/panel" element={<ProtectedRoute><PanelRadnego /></ProtectedRoute>} />
            <Route path="/sesja/:id" element={<ProtectedRoute><SesjaDetail /></ProtectedRoute>} />
            <Route path="/statystyki/:id" element={<ProtectedRoute><StatystykiSesji /></ProtectedRoute>} />

            {/* RADNY, PRZEWODNICZACY, ADMINISTRATOR */}
            <Route path="/live/:sessionId" element={
              <ProtectedRoute roles={['RADNY', 'PRZEWODNICZACY', 'ADMINISTRATOR']}>
                <LiveGlosowanie />
              </ProtectedRoute>
            } />

            {/* Tylko PRZEWODNICZACY i ADMINISTRATOR */}
            <Route path="/sesja/nowa" element={
              <ProtectedRoute roles={['PRZEWODNICZACY', 'ADMINISTRATOR']}>
                <TworzenieSesji />
              </ProtectedRoute>
            } />
            <Route path="/komisje" element={
              <ProtectedRoute roles={['PRZEWODNICZACY', 'ADMINISTRATOR']}>
                <ZarzadzanieKomisjami />
              </ProtectedRoute>
            } />
            <Route path="/agenda/:sessionId/edytuj" element={
              <ProtectedRoute roles={['PRZEWODNICZACY', 'ADMINISTRATOR']}>
                <TworzenieAgendy />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-blue-600 rounded" />
                  <span className="font-bold text-lg text-white">Urząd Gminy Nasza Gmina</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  Oficjalny publiczny serwis informacyjny Rady Gminy. Informacje zawarte w portalu stanowią informację publiczną.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-white text-sm">Informacje dla Obywateli</h4>
                <ul className="space-y-2 text-sm font-light">
                  <li>Deklaracja Dostępności Cyfrowej</li>
                  <li>Polityka Prywatności i RODO</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-white text-sm">Urząd Gminy</h4>
                <ul className="space-y-1.5 text-sm font-light">
                  <li>ul. Samorządowa 1, 00-000 Gmina</li>
                  <li className="pt-2 text-slate-300 font-normal">tel. +48 12 345 67 89</li>
                  <li>e-mail: sekretariat@urzadgminy.pl</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
              <p>&copy; 2026 Rada Gminy Nasza Gmina. Wszelkie prawa zastrzeżone.</p>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
