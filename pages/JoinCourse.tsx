import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../context/AuthContext'; // Import useAuthStore
import { useToast } from '../App'; // Import useToast

const JoinCourse: React.FC = () => {
  const [courseCode, setCourseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, fetchMe } = useAuthStore(); // Get login and fetchMe functions from AuthStore
  const { addToast } = useToast(); // Get addToast function

  const handleJoinCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (courseCode.trim() === '') {
  setError('يرجى إدخال كود الدورة.');
  addToast('يرجى إدخال كود الدورة.', 'warning');
  return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/courses/join', { code: courseCode });
      if (response.data && response.data.course) {
        await fetchMe();
        addToast(`تم الانضمام بنجاح إلى الكورس: ${response.data.course.title}`, 'success');
        navigate(`/courses/${response.data.course.id}`);
      } else {
        throw new Error('لم يتم العثور على الكورس أو الكود غير صحيح.');
      }

    } catch (err: any) {
  const errorMessage = err.response?.data?.message || err.message || 'فشل الانضمام للكورس. يرجى التأكد من الكود والمحاولة مرة أخرى.';
  setError(errorMessage);
  addToast(errorMessage, 'error');
  console.error('Error joining course:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-50 p-4"
    >
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-500">Join a Course</h1>
        <p className="text-center text-slate-400 mb-6">Enter the course code provided by your teacher to get access to the course materials.</p>
        <form onSubmit={handleJoinCourse}>
          <div className="mb-4">
            <label htmlFor="courseCode" className="block text-sm font-medium text-slate-300 mb-2">
              Course Code
            </label>
            <input
              id="courseCode"
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-700 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., AB12CD"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Now'}
          </motion.button>
          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </form>
      </div>
    </motion.div>
  );
};

export default JoinCourse;