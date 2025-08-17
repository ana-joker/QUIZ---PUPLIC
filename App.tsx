
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import QuizCreator from './components/QuizCreator';
import QuizFlow from './components/QuizFlow';
import HistoryPage from './components/HistoryPage';
import RecallPage from './components/RecallPage';
import ChoiceScreen from './components/ChoiceScreen';
import SettingsPopover from './components/SettingsPopover';
import { Quiz, QuizHistoryEntry, RecallItem, AppSettings } from './types';
import { HISTORY_STORAGE_KEY, RECALL_STORAGE_KEY, SETTINGS_STORAGE_KEY } from './constants';
import { SettingsIcon, HistoryIcon, BrainCircuitIcon } from './components/ui/Icons';


// --- I18N ---
const translations = {
  en: {
    "aiQuizGenerator": "AI Quiz Generator",
    "transformContentToQuiz": "Transform any content into an interactive quiz.",
    "quizTopicOptional": "Quiz Topic / Subject (Optional)",
    "topicPlaceholder": "e.g., Photosynthesis, World War II, React Hooks",
    "describeQuizContent": "Describe the content for your quiz",
    "promptPlaceholder": "e.g., Create a quiz about the main causes of the French Revolution...",
    "uploadDocument": "Upload Document",
    "uploadImage": "Upload Image",
    "errorPrefix": "Error:",
    "generating": "Generating...",
    "generateQuiz": "Generate Quiz",
    "quizSettings": "Quiz Settings",
    "quizHistory": "Quiz History",
    "recallHub": "Recall Hub",
    "inputError": "Please provide text, a document, or an image to generate the quiz from.",
    "apiKeyError": "API Key not found. Please set your Gemini API key in the settings menu.",
    "startQuiz": "Start Quiz",
    "exitToMainMenu": "Exit to Main Menu",
    "fastSummary": "Fast Summary",
    "questionOf": "Question {current} of {total}",
    "time": "Time:",
    "caseScenario": "Case Scenario",
    "nextQuestion": "Next Question",
    "previousQuestion": "Previous",
    "finishQuiz": "Finish Quiz",
    "correct": "Correct!",
    "incorrect": "Incorrect",
    "source": "Source",
    "yourOrder": "Your Order",
    "orderingInstruction": "Click items from the source box to add them to your order.",
    "prompts": "Prompts",
    "answers": "Answers",
    "yourMatches": "Your Matches",
    "unsupportedQuestionType": "Unsupported question type.",
    "submitAnswer": "Submit Answer",
    "quizComplete": "Quiz Complete!",
    "yourScore": "Your Score:",
    "timeTaken": "Time taken:",
    "reviewAnswers": "Review Answers",
    "retakeQuiz": "Retake Quiz",
    "newQuiz": "New Quiz",
    "reviewAnswersTitle": "Review Answers",
    "reviewPerformance": "Review your performance for the quiz: \"{title}\"",
    "notAnswered": "Not Answered",
    "yourAnswer": "Your answer:",
    "correctAnswer": "Correct answer:",
    "explanation": "Explanation:",
    "addToRecall": "Add to Recall",
    "addedToRecall": "Added to Recall",
    "backToResults": "Back to Results",
    "backToCreator": "Back to Creator",
    "noHistory": "You have no quiz history yet.",
    "noValidQuestions": "There are no valid questions in this quiz. Check the Fast Summary to see all questions.",
    "date": "Date:",
    "score": "Score:",
    "allDone": "All Done!",
    "noRecallItems": "You have no items due for recall. Check back later!",
    "recallSession": "Recall Session",
    "showAnswer": "Show Answer",
    "answer": "Answer:",
    "forgot": "Forgot",
    "good": "Good",
    "easy": "Easy",
    "exitSession": "Exit Session",
    "settingsGeneral": "General",
    "settingsQuiz": "Quiz",
    "settingsTheme": "Theme",
    "settingsLightTheme": "Light",
    "settingsDarkTheme": "Dark",
    "settingsLanguage": "UI Language",
    "settingsFontSize": "Font Size",
    "settingsSmall": "Small",
    "settingsMedium": "Medium",
    "settingsLarge": "Large",
    "settingsModelParams": "AI Model Parameters",
    "settingsApiKey": "Gemini API Key",
    "settingsApiKeyPlaceholder": "Enter your API key here",
    "settingsTemperature": "Temperature",
    "settingsTopP": "Top-P",
    "settingsTopK": "Top-K",
    "settingsDone": "Done",
    "settingsNumQuestions": "Number of Questions",
    "settingsDifficulty": "Difficulty",
    "settingsMixed": "Mixed",
    "settingsEasy": "Easy",
    "settingsMediumDifficulty": "Medium",
    "settingsHard": "Hard",
    "settingsQuestionTypes": "Question Types (Optional)",
    "settingsQuestionTypesInfo": "If none selected, all types will be used.",
    "languageSettings": "Language",
    "quizLanguage": "Quiz Language",
    "explanationLanguage": "Explanation Language",
    "learningContext": "Learning Context",
    "knowledgeLevel": "Your Knowledge Level",
    "beginner": "Beginner",
    "intermediate": "Intermediate",
    "advanced": "Advanced",
    "learningGoal": "Learning Goal",
    "understandConcepts": "Understand Concepts",
    "applyInformation": "Apply Information",
    "learn": "Learn",
    "howToCreate": "How do you want to create the test?",
    "chooseMethod": "Choose your preferred method to provide the scientific material.",
    "generateFromText": "Generate from Text",
    "generateFromPdf": "Generate from PDF",
    "backToSelection": "→ Back to Selection Screen",
    "step1Text": "1. Enter Medical Text",
    "step1Pdf": "1. Upload PDF to Store",
    "textPlaceholder": "Paste the full medical text here...",
    "pdfUploadInstruction": "Click here to select a PDF file",
    "step2ImageIntegration": "2. Integrate Images into Quiz",
    "imageIntegrationDesc": "Upload an image and specify how many questions should be based on it. The AI can create questions about the image itself, or that require analyzing both the image and the text.",
    "imageUsageTitle": "How should the image be used for questions?",
    "imageUsageAuto": "Automatic (AI decides the best way)",
    "imageUsageLink": "Link to text (Questions will require using both text & image)",
    "imageUsageAbout": "About the image (Questions will be about image content only)",
    "addImage": "+ Add Image",
    "step3Settings": "3. Generation Settings",
    "numMCQs": "Number of MCQs",
    "numCases": "Number of Cases",
    "difficultyLevel": "Difficulty Level",
    "additionalInstructions": "Additional Instructions (Optional)",
    "instructionsPlaceholder": "e.g., Focus on diagnostic questions, use the attached images, make the questions concise...",
    "generateNow": "Start Generation Now",
    "processing": "Processing...",
    "comfortableDefault": "Comfortable (Default)",
    "questionsPerCase": "Questions per Case",
    "numImageQuestions": "Number of Image Questions",
    "imageOnlyInfo": "You can generate a quiz from an image alone, without text or a PDF.",
    "promptTooLongError": "The text is too long. Maximum 10,000 characters allowed.",
    "pdfTooLargeError": "PDF file is too large. Maximum {size}MB allowed.",
    "tooManyQuestionsError": "You requested too many questions. Maximum {count} questions allowed.",
    "noQuestionsRequestedError": "Please request at least one question.",
    "tooManyImagesError": "You can upload a maximum of {count} images.",
    "pdfLimitInfo": "Max file size: {size}MB. (Backend will check page count)",
    "imageLimitInfo": "Max {count} images. (Individual file size limits apply)",
    "remainingQuestionsInfo": "Remaining questions: {count} / 50",
    "totalQuestionsLimitInfo": "Total questions (MCQs + Cases * Q/Case + Image Qs) must not exceed {count}."
  },
  ar: {
    "aiQuizGenerator": "مولد الاختبارات الذكي",
    "transformContentToQuiz": "حوّل أي محتوى إلى اختبار تفاعلي.",
    "quizTopicOptional": "موضوع الاختبار (اختياري)",
    "topicPlaceholder": "مثال: البناء الضوئي، الحرب العالمية الثانية، React Hooks",
    "describeQuizContent": "صف المحتوى لاختبارك",
    "promptPlaceholder": "مثال: أنشئ اختبارًا عن الأسباب الرئيسية للثورة الفرنسية...",
    "uploadDocument": "رفع مستند",
    "uploadImage": "رفع صورة",
    "errorPrefix": "خطأ:",
    "generating": "جاري الإنشاء...",
    "generateQuiz": "أنشئ الاختبار",
    "quizSettings": "الإعدادات",
    "quizHistory": "سجل الاختبارات",
    "recallHub": "مركز المراجعة",
    "inputError": "يرجى تقديم نص أو مستند أو صورة لإنشاء الاختبار.",
    "apiKeyError": "لم يتم العثور على مفتاح API. يرجى إعداد مفتاح Gemini API الخاص بك في قائمة الإعدادات.",
    "startQuiz": "ابدأ الاختبار",
    "exitToMainMenu": "الخروج إلى القائمة الرئيسية",
    "fastSummary": "ملخص سريع",
    "questionOf": "سؤال {current} من {total}",
    "time": "الوقت:",
    "caseScenario": "سيناريو الحالة",
    "nextQuestion": "السؤال التالي",
    "previousQuestion": "السابق",
    "finishQuiz": "إنهاء الاختبار",
    "correct": "صحيح!",
    "incorrect": "غير صحيح",
    "source": "المصدر",
    "yourOrder": "ترتيبك",
    "orderingInstruction": "انقر على العناصر من صندوق المصدر لإضافتها إلى ترتيبك.",
    "prompts": "المطابقات",
    "answers": "الإجابات",
    "yourMatches": "مطابقاتك",
    "unsupportedQuestionType": "نوع سؤال غير مدعوم.",
    "submitAnswer": "إرسال الإجابة",
    "quizComplete": "اكتمل الاختبار!",
    "yourScore": "نتيجتك:",
    "timeTaken": "الوقت المستغرق:",
    "reviewAnswers": "مراجعة الإجابات",
    "retakeQuiz": "إعادة الاختبار",
    "newQuiz": "اختبار جديد",
    "reviewAnswersTitle": "مراجعة الإجابات",
    "reviewPerformance": "راجع أداءك في اختبار: \"{title}\"",
    "notAnswered": "لم تتم الإجابة",
    "yourAnswer": "إجابتك:",
    "correctAnswer": "الإجابة الصحيحة:",
    "explanation": "الشرح:",
    "addToRecall": "أضف للمراجعة",
    "addedToRecall": "أضيف للمراجعة",
    "backToResults": "العودة للنتائج",
    "backToCreator": "العودة للرئيسية",
    "noHistory": "ليس لديك سجل اختبارات حتى الآن.",
    "noValidQuestions": "لا توجد أسئلة صالحة في هذا الاختبار. تحقق من الملخص السريع لرؤية جميع الأسئلة.",
    "date": "التاريخ:",
    "score": "النتيجة:",
    "allDone": "اكتمل كل شيء!",
    "noRecallItems": "ليس لديك عناصر مستحقة للمراجعة. تحقق مرة أخرى لاحقًا!",
    "recallSession": "جلسة مراجعة",
    "showAnswer": "أظهر الإجابة",
    "answer": "الإجابة:",
    "forgot": "نسيت",
    "good": "جيد",
    "easy": "سهل",
    "exitSession": "إنهاء الجلسة",
    "settingsGeneral": "عام",
    "settingsQuiz": "الاختبار",
    "settingsTheme": "المظهر",
    "settingsLightTheme": "فاتح",
    "settingsDarkTheme": "داكن",
    "settingsLanguage": "لغة الواجهة",
    "settingsFontSize": "حجم الخط",
    "settingsSmall": "صغير",
    "settingsMedium": "متوسط",
    "settingsLarge": "كبير",
    "settingsModelParams": "معلمات نموذج الذكاء الاصطناعي",
    "settingsApiKey": "مفتاح Gemini API",
    "settingsApiKeyPlaceholder": "أدخل مفتاح API الخاص بك هنا",
    "settingsTemperature": "الحرارة (Temperature)",
    "settingsTopP": "Top-P",
    "settingsTopK": "Top-K",
    "settingsDone": "تم",
    "settingsNumQuestions": "عدد الأسئلة",
    "settingsDifficulty": "الصعوبة",
    "settingsMixed": "متنوع",
    "settingsEasy": "سهل",
    "settingsMediumDifficulty": "متوسط",
    "settingsHard": "صعب",
    "settingsQuestionTypes": "أنواع الأسئلة (اختياري)",
    "settingsQuestionTypesInfo": "إذا لم يتم تحديد أي شيء ، فسيتم استخدام جميع الأنواع.",
    "languageSettings": "اللغة",
    "quizLanguage": "لغة الاختبار",
    "explanationLanguage": "لغة الشرح",
    "learningContext": "سياق التعلم",
    "knowledgeLevel": "مستوى معرفتك",
    "beginner": "مبتدئ",
    "intermediate": "متوسط",
    "advanced": "متقدم",
    "learningGoal": "هدف التعلم",
    "understandConcepts": "فهم المفاهيم",
    "applyInformation": "تطبيق المعلومات",
    "learn": "تعلم",
    "howToCreate": "كيف تريد إنشاء الاختبار؟",
    "chooseMethod": "اختر الطريقة التي تفضلها لتوفير المادة العلمية.",
    "generateFromText": "توليد من نص",
    "generateFromPdf": "توليد من ملف PDF",
    "backToSelection": "→ العودة إلى شاشة الاختيار",
    "step1Text": "1. أدخل النص الطبي",
    "step1Pdf": "1. رفع PDF إلى المخزن",
    "textPlaceholder": "ألصق النص الطبي الكامل هنا...",
    "pdfUploadInstruction": "انقر هنا لاختيار ملف PDF",
    "step2ImageIntegration": "2. دمج الصور في الاختبار",
    "imageIntegrationDesc": "ارفع صورة وحدد عدد الأسئلة التي يجب أن تستند إليها. يمكن للذكاء الاصطناعي إنشاء أسئلة حول الصورة نفسها، أو تتطلب تحليل كل من الصورة والنص.",
    "imageUsageTitle": "كيف يجب استخدام الصورة للأسئلة؟",
    "imageUsageAuto": "تلقائي (يقرر الذكاء الاصطناعي الطريقة الأفضل)",
    "imageUsageLink": "ربط بالنص (تتطلب الأسئلة استخدام النص والصورة معًا)",
    "imageUsageAbout": "حول الصورة (تتعلق الأسئلة بمحتوى الصورة فقط)",
    "addImage": "+ إضافة صورة",
    "step3Settings": "3. إعدادات التوليد",
    "numMCQs": "عدد الأسئلة متعددة الخيارات",
    "numCases": "عدد الحالات",
    "difficultyLevel": "مستوى الصعوبة",
    "additionalInstructions": "تعليمات إضافية (اختياري)",
    "instructionsPlaceholder": "مثال: ركز على أسئلة التشخيص، استخدم الصور المرفقة، اجعل الأسئلة قصيرة...",
    "generateNow": "ابدأ التنفيذ الآن",
    "processing": "جاري المعالجة...",
    "comfortableDefault": "مريح (افتراضي)",
    "questionsPerCase": "أسئلة لكل حالة",
    "numImageQuestions": "عدد أسئلة الصور",
    "imageOnlyInfo": "يمكنك إنشاء اختبار من صورة فقط، بدون الحاجة لنص أو ملف PDF.",
    "promptTooLongError": "النص طويل جدًا. الحد الأقصى 10,000 حرف مسموح به.",
    "pdfTooLargeError": "ملف PDF كبير جدًا. الحد الأقصى {size} ميجابايت مسموح به.",
    "tooManyQuestionsError": "لقد طلبت عددًا كبيرًا جدًا من الأسئلة. الحد الأقصى {count} سؤال مسموح به.",
    "noQuestionsRequestedError": "يرجى طلب سؤال واحد على الأقل.",
    "tooManyImagesError": "يمكنك رفع 5 صور كحد أقصى.",
    "pdfLimitInfo": "الحد الأقصى لحجم الملف: {size} ميجابايت. (الخادم سيتأكد من عدد الصفحات)",
    "imageLimitInfo": "الحد الأقصى: {count} صور. (تطبق حدود حجم ملفات فردية)",
    "remainingQuestionsInfo": "الأسئلة المتبقية: {count} / 50",
    "totalQuestionsLimitInfo": "إجمالي الأسئلة (متعددة الخيارات + الحالات * أسئلة/حالة + أسئلة الصور) يجب ألا يتجاوز {count}."
  }
};
type TranslationKey = keyof typeof translations.en;

