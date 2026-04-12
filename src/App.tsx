import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import RequireAuth from './components/auth/RequireAuth';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { DataProvider } from './DataContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import { NotificationsProvider } from './contexts/NotificationsContext';

// Route-level code splitting
const Home = lazy(() => import('./pages/Home'));
const Enrollment = lazy(() => import('./pages/Enrollment'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = ['/login'].includes(location.pathname);
  const { user, loading } = useAuth();
  
  // Clean up any console logs in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth state:', { user, loading });
    }
  }, [user, loading]);

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      {/* Skip to content for accessibility */}
      {!isAuthPage && (
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 px-3 py-2 rounded shadow">
          Skip to content
        </a>
      )}
      {!isAuthPage && <Header />}
      <main id="main-content" className="flex-grow w-full py-4 md:py-6">
        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="large" />
            </div>
          }>
          <Routes>
            {/* Login routes (public) */}
            <Route path="/login" element={
              user
                ? user.role?.role === 'admin'
                  ? <Navigate to="/admin" />
                  : <Navigate to="/enrollment" />
                : <Login />
            } />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Protected routes: enrollment and admin require login */}
            <Route path="/enrollment" element={
              <RequireAuth>
                <Enrollment />
              </RequireAuth>
            } />
            
            <Route path="/dashboard" element={
              <RequireAuth>
                <StudentDashboard />
              </RequireAuth>
            } />
            
            <Route path="/admin" element={
              <RequireAuth adminOnly>
                <AdminDashboard />
              </RequireAuth>
            } />
            
            {/* 404 - Not Found */}
            <Route path="*" element={
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold text-gray-800">404</h1>
                <p className="text-gray-600 mt-2">Page not found</p>
              </div>
            } />
          </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
};

export function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <NotificationsProvider>
            <AppContent />
          </NotificationsProvider>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}