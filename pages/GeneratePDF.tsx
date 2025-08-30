import React, { useState } from 'react';
import { motion } from 'framer-motion';
import QuizRenderer from '../components/QuizRenderer'; // Assuming QuizRenderer will be here
import { useAuth } from '../context/AuthContext';

const GeneratePDF: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { deviceId, token } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    setError('');
    setQuizData(null);

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    const headers: HeadersInit = {};

    if (deviceId) {
      headers['x-device-id'] = deviceId;
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch('/api/quiz/pdf', {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setQuizData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz from PDF. Please try again.');
      console.error('Error generating quiz from PDF:', err);
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
      <h1 className="text-4xl font-bold mb-8 text-purple-600">Generate Quiz from PDF</h1>

      <div className="bg-slate-700 rounded-2xl shadow-soft p-6 mb-8">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
        />
        {selectedFile && (
          <p className="mt-2 text-sm text-slate-300">Selected file: {selectedFile.name}</p>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerateQuiz}
          disabled={loading || !selectedFile}
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

export default GeneratePDF;