// --- SETTINGS CONTEXT ---
const defaultSettings: AppSettings = {
    theme: 'dark',
    fontSize: 'medium',
    uiLanguage: 'ar',
    apiKey: process.env.API_KEY || '',
    temperature: 0.5,
    topP: 0.95,
    topK: 40,
    numMCQs: '5',
    numCases: '1',
    questionsPerCase: '2',
    numImageQuestions: '1',
    difficulty: 'Medium',
    additionalInstructions: '',
    quizLanguage: 'Arabic',
    explanationLanguage: 'Arabic',
    knowledgeLevel: 'Intermediate',
    learningGoal: 'Apply Information',
    questionTypes: ['MCQ'], // Default to MCQ as per new design
};

interface SettingsContextType {
    settings: AppSettings;
    setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within a SettingsProvider');
    return context;
};

export const useTranslation = () => {
    const { settings } = useSettings();
    const t = useCallback((key: TranslationKey, replacements?: Record<string, string | number>) => {
        let translation = translations[settings.uiLanguage]?.[key] || translations.en[key] || key;
        if (replacements) {
            Object.entries(replacements).forEach(([k, v]) => {
                translation = translation.replace(`{${k}}`, String(v));
            });
        }
        return translation;
    }, [settings.uiLanguage]);
    return { t, lang: settings.uiLanguage };
};


