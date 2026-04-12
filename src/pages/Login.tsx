import React, { useState } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, User, ChevronLeft as ChevronLeftIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { toast } from 'react-hot-toast';

const Login = () => {
  const { login, loginWithGoogle, register, resendVerification, resetPassword, error: authError, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [resending, setResending] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Get redirect path from location state or default to home
  // Removed unused 'from' variable as navigation is now handled by AuthProvider

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (error) setError('');
    if (authError) clearError();
  };

  const handleResendVerification = async () => {
    try {
      setResending(true);
      await resendVerification(formData.email, formData.password);
      toast.success('Verification email sent. Please check your inbox (and Spam).');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegister) {
        await register(formData.email, formData.password, formData.displayName);
        toast.success('Registration successful! A verification email has been sent. Please verify your email before logging in.');
        setIsRegister(false); // Switch to login form after registration
      } else {
        await login(formData.email, formData.password);
        // Navigation will happen automatically via the AuthProvider's onAuthStateChanged
      }
    } catch (err: any) {
      const msg = err?.message || (isRegister ? 'Registration failed' : 'Login failed. Please try again.');
      setError(msg);
      if (msg.toLowerCase().includes('not verified')) {
        toast.error('Your email is not verified. Please check your inbox or resend the verification email.');
      } else if (msg.toLowerCase().includes('access denied')) {
        toast.error('Access denied for this login type. Switch between Student/Admin as appropriate.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      await loginWithGoogle();
      // Navigation will happen automatically via the AuthProvider's onAuthStateChanged
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Enter your email first.');
      return;
    }
    try {
      setResetting(true);
      await resetPassword(formData.email);
      toast.success('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send password reset email');
    } finally {
      setResetting(false);
    }
  };

  return <div className="min-h-screen relative flex items-center justify-center py-6 md:py-10">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-14 w-72 h-72 bg-red-200/30 rounded-full blur-3xl animate-pulse" />
      </div>
      <div className="w-full max-w-md mx-auto px-4 sm:px-6">
        <div className="text-center mb-6">
          <img className="h-16 w-auto mx-auto" src="/DepED-Logo.jpg" alt="DEPED Logo" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            ALS Enrollment System
          </h1>
          <p className="mt-2 text-gray-600">
            {isRegister ? 'Register a new account' : 'Sign in to your account'}
          </p>
        </div>
        <div className="bg-white/95 rounded-xl border border-blue-100 shadow-2xl ring-1 ring-black/5 p-6 md:p-8">
          {/* Admin toggle removed: admin login is only accessible via /admin/login */}
          {error && <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  {error.toLowerCase().includes('not verified') && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                        disabled={resending || isLoading}
                      >
                        {resending ? 'Sending...' : 'Resend verification email'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <input 
                    type="text" 
                    id="displayName" 
                    name="displayName" 
                    value={formData.displayName} 
                    onChange={handleChange} 
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500" 
                    placeholder="Your full name" 
                    required={isRegister} 
                  />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500" placeholder="••••••••" required />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="rememberMe" name="rememberMe" type="checkbox" checked={formData.rememberMe} onChange={handleChange} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm text-right">
                <a href="#" onClick={handleForgotPassword} className="font-medium text-red-600 hover:text-red-500 disabled:opacity-50" aria-disabled={resetting}>
                  Forgot your password?
                </a>
              </div>
            </div>
            <div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm hover:shadow transition-all duration-200 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                {isLoading ? <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isRegister ? 'Registering...' : 'Signing in...'}
                  </span> : isRegister ? 'Register' : 'Sign in'}
              </button>
            </div>
          </form>
          {/* Google Sign In Button */}
          {!isRegister && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm hover:shadow transition-all duration-200 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48">
                  <g>
                    <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.36 30.77 0 24 0 14.82 0 6.71 5.48 2.69 13.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/>
                    <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.02l7.19 5.59C43.93 37.13 46.1 31.36 46.1 24.55z"/>
                    <path fill="#FBBC05" d="M10.67 28.09c-1.01-2.99-1.01-6.19 0-9.18l-7.98-6.2C.64 16.36 0 20.07 0 24s.64 7.64 2.69 11.29l7.98-6.2z"/>
                    <path fill="#EA4335" d="M24 48c6.48 0 11.92-2.15 15.89-5.85l-7.19-5.59c-2.01 1.35-4.59 2.15-8.7 2.15-6.38 0-11.87-3.63-13.33-8.79l-7.98 6.2C6.71 42.52 14.82 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </g>
                </svg>
                {isLoading ? 'Signing in with Google...' : 'Sign in with Google'}
              </button>
            </div>
          )}
          <div className="mt-6 text-center text-sm text-gray-600">
            {isRegister ? (
              <p>
                Already have an account?{' '}
                <button className="font-medium text-red-600 hover:text-red-500" onClick={() => setIsRegister(false)}>
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button className="font-medium text-red-600 hover:text-red-500" onClick={() => setIsRegister(true)}>
                  Register
                </button>
              </p>
            )}
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm font-bold text-[#0038A8] hover:text-blue-700 flex items-center justify-center gap-2">
             <ChevronLeftIcon className="w-4 h-4" />
             Back to Home Page
          </Link>
          <p className="text-sm text-gray-500 mt-6">
            © {new Date().getFullYear()} Department of Education - ALS Hamtic,
            Antique
          </p>
        </div>
      </div>
    </div>;
};
export default Login;