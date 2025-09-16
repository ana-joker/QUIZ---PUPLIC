import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, TranslationKey } from '../App';

const Navbar = () => {
  const { user, logout, isTeacher, isAdmin, isOwner, isPaid } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
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
          <Link to="/" className="hover:text-purple-400">{t('home')}</Link>
          <Link to="/generate-text" className="hover:text-purple-400">{t('generate')}</Link>
          <Link to="/history" className="hover:text-purple-400">{t('history')}</Link>
          {user && <Link to="/my-courses" className="hover:text-purple-400">{t('myCourses')}</Link>}
          {user && user.role === 'student' && <Link to="/join-course" className="hover:text-purple-400">{t('joinCourse')}</Link>}
          {user && user.role === 'student' && <Link to="/student/dashboard" className="hover:text-purple-400">{t('dashboard')}</Link>}
          {isTeacher && <Link to="/teacher/dashboard" className="hover:text-purple-400">{t('teacherDashboard')}</Link>}
          {(isAdmin || isOwner) && <Link to="/admin/dashboard" className="hover:text-purple-400">{t('adminDashboard')}</Link>}

          {user ? (
            <div className="relative flex items-center space-x-2">
              {/* Badge للخطة والدور */}
              <span className="px-2 py-1 rounded bg-purple-700 text-xs font-bold mr-2">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-bold mr-2 ${isPaid ? 'bg-green-700' : 'bg-gray-700'}`}>{user.plan.toUpperCase()}</span>
              {user.planSource && <span className="px-2 py-1 rounded bg-blue-700 text-xs font-bold mr-2">{user.planSource}</span>}
              {user.planExpiresAt && <span className="text-yellow-400 text-xs">{t('trialEndsOn', { date: new Date(user.planExpiresAt).toLocaleDateString() })}</span>}
              {/* عداد الكوتة اليومي حسب الخطة */}
              {user.currentQuota !== undefined && user.maxQuota !== undefined && (
                <span className="text-sm text-gray-400 mr-4">
                  {t('questionsToday')}: {user.currentQuota}/{user.maxQuota}
                </span>
              )}
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <span className="text-lg font-medium">{user.email}</span>
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
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-slate-50 hover:bg-slate-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      {t('dashboard')}
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-slate-50 hover:bg-slate-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      {t('settingsGeneral')}
                    </Link>
                    <Link
                      to="/my-usage"
                      className="block px-4 py-2 text-sm text-slate-50 hover:bg-slate-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      {t('myUsageTitle')}
                    </Link>
                    <Link
                      to="/manage-devices"
                      className="block px-4 py-2 text-sm text-slate-50 hover:bg-slate-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Manage Devices
                    </Link>
                    <Link
                      to="/billing"
                      className="block px-4 py-2 text-sm text-slate-50 hover:bg-slate-700"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Billing
                    </Link>
                    {isTeacher && (
                      <Link
                        to="/teacher/dashboard"
                        className="block px-4 py-2 text-sm text-slate-50 hover:bg-slate-700"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        {t('teacherDashboard')}
                      </Link>
                    )}
                    {(isAdmin || isOwner) && (
                      <Link
                        to="/admin/dashboard"
                        className="block px-4 py-2 text-sm text-slate-50 hover:bg-slate-700"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        {t('adminDashboard')}
                      </Link>
                    )}
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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">{t('guestQuestionsRemaining', { count: 10 })}</span>
              <Link to="/login" className="text-slate-50 hover:text-purple-400 transition-colors duration-200">{t('login')}</Link>
              <Link to="/register" className="text-slate-50 hover:text-purple-400 transition-colors duration-200">{t('register')}</Link>
            </div>
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
            <Link to="/" className="block px-4 py-2 hover:bg-slate-700" onClick={() => setIsMobileMenuOpen(false)}>{t('home')}</Link>
            <Link to="/generate-text" className="block px-4 py-2 hover:bg-slate-700" onClick={() => setIsMobileMenuOpen(false)}>{t('generate')}</Link>
            <Link to="/history" className="block px-4 py-2 hover:bg-slate-700" onClick={() => setIsMobileMenuOpen(false)}>{t('history')}</Link>
            {user && <Link to="/my-courses" className="block px-4 py-2 hover:bg-slate-700" onClick={() => setIsMobileMenuOpen(false)}>{t('myCourses')}</Link>}
            {user && user.role === 'student' && <Link to="/join-course" className="block px-4 py-2 hover:bg-slate-700" onClick={() => setIsMobileMenuOpen(false)}>{t('joinCourse')}</Link>}
            {user && user.role === 'student' && <Link to="/student/dashboard" className="block px-4 py-2 hover:bg-slate-700" onClick={() => setIsMobileMenuOpen(false)}>{t('dashboard')}</Link>}
            {isTeacher && (
              <Link to="/teacher/dashboard" className="block px-4 py-2 hover:bg-slate-700" onClick={() => setIsMobileMenuOpen(false)}>{t('teacherDashboard')}</Link>
            )}
            {(isAdmin || isOwner) && (
              <Link to="/admin/dashboard" className="block px-4 py-2 hover:bg-slate-700" onClick={() => setIsMobileMenuOpen(false)}>{t('adminDashboard')}</Link>
            )}
            {user ? (
              <div className="flex flex-col">
                {user.currentQuota !== undefined && user.maxQuota !== undefined && (
                  <span className="px-4 py-2 text-slate-50">
                    {t('questionsToday')}: {user.currentQuota}/{user.maxQuota}
                  </span>
                )}
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 text-slate-50 hover:bg-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('dashboard')}
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-slate-50 hover:bg-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('settingsGeneral')}
                </Link>
                <Link
                  to="/my-usage"
                  className="block px-4 py-2 text-slate-50 hover:bg-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('myUsageTitle')}
                </Link>
                <Link
                  to="/manage-devices"
                  className="block px-4 py-2 text-sm text-slate-50 hover:bg-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Manage Devices
                </Link>
                <Link
                  to="/billing"
                  className="block px-4 py-2 text-sm text-slate-50 hover:bg-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Billing
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
                  {t('guestQuestionsRemaining', { count: 10 })}
                  <p className="text-xs text-gray-500 mt-1">{t('registerNowPrompt')}</p>
                </span>
                <Link
                  to="/login"
                  className="block px-4 py-2 text-slate-50 hover:bg-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 text-slate-50 hover:bg-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('register')}
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