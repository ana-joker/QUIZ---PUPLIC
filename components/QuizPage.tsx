import React, { useState, useEffect } from 'react';
import { QuizState } from '../types';
import QuestionDisplay from './QuestionDisplay';
import { useTranslation } from '../App';

interface QuizPageProps {
  quizState: QuizState;
  onAnswerSubmit: (questionIndex: number, userAnswer: any, isCorrect: boolean) => void;
  onNextQuestion: () => void;
  onFinishQuiz: () => void;
}

const QuizPage: React.FC<QuizPageProps> = ({ quizState, onAnswerSubmit, onNextQuestion, onFinishQuiz }) => {
  const { quizData, userAnswers, currentQuestionIndex } = quizState;
  const currentQuestion = quizData[currentQuestionIndex];
  const currentUserAnswer = userAnswers[currentQuestionIndex];
  const [showFeedback, setShowFeedback] = useState(false);
  const { t } = useTranslation();
  
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (quizState.startTime) {
        setTimer(Math.floor((Date.now() - quizState.startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [quizState.startTime]);

  useEffect(() => {
    setShowFeedback(currentUserAnswer && currentUserAnswer.userAnswer !== null);
  }, [currentQuestionIndex, currentUserAnswer]);
  
  const handleSubmit = (userAnswer: any) => {
    let isCorrect = false;
    const correctAnswer = currentQuestion.correctAnswer;
    
    // Deep comparison for arrays (Ordering) and array of objects (Matching)
    const deepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
    const sortedDeepEqual = (a: any[], b: any[]) => {
        if (a.length !== b.length) return false;
        const sortFn = (x: any, y: any) => x.prompt.localeCompare(y.prompt);
        return JSON.stringify([...a].sort(sortFn)) === JSON.stringify([...b].sort(sortFn));
    };

    if (currentQuestion.questionType === 'Ordering') {
        isCorrect = deepEqual(userAnswer, correctAnswer);
    } else if (currentQuestion.questionType === 'Matching') {
        isCorrect = Array.isArray(userAnswer) && Array.isArray(correctAnswer) && sortedDeepEqual(userAnswer, correctAnswer);
    } else {
        isCorrect = typeof userAnswer === 'string' && typeof correctAnswer === 'string' && userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    }
    
    onAnswerSubmit(currentQuestionIndex, userAnswer, isCorrect);
    setShowFeedback(true);
  };
  
  const progress = ((userAnswers.filter(a => a.userAnswer !== null).length) / quizData.length) * 100;
  const isLastQuestion = currentQuestionIndex === quizData.length - 1;

  return (
    <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{t("questionOf", { current: currentQuestionIndex + 1, total: quizData.length })}</span>
                <span>{t("time")} {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
                <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            {currentQuestion.caseDescription && (
                 <div className="mb-4 p-4 bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500 rounded-r-lg">
                    <h3 className="font-bold text-teal-800 dark:text-teal-300">{t("caseScenario")}</h3>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">{currentQuestion.caseDescription}</p>
                </div>
            )}
            
            {currentQuestion.refersToUploadedImage && quizState.selectedImageFile && (
                <div className="mb-4">
                    <img src={quizState.selectedImageFile} alt="Quiz context" className="rounded-lg max-w-full h-auto mx-auto shadow-md" />
                </div>
            )}

            <QuestionDisplay 
                question={currentQuestion} 
                onSubmit={handleSubmit} 
                isSubmitted={showFeedback}
                userAnswer={currentUserAnswer}
            />

            {showFeedback && (
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                   {isLastQuestion ? (
                        <button onClick={onFinishQuiz} className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition">
                            {t("finishQuiz")}
                        </button>
                   ) : (
                        <button onClick={onNextQuestion} className="w-full bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-700 transition">
                            {t("nextQuestion")}
                        </button>
                   )}
                </div>
            )}
        </div>
    </div>
  );
};

export default QuizPage;