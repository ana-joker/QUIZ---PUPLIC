import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import GenerateText from "./pages/GenerateText";
import GeneratePDF from "./pages/GeneratePDF";
import PrivateRoute from "./components/PrivateRoute"; // 💡 AZIZ: تأكد من أن PrivateRoute يتعامل مع الأدوار
import Navbar from "./components/Navbar";
import HistoryPage from './components/HistoryPage';
import RecallPage from './components/RecallPage';
import SettingsPage from './pages/SettingsPage';
import ManageDevices from './pages/ManageDevices';
import MyUsage from './pages/MyUsage';
import QuizFlow from './components/QuizFlow';

import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
// 💡 AZIZ: إضافة استيرادات المكونات الجديدة
import JoinCourse from './pages/JoinCourse'; // 💡 AZIZ: افتراض المسار الصحيح
import GenerateFromMaterial from './pages/GenerateFromMaterial'; // 💡 AZIZ: افتراض المسار الصحيح
import StudentDashboard from './pages/StudentDashboard'; // 💡 AZIZ: افتراض المسار الصحيح
import TeacherDashboard from './pages/TeacherDashboard'; // 💡 AZIZ: افتراض المسار الصحيح
import MyCourses from './pages/MyCourses';
import CourseDetails from './pages/CourseDetails';
import Billing from './pages/Billing';
import ManageMaterials from './pages/ManageMaterials';


