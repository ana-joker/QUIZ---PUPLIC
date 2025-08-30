export interface UserAnswer {
  userAnswer: string | string[] | { prompt: string; answer: string }[];
  isCorrect: boolean;
}

export interface QuizState {
  quizTitle: string;
  quizData: Question[];
  userAnswers: UserAnswer[];
  currentQuestionIndex: number;
  startTime: number | null;
  selectedImageFiles?: string[];
}

export interface Quiz {
  id?: string; // Unique ID for IndexedDB
  quizTitle: string;
  quizData: Question[];
  userAnswers?: UserAnswer[]; // Added for history storage
  summary?: string | null;
  // Not a file, but the base64 representation for localStorage
  selectedImageFiles?: string[]; 
  savedAt?: string;
  score?: number;
  total?: number;
  percentage?: string;
  timeTaken?: string;
}

export type QuestionType = 'MCQ' | 'TrueFalse' | 'ShortAnswer' | 'Ordering' | 'Matching';

export interface Question {
  questionType: QuestionType;
  question: string;
  options: string[];
  matchOptions?: string[];
  correctAnswer: string | string[] | { prompt: string; answer: string }[];
  correctAnswerIndex?: number; // Added for new interface
  explanation: string;
  caseDescription?: string;
  refersToUploadedImageIndex?: number;
  isFlawed?: boolean;
}

export interface RecallItem {
  id: string;
  questionData: Question;
  nextReviewDate: number;
  interval: number;
  easeFactor: number;
}

export interface AppSettings {
  // --- Quiz Generation Settings ---
  numMCQs: string;
  numCases: string;
  questionsPerCase: string;
  difficulty: string;
  quizLanguage: string;
  explanationLanguage: string;
  numImageQuestions: string;

  // New simplified settings
  additionalInstructions: string;

  questionTypes: string[];

  // --- General App Settings ---
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  uiLanguage: 'ar' | 'en';
  
  // --- Model Parameters ---
  temperature: number;
  topP: number;
  topK: number;
}

export interface User {
  id: string;
  planType: string;
  currentQuota: number;
  maxQuota: number;
  quotaResetDate: string;
  isTrialActive: boolean;
  trialEndDate: string;
  name?: string;
}