import React, { useState, useEffect } from 'react';
import { RecallItem, Question } from '../types';
import { RECALL_STORAGE_KEY } from '../constants';
import { HomeIcon, EyeIcon } from './ui/Icons';
import QuestionDisplay from './QuestionDisplay';
import { useTranslation } from '../App';

interface RecallPageProps {
  onBack: () => void;
  dueRecallItems: RecallItem[];
}

const RecallPage: React.FC<RecallPageProps> = ({ onBack, dueRecallItems: initialDueItems }) => {
  const [dueItems, setDueItems] = useState<RecallItem[]>(initialDueItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const { t, lang } = useTranslation();
  
  const currentItem = dueItems.length > 0 ? dueItems[currentIndex] : null;

  const updateRecallItem = (itemId: number, performance: 'forgot' | 'good' | 'easy') => {
    const deck: RecallItem[] = JSON.parse(localStorage.getItem(RECALL_STORAGE_KEY) || '[]');
    const itemIndex = deck.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    let item = deck[itemIndex];
    const oneDay = 24 * 60 * 60 * 1000;
    
    switch (performance) {
      case 'forgot':
        item.interval = 1;
        item.easeFactor = Math.max(1.3, item.easeFactor - 0.2);
        break;
      case 'good':
        item.interval = Math.ceil(item.interval * item.easeFactor);
        break;
      case 'easy':
        item.interval = Math.ceil(item.interval * item.easeFactor * 1.3);
        item.easeFactor += 0.15;
        break;
    }
    item.nextReviewDate = Date.now() + item.interval * oneDay;
    deck[itemIndex] = item;
    localStorage.setItem(RECALL_STORAGE_KEY, JSON.stringify(deck));
    
    // Move to next item
    setShowAnswer(false);
    if (currentIndex < dueItems.length - 1) {
        setCurrentIndex(currentIndex + 1);
    } else {
        // End of session
        setDueItems([]); // Empty the list to show completion message
    }
  };

  useEffect(() => {
    setShowAnswer(false);
  }, [currentIndex]);

  if (dueItems.length === 0) {
    return (
        <div className="max-w-2xl mx-auto text-center">
             <div className="flex justify-center mb-8">
                <h2 className="text-3xl font-bold">{t("recallHub")}</h2>
            </div>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-green-600">{t("allDone")}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{t("noRecallItems")}</p>
                <button onClick={onBack} className="mt-6 flex items-center gap-2 mx-auto py-2 px-4 bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition font-medium">
                    <HomeIcon className="w-5 h-5"/>
                    <span>{t("backToCreator")}</span>
                </button>
            </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / dueItems.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">{t("recallSession")}</h2>
        <span className="font-semibold text-gray-500 dark:text-gray-400">{currentIndex + 1} / {dueItems.length}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>

      {currentItem && (
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{currentItem.questionData.question}</h3>
          
          {currentItem.questionData.caseDescription && (
            <div className="mb-4 p-4 bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500 rounded-r-lg">
              <h3 className="font-bold text-teal-800 dark:text-teal-300">{t("caseScenario")}</h3>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{currentItem.questionData.caseDescription}</p>
            </div>
          )}

          {showAnswer ? (
            <div>
              <div className={`p-4 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-gray-400 dark:border-gray-600 rounded-r-lg text-sm text-gray-700 dark:text-gray-300 ${lang === 'ar' ? 'font-tajawal' : ''}`}
                   dangerouslySetInnerHTML={{ __html: `<strong>${t("answer")}:</strong> ${currentItem.questionData.explanation.replace(/\n/g, '<br />')}`}}
              />
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => updateRecallItem(currentItem.id, 'forgot')} className="py-2 px-4 bg-red-100 text-red-800 font-semibold rounded-lg hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 transition">{t("forgot")}</button>
                <button onClick={() => updateRecallItem(currentItem.id, 'good')} className="py-2 px-4 bg-yellow-100 text-yellow-800 font-semibold rounded-lg hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900 transition">{t("good")}</button>
                <button onClick={() => updateRecallItem(currentItem.id, 'easy')} className="py-2 px-4 bg-green-100 text-green-800 font-semibold rounded-lg hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900 transition">{t("easy")}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAnswer(true)} className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition">
              <EyeIcon className="w-5 h-5" />
              <span>{t("showAnswer")}</span>
            </button>
          )}
        </div>
      )}
       <div className="text-center mt-6">
          <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              {t("exitSession")}
          </button>
      </div>
    </div>
  );
};

export default RecallPage;