import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  // Placeholder for user name and quota
  const userName = "Ahmed";
  const currentQuota = 12;
  const maxQuota = 30;
  const quotaPercentage = (currentQuota / maxQuota) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-900 text-slate-50 p-8"
    >
      <h1 className="text-4xl font-bold mb-8 text-purple-600">Hi {userName} 👋</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Quota Card */}
        <div className="bg-slate-700 rounded-2xl shadow-soft p-6">
          <h2 className="text-xl font-semibold mb-4">Daily Usage Quota</h2>
          <div className="w-full bg-slate-800 rounded-full h-4 mb-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-purple-500 h-4 rounded-full"
              style={{ width: `${quotaPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-300">{currentQuota}/{maxQuota} quizzes generated today</p>
        </div>

        {/* Generate Quiz Card */}
        <div className="bg-slate-700 rounded-2xl shadow-soft p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-4">Generate New Quiz</h2>
          <Link to="/generate-text" className="w-full mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Generate from Text
            </motion.button>
          </Link>
          <Link to="/generate-pdf" className="w-full">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Generate from PDF
            </motion.button>
          </Link>
        </div>

        {/* Join Course Card */}
        <div className="bg-slate-700 rounded-2xl shadow-soft p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-4">Courses</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 px-6 rounded-2xl bg-teal-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Join a Course (Code)
          </motion.button>
        </div>
      </div>

      {/* Navigation Links (Sidebar/Navbar alternative for now) */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Quick Navigation</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">Home</Link>
          <Link to="/history" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">History</Link>
          <Link to="/recall" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">Recall Hub</Link>
          {/* <Link to="/my-courses" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">My Courses</Link> */}
          <Link to="/settings" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">Settings</Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
