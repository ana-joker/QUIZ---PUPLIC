import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getQuizzesFromIndexedDB, deleteQuizFromIndexedDB } from '../services/indexedDbService';
import { Quiz } from '../types';
import { useTranslation } from '../App'; // Assuming useTranslation is exported from App.tsx
import { useQuiz } from '../context/QuizContext';

interface HistoryPageProps {
  onBack: () => void;
  onRetake: (quiz: Quiz) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onBack, onRetake }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const { setQuizToResume } = useQuiz();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const storedQuizzes = await getQuizzesFromIndexedDB();
        // Sort by savedAt date, newest first
        storedQuizzes.sort((a, b) => new Date(b.savedAt || '').getTime() - new Date(a.savedAt || '').getTime());
        setQuizzes(storedQuizzes);
      } catch (err) {
        console.error('Error loading quiz history:', err);
        setError(t('errorLoadingHistory'));
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [t]);

  const handleDeleteQuiz = async (id: string | undefined) => {
    if (!id) return;
    if (window.confirm(t('confirmDeleteQuiz'))) {
      try {
        await deleteQuizFromIndexedDB(id);
        setQuizzes(prevQuizzes => prevQuizzes.filter(quiz => quiz.id !== id));
      } catch (err) {
        console.error('Error deleting quiz:', err);
        setError(t('errorDeletingQuiz'));
      }
    }
  };

  const handleRecallQuiz = (quiz: Quiz) => {
    setQuizToResume(quiz);
    // Navigate to the quiz flow or a specific recall page
    // For now, we'll just pass it up to the parent (App.tsx) to handle navigation
    onRetake(quiz);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 p-8 flex justify-center items-center">
        <p>{t('loadingHistory')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 p-8 flex justify-center items-center">
        <p className="text-red-500">{error}</p>
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
      <h1 className="text-4xl font-bold mb-8 text-purple-600">{t('quizHistory')}</h1>

      {quizzes.length === 0 ? (
        <p className="text-slate-400">{t('noHistory')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-slate-800 rounded-2xl shadow-soft p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-100 mb-2">{quiz.quizTitle || t('untitledQuiz')}</h2>
                {quiz.savedAt && (
                  <p className="text-sm text-slate-400 mb-4">
                    {t('date')}: {new Date(quiz.savedAt).toLocaleDateString()}
                  </p>
                )}
                {quiz.score !== undefined && quiz.total !== undefined && (
                  <p className="text-md text-slate-300 mb-4">
                    {t('score')}: {quiz.score} / {quiz.total}
                  </p>
                )}
              </div>
              <div className="flex space-x-3 mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRecallQuiz(quiz)}
                  className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {t('recallSession')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  className="py-2 px-4 rounded-lg bg-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {t('delete')}
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default HistoryPage;