import { QuizProvider, useQuiz } from './context/QuizContext';
import { AuthStoreProvider } from './context/AuthStore';
import { AppSettings, Quiz, RecallItem } from './types';
import { RECALL_STORAGE_KEY, SETTINGS_STORAGE_KEY } from './constants';
import { setToastFunction } from './services/api';


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
    "apiKeyError": "Could not connect to the quiz generation service. Please try again later.",
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
    "reviewPerformance": "Review your performance for the quiz: \"{title}\",",
    "notAnswered": "Not Answered",
    "yourAnswer": "Your answer:",
    "correctAnswer": "Correct answer:",
    "explanation": "Explanation:",
    "addToRecall": "Add to Recall",
    "addedToRecall": "Added To Recall",
    "backToResults": "Back To Results",
    "backToCreator": "Back To Creator",
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
    "finalizingQuiz": "جاري إنهاء الاختبار...",
    "unknownError": "حدث خطأ غير معروف. يرجى المحاولة مرة أخرى.",
    "comfortableDefault": "مريح (افتراضي)",
    "questionsPerCase": "أسئلة لكل حالة",
    "numImageQuestions": "عدد أسئلة الصور",
    "imageOnlyInfo": "يمكنك إنشاء اختبار من صورة فقط، بدون الحاجة لنص أو ملف PDF.",
    "promptTooLongError": "النص طويل جدًا. الحد الأقصى {count} حرف مسموح به.",
    "pdfTooLargeError": "ملف PDF كبير جدًا. الحد الأقصى {size} ميجابايت مسموح به.",
    "tooManyQuestionsError": "لقد طلبت عددًا كبيرًا جدًا من الأسئلة. الحد الأقصى {count} سؤال مسموح به.",
    "noQuestionsRequestedError": "يرجى طلب سؤال واحد على الأقل.",
    "tooManyImagesError": "يمكنك رفع 5 صور كحد أقصى.",
    "imageLimitInfo": "الحد الأقصى: {count} صور. (تطبق حدود حجم ملفات فردية)",
    "remainingQuestionsInfo": "الأسئلة المتبقية: {count} / 50",
    "totalQuestionsLimitInfo": "إجمالي الأسئلة (متعددة الخيارات + الحالات * أسئلة/حالة + أسئلة الصور) يجب ألا يتجاوز {count}.",
    "untitledQuiz": "اختبار بدون عنوان",
    "errorLoadingHistory": "فشل تحميل سجل الاختبارات.",
    "confirmDeleteQuiz": "هل أنت متأكد من حذف هذا الاختبار؟",
    "errorDeletingQuiz": "فشل حذف الاختبار.",
    "loadingHistory": "جاري تحميل سجل الاختبارات...",
    "delete": "حذف",
    "saveAsHtml": "حفظ كملف HTML",
    "doubleClickInstruction": "للإجابة على السؤال، يرجى الضغط على إجابتك المختارة مرتين للتأكيد.",
    "uploadingFile": "جاري رفع الملف",
    "promptTruncated": "تم قص النص ليتوافق مع الحد الأقصى البالغ {count} حرفًا.",
    "pdfContentWarning": "ملاحظة: بالنسبة للملفات الكبيرة، قد يتم اقتطاع المحتوى بواسطة الخادم إذا تجاوز حد النص.",
    "pdfScanWarning": "This PDF appears to be made of images without selectable text, which can lead to poor quiz quality. For best results, use a text-based PDF.\n\nDo you want to continue anyway?",
    "analyzingPdf": "Analyzing PDF...",
    "trialEndsOn": "تنتهي الفترة التجريبية في {date}",
    "guestQuestionsRemaining": "الأسئلة المتبقية للضيف: {count}",
    "registerNowPrompt": "سجل الآن لفتح اختبارات غير محدودة!",
    "login": "تسجيل الدخول",
    "register": "تسجيل",
    "myUsageTitle": "استخدامي",
    "accountDetails": "تفاصيل الحساب",
    "planType": "نوع الخطة",
    "questionsToday": "أسئلة اليوم",
    "quotaResets": "إعادة تعيين الكوتا",
    "trialEnds": "انتهاء الفترة التجريبية",
    "loadingUserData": "جاري تحميل بيانات المستخدم...",
    "upgradeToPremium": "الترقية إلى بريميوم",
    "joinCourse": "الانضمام إلى دورة",
    "home": "Home",
    "generate": "Generate",
    "history": "History",
    "dashboard": "Dashboard",
    "myCourses": "My Courses",
    "teacherDashboard": "Teacher Dashboard",
    "adminDashboard": "Admin Dashboard",
    "errorNoMaterialId": "Error: No material ID provided.",
    "errorGeneratingQuiz": "Error generating quiz.",
    "generateFromMaterial": "Generate Quiz from Material",
    "generatedQuiz": "Generated Quiz",
    "readyToGenerateFromMaterial": "Ready to generate quiz from material",
    "startQuizGeneration": "Start Quiz Generation",
    "errorLoadingCourses": "Could not load your courses.",
    "pleaseSelectCourse": "Please select a course.",
    "pleaseSelectMaterial": "Please select a material.",
    "quizGeneratedSuccessfully": "Quiz generated successfully!",
    "errorGeneratingQuizFromMaterial": "Failed to generate quiz from material.",
    "noCoursesFound": "No courses found. Please join a course first.",
    "noMaterialsFound": "No materials found for this course.",
    "selectCourse": "Select Course",
    "selectCoursePlaceholder": "-- Select a course --",
    "selectMaterial": "Select Material",
    "selectMaterialPlaceholder": "-- Select a material --",
    "generateQuizFromMaterial": "Generate Quiz from Material"
  },
  ar: {
    "errorNoMaterialId": "خطأ: لم يتم توفير معرف المادة.",
    "errorGeneratingQuiz": "خطأ في إنشاء الاختبار.",
    "generateFromMaterial": "إنشاء اختبار من المادة",
    "generatedQuiz": "الاختبار الذي تم إنشاؤه",
    "readyToGenerateFromMaterial": "جاهز لإنشاء اختبار من المادة",
    "startQuizGeneration": "بدء إنشاء الاختبار",
    "errorLoadingCourses": "تعذر تحميل دوراتك.",
    "pleaseSelectCourse": "يرجى اختيار دورة.",
    "pleaseSelectMaterial": "يرجى اختيار مادة.",
    "quizGeneratedSuccessfully": "تم إنشاء الاختبار بنجاح!",
    "errorGeneratingQuizFromMaterial": "فشل في إنشاء الاختبار من المادة.",
    "noCoursesFound": "لم يتم العثور على دورات. يرجى الانضمام إلى دورة أولاً.",
    "noMaterialsFound": "لا توجد مواد لهذه الدورة.",
    "selectCourse": "اختر الدورة",
    "selectCoursePlaceholder": "-- اختر دورة --",
    "selectMaterial": "اختر المادة",
    "selectMaterialPlaceholder": "-- اختر مادة --",
    "generateQuizFromMaterial": "إنشاء اختبار من المادة",
    "aiQuizGenerator": "مولد الاختبارات الذكي",
    "home": "الرئيسية",
    "generate": "إنشاء",
    "history": "السجل",
    "dashboard": "لوحة التحكم",
    "myCourses": "دوراتي",
    "teacherDashboard": "لوحة تحكم المعلم",
    "adminDashboard": "لوحة تحكم المشرف",
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
    "apiKeyError": "تعذر الاتصال بخدمة إنشاء الاختبارات. يرجى المحاولة مرة أخرى لاحقًا.",
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
    "reviewPerformance": "راجع أداءك في اختبار: \"{title}\",",
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
    "finalizingQuiz": "جاري إنهاء الاختبار...",
    "unknownError": "حدث خطأ غير معروف. يرجى المحاولة مرة أخرى.",
    "comfortableDefault": "مريح (افتراضي)",
    "questionsPerCase": "أسئلة لكل حالة",
    "numImageQuestions": "عدد أسئلة الصور",
    "imageOnlyInfo": "يمكنك إنشاء اختبار من صورة فقط، بدون الحاجة لنص أو ملف PDF.",
    "promptTooLongError": "النص طويل جدًا. الحد الأقصى {count} حرف مسموح به.",
    "pdfTooLargeError": "ملف PDF كبير جدًا. الحد الأقصى {size} ميجابايت مسموح به.",
    "tooManyQuestionsError": "لقد طلبت عددًا كبيرًا جدًا من الأسئلة. الحد الأقصى {count} سؤال مسموح به.",
    "noQuestionsRequestedError": "يرجى طلب سؤال واحد على الأقل.",
    "tooManyImagesError": "يمكنك رفع 5 صور كحد أقصى.",
    "imageLimitInfo": "الحد الأقصى: {count} صور. (تطبق حدود حجم ملفات فردية)",
    "remainingQuestionsInfo": "الأسئلة المتبقية: {count} / 50",
    "totalQuestionsLimitInfo": "إجمالي الأسئلة (متعددة الخيارات + الحالات * أسئلة/حالة + أسئلة الصور) يجب ألا يتجاوز {count}.",
    "untitledQuiz": "اختبار بدون عنوان",
    "errorLoadingHistory": "فشل تحميل سجل الاختبارات.",
    "confirmDeleteQuiz": "هل أنت متأكد من حذف هذا الاختبار؟",
    "errorDeletingQuiz": "فشل حذف الاختبار.",
    "loadingHistory": "جاري تحميل سجل الاختبارات...",
    "delete": "حذف",
    "saveAsHtml": "حفظ كملف HTML",
    "doubleClickInstruction": "للإجابة على السؤال، يرجى الضغط على إجابتك المختارة مرتين للتأكيد.",
    "uploadingFile": "جاري رفع الملف",
    "promptTruncated": "تم قص النص ليتوافق مع الحد الأقصى البالغ {count} حرفًا.",
    "pdfContentWarning": "ملاحظة: بالنسبة للملفات الكبيرة، قد يتم اقتطاع المحتوى بواسطة الخادم إذا تجاوز حد النص.",
    "pdfScanWarning": "This PDF appears to be made of images without selectable text, which can lead to poor quiz quality. For best results, use a text-based PDF.\n\nDo you want to continue anyway?",
    "analyzingPdf": "Analyzing PDF...",
    "trialEndsOn": "تنتهي الفترة التجريبية في {date}",
    "guestQuestionsRemaining": "الأسئلة المتبقية للضيف: {count}",
    "registerNowPrompt": "سجل الآن لفتح اختبارات غير محدودة!",
    "login": "تسجيل الدخول",
    "register": "تسجيل",
    "myUsageTitle": "استخدامي",
    "accountDetails": "تفاصيل الحساب",
    "planType": "نوع الخطة",
    "questionsToday": "أسئلة اليوم",
    "quotaResets": "إعادة تعيين الكوتا",
    "trialEnds": "انتهاء الفترة التجريبية",
    "loadingUserData": "جاري تحميل بيانات المستخدم...",
    "upgradeToPremium": "الترقية إلى بريميوم",
    "joinCourse": "الانضمام إلى دورة"
  }
};
export type TranslationKey = keyof typeof translations.en;

