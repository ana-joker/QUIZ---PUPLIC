import React, { useEffect, useState, useCallback } from 'react';
import { Quiz } from '../types'; 
import { HomeIcon, RefreshCwIcon, Trash2Icon } from './ui/Icons';
import { useTranslation } from '../App';
import { getQuizzesFromIndexedDB, deleteQuizFromIndexedDB } from '../services/indexedDbService';

// Define a type for the saved quiz to be displayed in HistoryPage
interface SavedQuizDisplay {
  id: string; // ID from IndexedDB
  title: string;
  savedAt: string; // ISO string date of saving
  score?: number; // Might not be available if quiz not completed
  total?: number;
  percentage?: string;
  timeTaken?: string;
  quizData: Quiz; // The actual generated quiz
}

interface HistoryPageProps {
  onBack: () => void;
  onRetake: (quiz: Quiz) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onBack, onRetake }) => {
  const { t } = useTranslation();
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuizDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const quizzesFromDB: Quiz[] = await getQuizzesFromIndexedDB();
      // Transform data from IndexedDB to the required display format
      const formattedQuizzes: SavedQuizDisplay[] = quizzesFromDB.map(dbQuiz => ({
        id: dbQuiz.id!, // id will exist for saved quizzes
        title: dbQuiz.quizTitle || t("untitledQuiz"),
        savedAt: dbQuiz.savedAt!,
        score: dbQuiz.score,
        total: dbQuiz.total,
        percentage: dbQuiz.percentage,
        timeTaken: dbQuiz.timeTaken,
        quizData: dbQuiz
      }));
      setSavedQuizzes(formattedQuizzes.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())); // Sort by newest first
    } catch (err: any) {
      console.error("Error loading quizzes from IndexedDB:", err);
      setError(t("errorLoadingHistory") || "Failed to load quiz history.");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleDeleteQuiz = async (id: string) => {
    if (window.confirm(t("confirmDeleteQuiz") || "Are you sure you want to delete this quiz?")) {
      try {
        await deleteQuizFromIndexedDB(id);
        // Reload list after deletion
        await loadQuizzes();
      } catch (err: any) {
        console.error("Error deleting quiz from IndexedDB:", err);
        setError(t("errorDeletingQuiz") || "Failed to delete quiz.");
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">{t("loadingHistory") || "Loading quiz history..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 bg-red-100 dark:bg-red-900 rounded-2xl shadow-lg border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">{t("quizHistory")}</h2>
        <button onClick={onBack} className="flex items-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition font-medium">
            <HomeIcon className="w-5 h-5"/>
            <span>{t("backToCreator")}</span>
        </button>
      </div>
      
      {savedQuizzes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">{t("noHistory")}</p>
        </div>
      ) : (
        <div className="space-y-4">
            {savedQuizzes.map((entry) => (
                <div key={entry.id} className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{entry.title}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span><strong>{t("date")}:</strong> {new Date(entry.savedAt).toLocaleDateString()}</span>
                            {entry.score !== undefined && entry.total !== undefined && (
                              <span><strong>{t("score")}:</strong> {entry.score}/{entry.total} ({entry.percentage})</span>
                            )}
                            {entry.timeTaken && <span><strong>{t("time")}:</strong> {entry.timeTaken}</span>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onRetake(entry.quizData)} className="flex items-center gap-2 py-2 px-4 bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/50 dark:text-teal-200 dark:hover:bg-teal-900 rounded-lg transition font-semibold text-sm shrink-0">
                          <RefreshCwIcon className="w-4 h-4" />
                          <span>{t("retakeQuiz")}</span>
                      </button>
                       <button onClick={() => handleDeleteQuiz(entry.id)} className="flex items-center gap-2 py-2 px-4 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900 rounded-lg transition font-semibold text-sm shrink-0" aria-label={`Delete quiz titled ${entry.title}`}>
                          <Trash2Icon className="w-4 h-4" />
                          <span>{t("delete")}</span>
                      </button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;