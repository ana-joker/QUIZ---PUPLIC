export interface Quiz {
  id?: string; // Unique ID for IndexedDB
  quizTitle: string;
  quizData: Question[];
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

export interface UserAnswer {
  questionIndex: number;
  userAnswer: any;
  isCorrect: boolean;
}

export interface QuizState extends Quiz {
  userAnswers: UserAnswer[];
  currentQuestionIndex: number;
  startTime?: number;
}

export interface QuizHistoryEntry {
  title: string;
  score: number;
  total: number;
  percentage: string;
  date: string;
  mode: string;
  quizData: Quiz;
  timeTaken: string;
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

  // Kept for potential future use or more complex settings panels
  knowledgeLevel: string;
  learningGoal: string;
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
