// ============================================================
// TextileFlow MES — App Root
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import NotificationOverlay from './components/Layout/NotificationOverlay';
import UndoToast from './components/common/UndoToast';
import OperatorPrompt from './components/Layout/OperatorPrompt';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';

// Pages
import DepartmentQueue from './pages/DepartmentQueue';
import CreateLot from './pages/CreateLot';
import Dispatch from './pages/Dispatch';
import AIPanel from './pages/AIPanel';
import SupervisorDashboard from './pages/SupervisorDashboard';
import ProductionHistory from './pages/ProductionHistory';

function AppContent() {
  const { state } = useApp();
  const { user, status } = useAuth();

  // Wait for auth to resolve
  if (status === 'loading') return null;

  const authRole = user?.role || 'operator';

  // Show operator prompt if no name set
  if (!state.operatorName) {
    return <OperatorPrompt />;
  }

  // ── Role-based routing ──

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <Routes>

          {/* Routes shared by all roles */}
          <Route path="/" element={<Navigate to={`/queue/${state.department || 'dyeing'}`} replace />} />
          <Route path="/queue/:department" element={<DepartmentQueue />} />
          <Route path="*" element={<Navigate to={`/queue/${state.department || 'dyeing'}`} replace />} />

          {/* Supervisor + Admin routes */}
          {(authRole === 'supervisor' || authRole === 'admin') && (
            <>
              <Route path="/dispatch" element={<Dispatch />} />
              <Route path="/supervisor" element={<SupervisorDashboard />} />
              <Route path="/history" element={<ProductionHistory />} />
            </>
          )}

          {/* Admin-only routes */}
          {authRole === 'admin' && (
            <>
              <Route path="/create" element={<CreateLot />} />
              <Route path="/ai-panel" element={<AIPanel />} />
            </>
          )}

        </Routes>
      </div>
      <NotificationOverlay />
      <UndoToast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <InternalRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function InternalRoutes() {
  const { status } = useAuth();

  if (status === 'loading') return null;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedRoute><AppContent /></ProtectedRoute>} />
    </Routes>
  );
}