const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    });

    useEffect(() => {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        const root = document.documentElement;
        root.lang = settings.uiLanguage;
        root.dir = settings.uiLanguage === 'ar' ? 'rtl' : 'ltr';
        
        if (settings.theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        root.style.fontSize = settings.fontSize === 'small' ? '14px' : settings.fontSize === 'large' ? '18px' : '16px';

    }, [settings.uiLanguage, settings.theme, settings.fontSize]);

    return (
        <SettingsContext.Provider value={{ settings, setSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

const AppContent: React.FC = () => {
    type View = 'creator' | 'quiz' | 'history' | 'recall';
    type CreationMode = 'text' | 'pdf';

    const [currentView, setCurrentView] = useState<View>('creator');
    const [creationMode, setCreationMode] = useState<CreationMode | null>(null);
    const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
    const [quizToResume, setQuizToResume] = useState<Quiz | null>(null);
    const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
    const [dueRecallItems, setDueRecallItems] = useState<RecallItem[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { t } = useTranslation();


    const loadHistory = useCallback(() => {
        const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        setHistory(savedHistory ? JSON.parse(savedHistory) : []);
    }, []);

    const updateRecallCount = useCallback(() => {
        const savedRecall = localStorage.getItem(RECALL_STORAGE_KEY);
        const deck: RecallItem[] = savedRecall ? JSON.parse(savedRecall) : [];
        const now = Date.now();
        setDueRecallItems(deck.filter(item => item.nextReviewDate <= now));
    }, []);

    useEffect(() => {
        loadHistory();
        updateRecallCount();
    }, [loadHistory, updateRecallCount]);

    const handleQuizGenerated = (quiz: Quiz) => {
        setActiveQuiz(quiz);
        setCurrentView('quiz');
        setQuizToResume(null); 
    };

    const handleStartQuizFromHistory = (quizData: Quiz) => {
        setQuizToResume(quizData);
        setCurrentView('quiz');
    };

    const handleBackToCreator = () => {
        setActiveQuiz(null);
        setQuizToResume(null);
        setCurrentView('creator');
        setCreationMode(null); // Go back to the choice screen
        updateRecallCount(); 
    };

    const handleShowHistory = () => {
        loadHistory();
        setCurrentView('history');
    };

    const handleShowRecall = () => {
        setCurrentView('recall');
    };

    const renderView = () => {
        switch (currentView) {
            case 'quiz':
                return <QuizFlow initialQuiz={activeQuiz} quizToResume={quizToResume} onExit={handleBackToCreator} />;
            case 'history':
                return <HistoryPage history={history} onBack={handleBackToCreator} onRetake={handleStartQuizFromHistory} />;
            case 'recall':
                return <RecallPage onBack={handleBackToCreator} dueRecallItems={dueRecallItems} />;
            case 'creator':
            default:
                if (!creationMode) {
                    return (
                        <>
                            <header className="text-center my-8">
                                <h1 
                                    className="text-7xl md:text-8xl font-black tracking-tighter font-tajawal bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent"
                                    style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.1)' }}
                                >
                                    QUIZ TIME
                                </h1>
                            </header>
                            <ChoiceScreen onSelectMode={setCreationMode} />
                            <footer className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 px-4">
                                <button onClick={handleShowHistory} className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 text-gray-200 bg-slate-800/20 hover:bg-slate-800/50 rounded-lg transition text-base font-medium whitespace-nowrap">
                                    <HistoryIcon className="w-5 h-5" />
                                    <span>{t("quizHistory")}</span>
                                </button>
                                <button onClick={handleShowRecall} className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 text-gray-200 bg-slate-800/20 hover:bg-slate-800/50 rounded-lg transition relative text-base font-medium whitespace-nowrap">
                                    <BrainCircuitIcon className="w-5 h-5" />
                                    <span>{t("recallHub")}</span>
                                    {dueRecallItems.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                            {dueRecallItems.length}
                                        </span>
                                    )}
                                </button>
                                <button onClick={() => setIsSettingsOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 text-gray-200 bg-slate-800/20 hover:bg-slate-800/50 rounded-lg transition text-base font-medium whitespace-nowrap" aria-label={t("quizSettings")}>
                                    <SettingsIcon className="w-5 h-5" />
                                     <span>{t("quizSettings")}</span>
                                </button>
                            </footer>
                            <SettingsPopover isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                        </>
                    );
                }
                return (
                    <QuizCreator
                        creationMode={creationMode}
                        onQuizGenerated={handleQuizGenerated}
                        onBackToChoice={() => setCreationMode(null)}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 md:p-8">
                {renderView()}
            </div>
        </div>
    );
}

const App: React.FC = () => {
    return (
        <SettingsProvider>
            <AppContent />
        </SettingsProvider>
    );
};

export default App;
