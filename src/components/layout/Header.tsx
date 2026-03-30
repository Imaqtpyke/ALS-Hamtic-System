import React, { useEffect, useState } from 'react';
import { Link, NavLink as RRNavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useDataContext } from '../../DataContext';
import NotificationBell from '../common/NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { students } = useDataContext();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const studentData = user?.role?.role === 'student' ? students.find((s: any) => s.id === user.uid) : null;
  const displayName = studentData?.name || user?.displayName || user?.email?.split('@')[0] || 'User';

  return <header className={`sticky top-0 z-50 transition-all duration-500 ease-in-out ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm' : 'bg-white/70 backdrop-blur-md'}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group touch-target">
              <div className="relative overflow-hidden rounded-full border-2 border-transparent group-hover:border-blue-500 transition-all duration-300">
                <img className="h-10 w-auto transform group-hover:scale-110 transition-transform duration-300" src="/DepED-Logo.jpg" alt="DEPED Logo" />
              </div>
              <div className="ml-3">
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                  ALS <span className="text-[#0038A8]">Enroll</span>ment
                </span>
              </div>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-1 ml-8" role="navigation" aria-label="Primary">
            <RRNavLink to="/" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out relative group touch-target ${isActive ? 'text-[#0038A8]' : 'text-gray-600 hover:text-[#0038A8]'}`}> 
              Home
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0038A8] transform origin-left transition-transform duration-300 ease-in-out scale-x-0 group-hover:scale-x-100" />
            </RRNavLink>
            <RRNavLink
              to="/enrollment"
              className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out relative group touch-target ${isActive ? 'text-[#0038A8]' : 'text-gray-600 hover:text-[#0038A8]'}`}
            >
              Enroll Now
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0038A8] transform origin-left transition-transform duration-300 ease-in-out scale-x-0 group-hover:scale-x-100" />
            </RRNavLink>
            <RRNavLink to="/about" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out relative group touch-target ${isActive ? 'text-[#0038A8]' : 'text-gray-600 hover:text-[#0038A8]'}`}>
              About ALS
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0038A8] transform origin-left transition-transform duration-300 ease-in-out scale-x-0 group-hover:scale-x-100" />
            </RRNavLink>
            <RRNavLink to="/contact" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out relative group touch-target ${isActive ? 'text-[#0038A8]' : 'text-gray-600 hover:text-[#0038A8]'}`}>
              Contact Us
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0038A8] transform origin-left transition-transform duration-300 ease-in-out scale-x-0 group-hover:scale-x-100" />
            </RRNavLink>
          </div>
          <div className="hidden md:flex items-center space-x-4 ml-8">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end">
                   <span className="text-gray-900 text-sm font-bold leading-tight">{displayName}</span>
                   <span className="text-gray-400 text-[10px] uppercase font-black tracking-widest leading-none">{user?.role?.role || 'Guest'}</span>
                </div>
                {user?.role?.role !== 'admin' && (
                  <>
                    <RRNavLink
                      to="/dashboard"
                      className="hidden sm:inline-flex items-center px-4 py-1.5 bg-blue-50 rounded-xl text-xs font-bold text-[#0038A8] hover:bg-blue-100 transition-all shadow-sm"
                    >
                      My Dashboard
                    </RRNavLink>
                    <NotificationBell />
                  </>
                )}
                {user?.role?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="px-4 py-1.5 bg-blue-50 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 transition-all shadow-sm"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={async () => { await logout(); navigate('/'); }}
                  className="px-4 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all touch-target"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="btn-primary py-1.5 px-6 text-sm">
                  Login Access
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center md:hidden ml-4">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none transition-colors duration-200 touch-target" aria-expanded="false">
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-white border-t border-gray-200 shadow-lg overflow-hidden origin-top"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <MobileNavLink to="/" active={location.pathname === '/'} onClick={() => setIsMenuOpen(false)}>
                Home
              </MobileNavLink>
              <Link
                to="/enrollment"
                className={`block px-3 py-3 rounded-md text-base font-medium touch-target ${
                  location.pathname === '/enrollment'
                    ? 'bg-blue-50 text-[#0038A8] border-l-4 border-[#0038A8]'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-[#0038A8]'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Enroll Now
              </Link>
              {user && user.role?.role !== 'admin' && (
                <Link
                  to="/dashboard"
                  className={`block px-3 py-3 rounded-md text-base font-medium touch-target ${
                    location.pathname === '/dashboard'
                      ? 'bg-blue-50 text-[#0038A8] border-l-4 border-[#0038A8]'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-[#0038A8]'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Dashboard
                </Link>
              )}
              <MobileNavLink to="/about" active={location.pathname === '/about'} onClick={() => setIsMenuOpen(false)}>
                About ALS
              </MobileNavLink>
              <MobileNavLink to="/contact" active={location.pathname === '/contact'} onClick={() => setIsMenuOpen(false)}>
                Contact Us
              </MobileNavLink>
              {user ? (
                <div className="pt-2 pb-1 border-t border-gray-100">
                  <p className="px-3 py-2 text-xs text-gray-500 truncate">{user?.email}</p>
                  <div className="flex items-center gap-2 px-3 py-2">
                    {user?.role?.role !== 'admin' && (
                      <NotificationBell />
                    )}
                    {user?.role?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex-1 px-3 py-3 border border-blue-500 rounded-md text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 text-center transition touch-target"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                  </div>
                  <button
                    onClick={async () => { await logout(); setIsMenuOpen(false); navigate('/'); }}
                    className="block w-full px-3 py-3 rounded-md text-center text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 touch-target"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="block w-full px-3 py-3 rounded-md text-center text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 touch-target"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>;
};
type MobileNavLinkProps = { children: React.ReactNode; to: string; active: boolean; onClick?: () => void };
const MobileNavLink: React.FC<MobileNavLinkProps> = ({ children, to, active, onClick }) => {
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        active
          ? 'bg-blue-50 text-[#0038A8] border-l-4 border-[#0038A8]'
          : 'text-gray-700 hover:bg-gray-50 hover:text-[#0038A8]'
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

export default Header;