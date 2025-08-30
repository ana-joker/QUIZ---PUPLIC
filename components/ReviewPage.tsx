import React from 'react';
import { QuizState } from '../types';
import { CheckCircleIcon, XCircleIcon } from './ui/Icons';
import { RECALL_STORAGE_KEY } from '../constants';
import { RecallItem } from '../types';
import { useTranslation } from '../App';

interface ReviewPageProps {
  quizState: QuizState;
  onBack: () => void;
}

const ReviewPage: React.FC<ReviewPageProps> = ({ quizState, onBack }) => {
  const { t, lang } = useTranslation();

  const handleAddToRecall = (questionIndex: number, button: HTMLButtonElement) => {
    const questionData = quizState.quizData[questionIndex];
    const deck: RecallItem[] = JSON.parse(localStorage.getItem(RECALL_STORAGE_KEY) || '[]');
    
    if (deck.some(item => JSON.stringify(item.questionData) === JSON.stringify(questionData))) {
      button.textContent = t("addedToRecall");
      button.disabled = true;
      return;
    }
    
    const newItem: RecallItem = {
      id: Date.now().toString(),
      questionData: questionData,
      nextReviewDate: Date.now(),
      interval: 1,
      easeFactor: 2.5
    };
    deck.push(newItem);
    localStorage.setItem(RECALL_STORAGE_KEY, JSON.stringify(deck));
    
    button.textContent = t("addedToRecall");
    button.disabled = true;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">{t("reviewAnswersTitle")}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t("reviewPerformance", { title: quizState.quizTitle })}</p>
      </div>
      <div className="space-y-6">
        {quizState.quizData.map((q, index) => {
          const userAnswer = quizState.userAnswers[index];
          let userAnswerDisplay = t("notAnswered");
          if (userAnswer && userAnswer.userAnswer !== null) {
              if (Array.isArray(userAnswer.userAnswer)) {
                   if (q.questionType === 'Matching') {
                    userAnswerDisplay = userAnswer.userAnswer.map(p => `${p.prompt} ↔️ ${p.answer}`).join(', ');
                   } else {
                    userAnswerDisplay = userAnswer.userAnswer.join(' → ');
                   }
              } else {
                  userAnswerDisplay = userAnswer.userAnswer;
              }
          }

          let correctAnswerDisplay = '';
          if (Array.isArray(q.correctAnswer)) {
                if (q.questionType === 'Matching') {
                    correctAnswerDisplay = (q.correctAnswer as {prompt: string, answer: string}[]).map(p => `<li>${p.prompt} → ${p.answer}</li>`).join('');
                    correctAnswerDisplay = `<ul class="list-disc list-inside">${correctAnswerDisplay}</ul>`;
                } else {
                    correctAnswerDisplay = (q.correctAnswer as string[]).join(' → ');
                }
          } else {
              correctAnswerDisplay = q.correctAnswer as string;
          }

          return (
            <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                {index + 1}. {q.question}
              </p>
              <div className={`my-4 flex items-center gap-2 font-medium ${userAnswer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {userAnswer.isCorrect ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
                <span>{t("yourAnswer")} {userAnswerDisplay}</span>
              </div>
              {!userAnswer.isCorrect && (
                <div className="mb-4 text-green-700 dark:text-green-400">
                    <span className="font-semibold">{t("correctAnswer")}</span>
                    <div dangerouslySetInnerHTML={{ __html: correctAnswerDisplay }} />
                </div>
              )}
              <div className={`mt-2 p-4 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-gray-400 dark:border-gray-600 rounded-r-lg text-sm text-gray-700 dark:text-gray-300 ${lang === 'ar' ? 'font-tajawal' : ''}`}
                   dangerouslySetInnerHTML={{ __html: `<strong>${t("explanation")}:</strong> ${q.explanation.replace(/\n/g, '<br />')}`}}
              />
              <div className="mt-4 text-right">
                <button 
                  onClick={(e) => handleAddToRecall(index, e.currentTarget)}
                  className="text-sm bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 font-semibold py-1 px-3 rounded-full hover:bg-teal-200 dark:hover:bg-teal-900 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  {t("addToRecall")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center mt-8">
        <button onClick={onBack} className="bg-teal-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-teal-700 transition">
          {t("backToResults")}
        </button>
      </div>
    </div>
  );
};

export default ReviewPage;