import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, TranslationKey } from '../App';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <nav className="bg-slate-900 text-slate-50 p-4 shadow-lg relative z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
          QUIZ TIME
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="relative">
              <span className="text-sm text-gray-400 mr-4">
                {t('remainingQuestionsInfo', { current: user.currentQuota, total: user.maxQuota })}
                {user.isTrialActive && (
                  <span className="ml-2 text-yellow-400">
                    ({t('trialEndsOn', { date: new Date(user.trialEndDate).toLocaleDateString() })})
                  </span>
                )}
              </span>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <span className="text-lg font-medium">Hi {user.name || 'User'}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={dropdownVariants}
                    className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg py-1 z-50"
                  >
                    <Link
                      to="/profile" // Assuming a profile page
                      className="block px-4 py-2 text-sm text-slate-50 hover:bg-slate-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-slate-50 hover:bg-slate-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-400 hover:bg-slate-700"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400 mr-4">
                {t('guestQuestionsRemaining', { current: user?.currentQuota || 0, total: user?.maxQuota || 0 })}
                <p className="text-xs text-gray-500 mt-1">{t('registerNowPrompt')}</p>
              </span>
              <Link
                to="/login"
                className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
              >
                {t('register')} {/* Changed to use the same style as login button */}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={toggleMobileMenu} className="text-slate-50 focus:outline-none">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={dropdownVariants} // Reusing dropdown variants for slide-down effect
            className="md:hidden bg-slate-800 absolute top-full left-0 w-full shadow-lg py-2"
          >
            {user ? (
              <div className="flex flex-col">
                <span className="px-4 py-2 text-slate-50">
                  {t('remainingQuestionsInfo', { current: user.currentQuota, total: user.maxQuota })}
                  {user.isTrialActive && (
                    <span className="ml-2 text-yellow-400">
                      (فترتك التجريبية تنتهي في {new Date(user.trialEndDate).toLocaleDateString()})
                    </span>
                  )}
                </span>
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-slate-50 hover:bg-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-slate-50 hover:bg-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-400 hover:bg-slate-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="px-4 py-2 text-slate-50">
                  أسئلة الضيف المتبقية: {user?.currentQuota || 0} / {user?.maxQuota || 0}
                  <p className="text-xs text-gray-500 mt-1">سجل الآن للحصول على المزيد من الأسئلة!</p>
                </span>
                <Link
                  to="/login"
                  className="block px-4 py-2 text-slate-50 hover:bg-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 text-slate-50 hover:bg-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;