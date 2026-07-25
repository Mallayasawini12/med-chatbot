import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { Profile } from './components/Profile';
import { EmergencySection } from './components/EmergencySection';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Uncaught component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 bg-teal-500/10 rounded-2xl text-teal-600 dark:text-teal-400 mb-4 font-bold text-sm">
            SymptomCare AI
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Session Restored</h2>
          <p className="text-xs text-slate-500 max-w-md mb-6">Click below to return to your active consultation dashboard.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/dashboard';
            }}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// App Layout that wraps protected pages and injects Sidebar / Navbar
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const handleToggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // If on authentication route, do not show navigation layouts
  const isAuthRoute = location.pathname === '/auth';

  if (!user || isAuthRoute) {
    return <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">{children}</div>;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      {/* Main Panel Content Container */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Navbar onToggleSidebar={handleToggleSidebar} />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppLayout>
            <Routes>
              {/* Public landing/auth route */}
              <Route path="/auth" element={<AuthPage />} />

              {/* Protected application routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatInterface />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/emergency"
                element={
                  <ProtectedRoute>
                    <EmergencySection />
                  </ProtectedRoute>
                }
              />

              {/* Default Route redirects to dashboard (protected) or auth */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
