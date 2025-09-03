import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-50 relative overflow-hidden"
    >
      {/* Background Pattern (Placeholder for SVG) */}
      <div className="absolute inset-0 z-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(ellipse at top, #e9d5ff, #c4b5fd 80%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}></div>

      <div className="relative z-10 flex flex-col items-center justify-center p-4">
        {/* Title */}
        <h1 className="text-6xl md:text-7xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent text-center leading-tight">
          QUIZ TIME
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-300 mb-12 text-center max-w-2xl">
          Generate smart quizzes from your study materials.
        </p>

        {/* Central Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-slate-700 p-8 rounded-2xl shadow-xl flex flex-col items-center space-y-6 w-full max-w-md"
        >
          <h2 className="text-2xl font-semibold text-slate-50">Create Your Quiz</h2>
          <Link to="/generate-text" className="w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Generate from Text
            </motion.button>
          </Link>
          <Link to="/generate-pdf" className="w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Generate from PDF
            </motion.button>
          </Link>
        </motion.div>

        {/* Links below */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-lg">
          <Link to="/history" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">
            History
          </Link>
          <Link to="/recall" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">
            Recall Hub
          </Link>
          <Link to="/settings" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">
            Settings
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;