import React, { useState } from 'react';
import { motion } from 'framer-motion';
import QuizRenderer from '../components/QuizRenderer'; // Assuming QuizRenderer will be here
import { useAuth } from '../context/AuthContext';

const GenerateText: React.FC = () => {
  const [text, setText] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { deviceId, token } = useAuth();

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setError('');
    setQuizData(null);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (deviceId) {
      headers['x-device-id'] = deviceId;
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch('/api/quiz/text', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setQuizData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz. Please try again.');
      console.error('Error generating quiz from text:', err);
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
      <h1 className="text-4xl font-bold mb-8 text-purple-600">Generate Quiz from Text</h1>

      <div className="bg-slate-700 rounded-2xl shadow-soft p-6 mb-8">
        <textarea
          className="w-full h-48 p-4 rounded-lg bg-slate-800 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
          placeholder="Enter your text here to generate a quiz..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerateQuiz}
          disabled={loading || text.trim() === ''}
          className="mt-4 w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Quiz'}
        </motion.button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      {quizData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-slate-700 rounded-2xl shadow-soft p-6"
        >
          <h2 className="text-2xl font-semibold mb-4">Generated Quiz</h2>
          <QuizRenderer quizData={quizData} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default GenerateText;
