import React from 'react';
import { QuizState } from '../types';
import { AwardIcon, RefreshCwIcon, HomeIcon, ReviewIcon } from './ui/Icons';
import { useTranslation } from '../App';

interface ResultsPageProps {
  quizState: QuizState;
  onReview: () => void;
  onRetake: () => void;
  onNewQuiz: () => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ quizState, onReview, onRetake, onNewQuiz }) => {
  const score = quizState.userAnswers.filter(a => a.isCorrect).length;
  const total = quizState.quizData.length;
  const percentage = total > 0 ? (score / total) * 100 : 0;
  const { t } = useTranslation();
  
  const passPercentageThreshold = 60;
  const isPassed = percentage >= passPercentageThreshold;

  const passMessages = ["Excellent work!", "Great job, you've mastered this topic!", "Fantastic score!"];
  const failMessages = ["Good effort, keep practicing!", "Don't worry, review your answers and try again.", "Every expert was once a beginner."];
  const message = isPassed ? passMessages[Math.floor(Math.random() * passMessages.length)] : failMessages[Math.floor(Math.random() * failMessages.length)];
  
  const timeTaken = quizState.startTime ? Math.floor((Date.now() - quizState.startTime) / 1000) : 0;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
      <AwardIcon className={`w-16 h-16 mx-auto mb-4 ${isPassed ? 'text-green-500' : 'text-yellow-500'}`} />
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t("quizComplete")}</h2>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{t("yourScore")}</p>
      <p className="text-5xl font-bold my-2 text-teal-500">
        {score} <span className="text-3xl text-gray-500 dark:text-gray-400">/ {total}</span>
      </p>
      <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300">{percentage.toFixed(1)}%</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t("timeTaken")} {Math.floor(timeTaken / 60).toString().padStart(2, '0')}:{(timeTaken % 60).toString().padStart(2, '0')}
      </p>
      
      <div className={`mt-6 p-4 rounded-lg ${isPassed ? 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
        <p className="font-semibold">{message}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={onReview} className="flex flex-col items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition text-gray-700 dark:text-gray-200 font-medium">
            <ReviewIcon className="w-6 h-6" />
            <span>{t("reviewAnswers")}</span>
        </button>
        <button onClick={onRetake} className="flex flex-col items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition text-gray-700 dark:text-gray-200 font-medium">
            <RefreshCwIcon className="w-6 h-6" />
            <span>{t("retakeQuiz")}</span>
        </button>
        <button onClick={onNewQuiz} className="flex flex-col items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition text-gray-700 dark:text-gray-200 font-medium">
            <HomeIcon className="w-6 h-6" />
            <span>{t("newQuiz")}</span>
        </button>
      </div>
    </div>
  );
};

export default ResultsPage;