import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';

// Global Components
import { Navbar } from './components/Navbar.js';
import { BottomNav } from './components/BottomNav.js';
import { FloatingHearts } from './components/FloatingHearts.js';
import { InvitationPopupModal } from './components/InvitationPopupModal.js';
import { SenderNotificationBanner } from './components/SenderNotificationBanner.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { GameLibraryPage } from './pages/GameLibraryPage.js';
import { GameRoomPage } from './pages/GameRoomPage.js';
import { GameHistoryPage } from './pages/GameHistoryPage.js';
import { AchievementsPage } from './pages/AchievementsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { QuickDuelScreen } from './pages/QuickDuelScreen.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-aashi-pink border-t-aashi-berry animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Only Route (e.g. login/register when already logged in)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <div className="relative min-h-screen flex flex-col font-body text-aashi-plum selection:bg-aashi-berry selection:text-white">
              {/* Subtle ambient hearts & sparkles */}
              <FloatingHearts />

              {/* Global Navigation */}
              <Navbar />

              {/* Real-Time Partner Invitation Popup (Critical Requirement) */}
              <InvitationPopupModal />

              {/* Partner Accepted / Declined Notification Toast */}
              <SenderNotificationBanner />

              {/* Main Content View */}
              <main className="flex-1 relative z-10">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route
                    path="/login"
                    element={
                      <PublicOnlyRoute>
                        <LoginPage />
                      </PublicOnlyRoute>
                    }
                  />
                  <Route path="/register" element={<Navigate to="/login" replace />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                  {/* Protected Routes */}
                  <Route
                    path="/duel"
                    element={
                      <ProtectedRoute>
                        <QuickDuelScreen />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/games"
                    element={
                      <ProtectedRoute>
                        <GameLibraryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/room/:roomId"
                    element={
                      <ProtectedRoute>
                        <GameRoomPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <GameHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/achievements"
                    element={
                      <ProtectedRoute>
                        <AchievementsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>

              {/* Mobile Bottom Navigation */}
              <BottomNav />
            </div>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
