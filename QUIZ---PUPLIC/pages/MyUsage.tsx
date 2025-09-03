import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../App';

const MyUsage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) {
    // This case should ideally be handled by PrivateRoute, but as a fallback
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-50 p-4">
        <p>{t('loadingUserData')}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-900 text-slate-50 p-8"
    >
      <h1 className="text-4xl font-bold mb-8 text-purple-600">{t('myUsageTitle')}</h1>

      <div className="bg-slate-700 rounded-2xl shadow-xl p-6 space-y-6">
        <h2 className="text-2xl font-semibold text-purple-400 mb-4">{t('accountDetails')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400">{t('planType')}</p>
            <p className="text-lg font-medium text-white capitalize">{user.planType}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400">{t('questionsToday')}</p>
            <p className="text-lg font-medium text-white">{user.currentQuota} / {user.maxQuota}</p>
          </div>
          {user.quotaResetDate && (
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">{t('quotaResets')}</p>
              <p className="text-lg font-medium text-white">{new Date(user.quotaResetDate).toLocaleDateString()}</p>
            </div>
          )}
          {user.isTrialActive && user.trialEndDate && (
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">{t('trialEnds')}</p>
              <p className="text-lg font-medium text-yellow-400">{new Date(user.trialEndDate).toLocaleDateString()}</p>
            </div>
          )}
          {/* Placeholder for lastActivity - requires backend implementation */}
          {/* <div className="bg-slate-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400">{t('lastActivity')}</p>
            <p className="text-lg font-medium text-white">Not available</p>
          </div> */}
        </div>

        {(user.planType === 'free' || user.planType === 'guest') && (
          <div className="pt-6 border-t border-slate-600">
            <Link
              to="/upgrade" // Assuming an upgrade page route
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
            >
              {t('upgradeToPremium')}
            </Link>
          </div>
        )}

        {/* Future: Join Course Button */}
        {/* <div className="pt-4 border-t border-slate-600">
          <button
            onClick={() => console.log('Join Course clicked')}
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t('joinCourse')}
          </button>
        </div> */}
      </div>
    </motion.div>
  );
};

export default MyUsage;