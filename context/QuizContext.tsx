import { createContext, useContext, useState, ReactNode } from 'react';
import { Quiz } from '../types';

interface QuizContextType {
  activeQuiz: Quiz | null;
  setActiveQuiz: (quiz: Quiz | null) => void;
  quizToResume: Quiz | null;
  setQuizToResume: (quiz: Quiz | null) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizToResume, setQuizToResume] = useState<Quiz | null>(null);

  return (
    <QuizContext.Provider value={{ activeQuiz, setActiveQuiz, quizToResume, setQuizToResume }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