// --- TOAST NOTIFICATION SYSTEM ---
type Toast = {
    id: number;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error'; // Added success and error types
};

interface ToastContextType {
    addToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
        setTimeout(() => {
            setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
        }, 4000); // Notification disappears after 4 seconds
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 space-y-2 z-50">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast-animation bg-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-2xl border border-slate-700 flex items-center gap-3
                        ${toast.type === 'success' ? 'border-green-500' : ''}
                        ${toast.type === 'error' ? 'border-red-500' : ''}
                        ${toast.type === 'warning' ? 'border-amber-500' : ''}
                        ${toast.type === 'info' ? 'border-cyan-500' : ''}
                    `}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0
                            ${toast.type === 'success' ? 'bg-green-500' : ''}
                            ${toast.type === 'error' ? 'bg-red-500' : ''}
                            ${toast.type === 'warning' ? 'bg-amber-500' : ''}
                            ${toast.type === 'info' ? 'bg-cyan-500' : ''}
                        `}> 
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                        <p className="text-sm font-medium">{toast.message}</p>
                    </div>
                ))}
            </div>
             <style>{`
                .toast-animation {
                    animation: slide-in-out 4s ease-in-out forwards;
                }
                @keyframes slide-in-out {
                    0% { opacity: 0; transform: translateY(100%); } 
                    10% { opacity: 1; transform: translateY(0); }
                    90% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(100%); }
                }
            `}</style>
        </ToastContext.Provider>
    );
};


