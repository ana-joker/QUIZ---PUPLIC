import React from 'react';
import { QuizHistoryEntry, Quiz } from '../types';
import { HomeIcon, RefreshCwIcon } from './ui/Icons';
import { useTranslation } from '../App';

interface HistoryPageProps {
  history: QuizHistoryEntry[];
  onBack: () => void;
  onRetake: (quiz: Quiz) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ history, onBack, onRetake }) => {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">{t("quizHistory")}</h2>
        <button onClick={onBack} className="flex items-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition font-medium">
            <HomeIcon className="w-5 h-5"/>
            <span>{t("backToCreator")}</span>
        </button>
      </div>
      
      {history.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">{t("noHistory")}</p>
        </div>
      ) : (
        <div className="space-y-4">
            {history.map((entry, index) => (
                <div key={index} className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{entry.title}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span><strong>{t("date")}</strong> {entry.date}</span>
                            <span><strong>{t("score")}</strong> {entry.score}/{entry.total} ({entry.percentage}%)</span>
                            <span><strong>{t("time")}</strong> {entry.timeTaken}</span>
                        </div>
                    </div>
                    <button onClick={() => onRetake(entry.quizData)} className="flex items-center gap-2 py-2 px-4 bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/50 dark:text-teal-200 dark:hover:bg-teal-900 rounded-lg transition font-semibold text-sm shrink-0">
                        <RefreshCwIcon className="w-4 h-4" />
                        <span>{t("retakeQuiz")}</span>
                    </button>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;