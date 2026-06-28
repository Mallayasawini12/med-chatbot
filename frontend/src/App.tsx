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
  );
};

export default App;
