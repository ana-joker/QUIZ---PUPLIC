
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../App';
import QuizRenderer from '../components/QuizRenderer';
import { saveQuizToIndexedDB } from '../services/indexedDbService';
import { Quiz } from '../types';

const GenerateFromMaterial: React.FC = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [materialName, setMaterialName] = useState(''); // To display the material name

  // Optional: Fetch material details to show name, etc.
  // This part can be expanded later.
  useEffect(() => {
    // For now, we just use the ID. A future improvement could be to fetch material details.
    if (!materialId) {
      setError(t('errorNoMaterialId'));
      navigate('/student/dashboard');
    }
  }, [materialId, navigate, t]);

  const handleGenerateQuiz = async () => {
    if (!materialId) return;

    setLoading(true);
    setError('');
    setQuizData(null);

    try {
      const response = await api.post(`/api/quiz/material/${materialId}`);
      await saveQuizToIndexedDB(response.data);
      setQuizData(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('errorGeneratingQuiz');
      setError(errorMessage);
      console.error('Error generating quiz from material:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-900 text-slate-50 p-8"
    >
      <h1 className="text-4xl font-bold mb-8 text-purple-600">{t('generateFromMaterial')}</h1>
      
      {quizData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-700 rounded-2xl shadow-soft p-6"
        >
          <h2 className="text-2xl font-semibold mb-4">{t('generatedQuiz')}</h2>
          <QuizRenderer quizData={quizData} />
        </motion.div>
      ) : (
        <div className="text-center bg-slate-800 p-8 rounded-2xl">
          <p className="text-lg text-slate-300 mb-6">{t('readyToGenerateFromMaterial')} <strong>{materialId}</strong></p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerateQuiz}
            disabled={loading}
            className="py-3 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {loading ? t('generating') : t('startQuizGeneration')}
          </motion.button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      )}
    </motion.div>
  );
};

export default GenerateFromMaterial;
