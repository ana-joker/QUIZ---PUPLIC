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
  correctAnswerIndex?: number;
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

export interface Device { // 💡 AZIZ: تعريف Device interface
    deviceId: string;
    deviceName?: string;
    lastLogin: string; // Date as string
}

export interface User {
  id: string; // Changed from _id to id
  name?: string;
  email: string;
  role: 'student'|'teacher'|'admin'|'owner'; // Added role
  plan: 'guest'|'free'|'paid'; // Changed from planType to plan
  planSource?: 'self'|'family'|'admin'|'teacher'|'promo'; // Added planSource
  planExpiresAt?: string; // Added planExpiresAt
  currentQuota: number;
  maxQuota: number;
  quotaResetDate: string;
  isTrialActive?: boolean;
  trialEndDate?: string;
  googleId?: string;
  picture?: string;
  devices?: Device[];
}

export type AuthState = {
  token?: string;
  user?: User;
  deviceId: string;
  usageToday?: {
    usedGeneral: number;
    capGeneral: number;
    remainingGeneral: number;
  };
};

export interface TeacherCourse {
  id: string;
  title: string;
  description?: string;
  code: string;
  materials: any[];
  students: any[];
}

