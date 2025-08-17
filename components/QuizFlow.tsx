import React, { useState, useEffect } from 'react';
import { Quiz } from '../types';
import { Loader2Icon } from './ui/Icons';
import QuizInterface from './QuizInterface';

interface QuizFlowProps {
  initialQuiz: Quiz | null;
  quizToResume: Quiz | null; // Note: The new interface does not support resuming. This is kept for prop compatibility.
  onExit: () => void;
}

const QuizFlow: React.FC<QuizFlowProps> = ({ initialQuiz, quizToResume, onExit }) => {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Prioritize a new quiz, then a resumed quiz.
    const quizToShow = initialQuiz || quizToResume;
    
    if (quizToShow) {
        setActiveQuiz(quizToShow);
    } else {
        // If no quiz is provided, exit the flow.
        onExit();
    }
    setIsLoading(false);

    // The new interface is self-contained and doesn't use localStorage for state.
    // Clear any old state.
    localStorage.removeItem('interactiveQuizState');

  }, [initialQuiz, quizToResume, onExit]);


  if (isLoading || !activeQuiz) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2Icon className="w-12 h-12 animate-spin text-teal-500" />
      </div>
    );
  }
  
  // The new UI is rendered via the QuizInterface component
  return <QuizInterface quiz={activeQuiz} onExit={onExit} />;
};

export default QuizFlow;