// --- SETTINGS CONTEXT ---
const defaultSettings: AppSettings = {
    theme: 'dark',
    fontSize: 'medium',
    uiLanguage: 'ar',
    temperature: 0.5,
    topP: 0.95,
    topK: 40,
    numMCQs: '5',
    numCases: '1',
    questionsPerCase: '2',
    numImageQuestions: '1',
    difficulty: 'Medium',
    additionalInstructions: '',
    quizLanguage: 'English',
    explanationLanguage: 'English',
    questionTypes: ['MCQ'], // Default to MCQ as per new design
    apiKey: '', // Initialize apiKey
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

const App: React.FC = () => {
    const { activeQuiz, quizToResume, setQuizToResume } = useQuiz();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Inject addToast function into the API service
    const { addToast } = useToast();
    useEffect(() => {
        setToastFunction(addToast);
    }, [addToast]);

    // Handle invite token from URL
    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const inviteToken = params.get('invite');
      if (inviteToken) {
        localStorage.setItem('qt_inviteToken', inviteToken);
        // Remove invite parameter from URL
        params.delete('invite');
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      }
    }, [location, navigate]);

    const handleStartQuizFromHistory = (quizData: Quiz) => {
        setQuizToResume(quizData);
    };
    const handleBackToCreator = () => {
        // This function might need to be adjusted depending on the desired behavior
    };
    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="container mx-auto p-4 sm:p-6 md:p-8">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/register" element={<AuthPage />} />
                    <Route path="/generate-text" element={<PrivateRoute><GenerateText /></PrivateRoute>} />
                    <Route path="/generate-pdf" element={<PrivateRoute><GeneratePDF /></PrivateRoute>} />
                    <Route path="/history" element={<HistoryPage onBack={handleBackToCreator} onRetake={handleStartQuizFromHistory} />} />
                    <Route path="/recall" element={<RecallPage onBack={handleBackToCreator} dueRecallItems={[]} />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/manage-devices" element={<PrivateRoute><ManageDevices /></PrivateRoute>} />
                    <Route path="/my-usage" element={<PrivateRoute><MyUsage /></PrivateRoute>} />
                    <Route path="/quiz" element={<QuizFlow initialQuiz={activeQuiz} quizToResume={quizToResume} onExit={handleBackToCreator} />} />
                    <Route path="/dashboard" element={<PrivateRoute roles={['student','teacher','admin','owner']}><Dashboard /></PrivateRoute>} />
                    <Route path="/teacher/dashboard" element={<PrivateRoute roles={['teacher']}><TeacherDashboard /></PrivateRoute>} />
                    <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin','owner']}><AdminDashboard /></PrivateRoute>} />
                    <Route path="/join-course" element={<PrivateRoute><JoinCourse /></PrivateRoute>} />
                    <Route path="/my-courses" element={<PrivateRoute><MyCourses /></PrivateRoute>} />
                    <Route path="/courses/:id" element={<PrivateRoute><CourseDetails /></PrivateRoute>} />
                    <Route path="/generate-from-material/:courseId/:materialId" element={<PrivateRoute><GenerateFromMaterial /></PrivateRoute>} />
                    <Route path="/student/dashboard" element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
                    <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
                    <Route path="/teacher/courses/:courseId/manage-materials" element={<PrivateRoute roles={['teacher']}><ManageMaterials /></PrivateRoute>} />
                </Routes>
            </div>
        </div>
    );
}

const AppWrapper: React.FC = () => {
    return (
        <SettingsProvider>
            <ToastProvider>
                <QuizProvider>
                    <App />
                </QuizProvider>
            </ToastProvider>
        </SettingsProvider>
    );
};

// Make the custom hook available for other components
export { useToast };
export default AppWrapper;