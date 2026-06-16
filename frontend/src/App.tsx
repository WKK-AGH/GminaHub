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

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/"      element={<><Hero /><Features /></>} />
            <Route path="/login" element={<Login />} />

            {/* All logged-in users */}
            <Route path="/panel"            element={<ProtectedRoute><CouncilPanel /></ProtectedRoute>} />
            <Route path="/session/:id"      element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
            <Route path="/statistics/:id"   element={<ProtectedRoute><SessionStatistics /></ProtectedRoute>} />

            {/* RADNY, PRZEWODNICZACY, ADMINISTRATOR */}
            <Route path="/live/:sessionId" element={
              <ProtectedRoute roles={['RADNY', 'PRZEWODNICZACY', 'ADMINISTRATOR']}>
                <LiveVoting />
              </ProtectedRoute>
            } />

            {/* PRZEWODNICZACY and ADMINISTRATOR only */}
            <Route path="/session/new" element={
              <ProtectedRoute roles={['PRZEWODNICZACY', 'ADMINISTRATOR']}>
                <SessionCreation />
              </ProtectedRoute>
            } />
            <Route path="/committees" element={
              <ProtectedRoute roles={['PRZEWODNICZACY', 'ADMINISTRATOR']}>
                <CommitteeManagement />
              </ProtectedRoute>
            } />
            <Route path="/agenda/:sessionId/edit" element={
              <ProtectedRoute roles={['PRZEWODNICZACY', 'ADMINISTRATOR']}>
                <AgendaCreation />
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
                  <span className="font-bold text-lg text-white">Municipal Office</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  Official public information service of the Municipal Council. Information contained in the portal constitutes public information.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-white text-sm">Citizen Information</h4>
                <ul className="space-y-2 text-sm font-light">
                  <li>Digital Accessibility Declaration</li>
                  <li>Privacy Policy & GDPR</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-white text-sm">Municipal Office</h4>
                <ul className="space-y-1.5 text-sm font-light">
                  <li>1 Council Street, 00-000 Municipality</li>
                  <li className="pt-2 text-slate-300 font-normal">tel. +48 12 345 67 89</li>
                  <li>e-mail: office@municipality.pl</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
              <p>&copy; 2026 Municipal Council. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
