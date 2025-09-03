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
  apiKey?: string;
}

export interface Device { // 💡 AZIZ: تعريف Device interface
    deviceId: string;
    deviceName?: string;
    lastLogin: string; // Date as string
}

export interface User {
  _id: string; // 💡 AZIZ: _id بدلاً من id
  name?: string; // 💡 AZIZ: قد لا يكون موجودًا في Google login إذا لم يتم تحديثه
  email: string;
  planType: 'free' | 'paid' | 'course_student' | 'admin_teacher' | 'owner' | 'guest'; // 💡 AZIZ: تحديث أنواع الخطط
  currentQuota: number; // 💡 AZIZ: الكوتا المتبقية لليوم
  maxQuota: number; // 💡 AZIZ: الكوتا القصوى لليوم (كانت dailyQuota في الـ Backend)
  quotaResetDate: string; // 💡 AZIZ: تاريخ إعادة تعيين الكوتا (Date as string)
  isTrialActive?: boolean; // 💡 AZIZ: حقل اختياري
  trialEndDate?: string; // 💡 AZIZ: حقل اختياري (Date as string)
  googleId?: string;
  picture?: string;
  devices?: Device[]; // 💡 AZIZ: قائمة الأجهزة
}

