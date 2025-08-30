import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RecallItem, Question } from '../types';
import { useTranslation } from '../App'; // Assuming useTranslation is exported from App.tsx

interface RecallPageProps {
  onBack: () => void;
  dueRecallItems: RecallItem[]; // This would typically be fetched from IndexedDB or a service
}

const RecallPage: React.FC<RecallPageProps> = ({ onBack, dueRecallItems }) => {
  const { t } = useTranslation();
  const [currentRecallItem, setCurrentRecallItem] = useState<RecallItem | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [itemIndex, setItemIndex] = useState(0);

  useEffect(() => {
    if (dueRecallItems && dueRecallItems.length > 0) {
      setCurrentRecallItem(dueRecallItems[itemIndex]);
    } else {
      setCurrentRecallItem(null);
    }
  }, [dueRecallItems, itemIndex]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleNextItem = () => {
    setShowAnswer(false);
    setItemIndex(prevIndex => (prevIndex + 1) % dueRecallItems.length);
  };

  const formatCorrectAnswer = (questionData: Question): React.ReactNode => {
    const { correctAnswer } = questionData;

    if (typeof correctAnswer === 'string') {
      return correctAnswer;
    }

    if (Array.isArray(correctAnswer)) {
      if (correctAnswer.length > 0 && typeof correctAnswer[0] === 'string') {
        return (
          <ol className="list-decimal list-inside">
            {(correctAnswer as string[]).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        );
      }
      if (correctAnswer.length > 0 && typeof correctAnswer[0] === 'object' && 'prompt' in correctAnswer[0]) {
          return (
              <ul className="list-disc list-inside">
                  {(correctAnswer as { prompt: string; answer: string }[]).map((item, index) => (
                      <li key={index}><strong>{item.prompt}:</strong> {item.answer}</li>
                  ))}
              </ul>
          );
      }
    }

    // Fallback for unexpected formats, though it shouldn't be reached with proper data
    return <p>Could not display answer.</p>;
  };

  if (!dueRecallItems || dueRecallItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-slate-900 text-slate-50 p-8 flex justify-center items-center"
      >
        <p className="text-slate-400">{t('noRecallItems')}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-900 text-slate-50 p-8"
    >
      <h1 className="text-4xl font-bold mb-8 text-purple-600">{t('recallSession')}</h1>

      {currentRecallItem && (
        <div className="bg-slate-700 rounded-2xl shadow-soft p-6 mb-8">
          <p className="text-lg font-semibold mb-4 text-slate-200">
            {currentRecallItem.questionData.question}
          </p>

          {!showAnswer ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShowAnswer}
              className="mt-4 w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {t('showAnswer')}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold mt-6 mb-2 text-purple-400">{t('answer')}:</h3>
              <div className="text-slate-300 mb-4">{formatCorrectAnswer(currentRecallItem.questionData)}</div>
              {currentRecallItem.questionData.explanation && (
                <>
                  <h3 className="text-xl font-semibold mt-4 mb-2 text-purple-400">{t('explanation')}:</h3>
                  <p className="text-slate-300 mb-4">{currentRecallItem.questionData.explanation}</p>
                </>
              )}

              <div className="flex justify-around mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextItem} // In a real SRS, this would update interval/easeFactor
                  className="py-2 px-4 rounded-lg bg-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {t('forgot')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextItem}
                  className="py-2 px-4 rounded-lg bg-yellow-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {t('good')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextItem}
                  className="py-2 px-4 rounded-lg bg-green-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {t('easy')}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        className="mt-8 py-3 px-6 rounded-2xl bg-slate-800 text-slate-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {t('exitSession')}
      </motion.button>
    </motion.div>
  );
};

export default RecallPage;
