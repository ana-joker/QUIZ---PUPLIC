import React, { useState, useEffect } from 'react';
import { Question, UserAnswer } from '../types';
import { CheckCircleIcon, XCircleIcon, XIcon } from './ui/Icons';
import { useTranslation } from '../App';

interface QuestionDisplayProps {
  question: Question;
  onSubmit: (userAnswer: any) => void;
  isSubmitted: boolean;
  userAnswer: UserAnswer | null;
}

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, onSubmit, isSubmitted, userAnswer }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState('');
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [shuffledSourceItems, setShuffledSourceItems] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<{prompt: string, answer: string}[]>([]);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [selectedMatchPrompt, setSelectedMatchPrompt] = useState<string | null>(null);
  const { t, lang } = useTranslation();

  useEffect(() => {
    if (question.questionType === 'Ordering') {
      setShuffledSourceItems(shuffleArray(question.options));
      setOrderedItems([]);
    }
    if(question.questionType === 'Matching') {
      setShuffledAnswers(shuffleArray(question.matchOptions || []));
      setMatchedPairs([]);
      setSelectedMatchPrompt(null);
    }
    setShortAnswer('');
    setSelectedOption(null);
  }, [question]);

  const handleSubmitClick = () => {
    switch (question.questionType) {
      case 'MCQ':
      case 'TrueFalse':
        onSubmit(selectedOption);
        break;
      case 'ShortAnswer':
        onSubmit(shortAnswer);
        break;
      case 'Ordering':
        onSubmit(orderedItems);
        break;
      case 'Matching':
        onSubmit(matchedPairs);
        break;
    }
  };
  
  const Feedback = () => {
      if (!isSubmitted || !userAnswer) return null;
      const { isCorrect } = userAnswer;
      return (
          <div className={`mt-4 p-4 rounded-lg text-left ${isCorrect ? 'bg-green-50 border-green-400 dark:bg-green-900/50 dark:border-green-700' : 'bg-red-50 border-red-400 dark:bg-red-900/50 dark:border-red-700'} border-l-4`}>
              <div className="flex items-start">
                  {isCorrect ? <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3 shrink-0" /> : <XCircleIcon className="w-6 h-6 text-red-600 mr-3 shrink-0" />}
                  <div>
                      <h3 className={`font-bold ${isCorrect ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>{isCorrect ? t('correct') : t('incorrect')}</h3>
                      <div className={`mt-2 text-sm text-gray-700 dark:text-gray-300 ${lang === 'ar' ? 'font-tajawal' : ''}`} dangerouslySetInnerHTML={{ __html: question.explanation.replace(/\n/g, '<br />') }} />
                  </div>
              </div>
          </div>
      );
  };
  
  const renderQuestionType = () => {
    switch (question.questionType) {
      case 'MCQ':
      case 'TrueFalse':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !isSubmitted && setSelectedOption(option)}
                disabled={isSubmitted}
                className={`w-full text-left p-4 border rounded-lg transition text-gray-800 dark:text-gray-200 ${
                  isSubmitted
                    ? option === question.correctAnswer
                      ? 'bg-green-100 border-green-300 dark:bg-green-800 dark:border-green-600'
                      : selectedOption === option
                      ? 'bg-red-100 border-red-300 dark:bg-red-800 dark:border-red-600'
                      : 'bg-gray-100 dark:bg-gray-700'
                    : selectedOption === option
                    ? 'bg-teal-100 border-teal-400 ring-2 ring-teal-300 dark:bg-teal-900 dark:border-teal-500'
                    : 'bg-white hover:bg-gray-50 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700/70 dark:border-gray-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );
      
      case 'ShortAnswer':
          return <input type="text" value={shortAnswer} onChange={e => setShortAnswer(e.target.value)} disabled={isSubmitted} className="w-full px-4 py-2 border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500"/>
      
      case 'Ordering':
        return (
            <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('orderingInstruction')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold mb-2">{t('source')}</h4>
                        <div className="p-2 border rounded-lg min-h-[150px] bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700 space-y-2">
                            {shuffledSourceItems.filter(item => !orderedItems.includes(item)).map(item => (
                                <button key={item} disabled={isSubmitted} onClick={() => setOrderedItems([...orderedItems, item])} className="w-full text-left p-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">{t('yourOrder')}</h4>
                        <div className="p-2 border rounded-lg min-h-[150px] bg-white dark:bg-gray-800 dark:border-gray-700 space-y-2">
                            {orderedItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-teal-50 dark:bg-teal-900/50 border dark:border-teal-800/50 rounded">
                                    <span>{index + 1}. {item}</span>
                                    <button onClick={() => !isSubmitted && setOrderedItems(orderedItems.filter(i => i !== item))} disabled={isSubmitted} className="text-red-500 hover:text-red-700 disabled:opacity-50">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
        
      case 'Matching':
        return (
            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold mb-2">{t('prompts')}</h4>
                        <div className="space-y-2">
                            {question.options.map(prompt => (
                                <button key={prompt} disabled={isSubmitted || matchedPairs.some(p => p.prompt === prompt)} onClick={() => setSelectedMatchPrompt(prompt)}
                                    className={`w-full text-left p-3 border rounded-lg transition ${selectedMatchPrompt === prompt ? 'bg-teal-200 dark:bg-teal-800 border-teal-400 dark:border-teal-600 ring-2' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'} disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed dark:border-gray-600`}>
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">{t('answers')}</h4>
                        <div className="space-y-2">
                            {shuffledAnswers.map(answer => (
                                <button key={answer} disabled={isSubmitted || matchedPairs.some(p => p.answer === answer)} onClick={() => {
                                    if(selectedMatchPrompt) {
                                        setMatchedPairs([...matchedPairs, {prompt: selectedMatchPrompt, answer}]);
                                        setSelectedMatchPrompt(null);
                                    }
                                }}
                                className="w-full text-left p-3 border rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed dark:border-gray-600">
                                    {answer}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-4">
                    <h4 className="font-semibold mb-2">{t('yourMatches')}</h4>
                    <div className="space-y-1 text-sm">
                        {matchedPairs.map((pair, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-teal-50 dark:bg-teal-900/50 rounded">
                                <span>{pair.prompt} ↔️ {pair.answer}</span>
                                 <button onClick={() => !isSubmitted && setMatchedPairs(matchedPairs.filter(p => p.prompt !== pair.prompt))} disabled={isSubmitted} className="text-red-500 hover:text-red-700 disabled:opacity-50">
                                    <XIcon className="w-4 h-4" />
                                 </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );

      default:
        return <p>{t('unsupportedQuestionType')}</p>;
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{question.question}</h3>
      {renderQuestionType()}
      {!isSubmitted && (
        <button
          onClick={handleSubmitClick}
          className="mt-6 w-full bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-700 transition"
        >
          {t('submitAnswer')}
        </button>
      )}
      <Feedback />
    </div>
  );
};

export default QuestionDisplay;