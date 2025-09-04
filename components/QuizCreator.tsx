import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Quiz } from '../types';
import { GUEST_MAX_QUESTIONS } from '../constants';
import { User } from '../types';
import { Loader2Icon, FileTextIcon, ImageIcon, XIcon, ArrowRightIcon, Sparkles, UserCheck, UserIcon } from './ui/Icons';
import { useSettings, useTranslation, useToast } from '../App';
import { saveQuizToIndexedDB } from '../services/indexedDbService';
import { generateQuizContent } from '../services/geminiService';
import QuotaModal from './QuotaModal';
import DeviceLimitModal from './DeviceLimitModal';
import { useAuthStore } from '../context/AuthStore';
import { Link } from 'react-router-dom';

interface QuizCreatorProps {
  creationMode: 'text' | 'pdf';
  onQuizGenerated: (quiz: Quiz) => void;
  onBackToChoice: () => void;
}

const Card: React.FC<{ children: React.ReactNode, className?: string, disabled?: boolean }> = ({ children, className, disabled }) => (
  <div className={`bg-slate-800/40 backdrop-blur-md border border-slate-600/50 rounded-2xl shadow-lg ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="border-b border-cyan-400/20 p-4">
    <h3 className="font-bold text-xl text-cyan-300 font-tajawal text-center md:text-start">{children}</h3>
  </div>
);

const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6">
    {children}
  </div>
);

type ImageUsage = 'auto' | 'link' | 'about';

const MAX_TEXT_LENGTH = 40000;
const MAX_PDF_SIZE_MB = 10;

const QuizCreator: React.FC<QuizCreatorProps> = ({ creationMode, onQuizGenerated, onBackToChoice }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUsage, setImageUsage] = useState<ImageUsage>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingQuestions, setRemainingQuestions] = useState(0);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaDetails, setQuotaDetails] = useState<{remaining:number,cap:number}|undefined>(undefined);
  const [deviceLimitModalOpen, setDeviceLimitModalOpen] = useState(false);

  const { settings, setSettings } = useSettings();
  const { t, lang } = useTranslation();
  const { addToast } = useToast();
  const { user, setUser, token, deviceId } = useAuthStore();

  const isGuest = !user;
  // Fix: Use fallback for maxQuota/currentQuota if not present on User
  const maxQuestions = isGuest ? GUEST_MAX_QUESTIONS : (user && 'maxQuota' in user ? (user as any).maxQuota : 0);
  const currentQuota = user && 'currentQuota' in user ? (user as any).currentQuota : 0;

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`;
  }, []);

  useEffect(() => {
    const currentNumMCQs = parseInt(settings.numMCQs, 10) || 0;
    const currentNumCases = parseInt(settings.numCases, 10) || 0;
    const currentQPerCase = parseInt(settings.questionsPerCase, 10) || 0;
    const currentNumImageQuestions = parseInt(settings.numImageQuestions, 10) || 0;

    const totalRequested = currentNumMCQs + (currentNumCases * currentQPerCase) + currentNumImageQuestions;
    const remaining = currentQuota - totalRequested; // Calculate remaining based on currentQuota
    setRemainingQuestions(remaining < 0 ? 0 : remaining);
  }, [settings.numMCQs, settings.numCases, settings.questionsPerCase, settings.numImageQuestions, currentQuota]);

  const handleSettingChange = (field: keyof typeof settings, value: any) => {
    if (isGuest) {
      const totalMCQs = field === 'numMCQs' ? (parseInt(value, 10) || 0) : (parseInt(settings.numMCQs, 10) || 0);
      const totalCases = field === 'numCases' ? (parseInt(value, 10) || 0) : (parseInt(settings.numCases, 10) || 0);
      const qPerCase = field === 'questionsPerCase' ? (parseInt(value, 10) || 0) : (parseInt(settings.questionsPerCase, 10) || 0);
      const totalImageQuestions = field === 'numImageQuestions' ? (parseInt(value, 10) || 0) : (parseInt(settings.numImageQuestions, 10) || 0);
      const calculatedTotalQuestions = totalMCQs + (totalCases * qPerCase) + totalImageQuestions;
      if (calculatedTotalQuestions > GUEST_MAX_QUESTIONS) {
        setError(t('guestQuestionLimitError' as any, { count: GUEST_MAX_QUESTIONS }));
        return;
      } else {
        setError(null);
      }
    }
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
  };

  const handleGenerateQuiz = useCallback(async () => {
    if (!(creationMode === 'pdf' ? selectedFile : prompt) && selectedImages.length === 0) {
      setError(t("inputError" as any));
      return;
    }
    const MAX_IMAGES = 5;
    if (selectedImages.length > MAX_IMAGES) {
      setError(t("tooManyImagesError" as any, { count: MAX_IMAGES }));
      return;
    }
    const totalMCQs = parseInt(settings.numMCQs, 10) || 0;
    const totalCases = parseInt(settings.numCases, 10) || 0;
    const qPerCase = parseInt(settings.questionsPerCase, 10) || 0;
    const totalImageQuestions = parseInt(settings.numImageQuestions, 10) || 0;
    const calculatedTotalQuestions = totalMCQs + (totalCases * qPerCase) + totalImageQuestions;
    if (calculatedTotalQuestions <= 0) {
      setError(t("noQuestionsRequestedError" as any));
      return;
    }
    if (calculatedTotalQuestions > currentQuota) {
      setError(t(isGuest ? 'guestQuestionLimitError' : "tooManyQuestionsError" as any, { count: currentQuota }));
      return;
    }
    setIsLoading(true);
    setError(null);
    let uploadStartTime = Date.now();
    let lastLoadedBytes = 0;
    const onUploadProgress = ({ loaded, total }: { loaded: number; total: number }) => {
      if (!isUploading) setIsUploading(true);
      if (total > 0) {
        const currentProgress = (loaded / total) * 100;
        setUploadProgress(currentProgress);
        const now = Date.now();
        const timeDiffSeconds = (now - uploadStartTime) / 1000;
        if (timeDiffSeconds > 0.5 || loaded === total) {
          const bytesDiff = loaded - lastLoadedBytes;
          const speedBps = timeDiffSeconds > 0 ? bytesDiff / timeDiffSeconds : 0;
          let speedText = '';
          if (speedBps > 1024 * 1024) {
            speedText = `${(speedBps / (1024 * 1024)).toFixed(2)} MB/s`;
          } else if (speedBps > 1024) {
            speedText = `${(speedBps / 1024).toFixed(1)} KB/s`;
          } else {
            speedText = `${speedBps.toFixed(0)} B/s`;
          }
          setUploadSpeed(speedText);
          uploadStartTime = now;
          lastLoadedBytes = loaded;
        }
        if (currentProgress >= 100) {
          setIsUploading(false);
        }
      }
    };
    try {
      const { quiz: generatedQuiz, user: updatedUser } = await generateQuizContent(
        creationMode === 'text' ? prompt : '',
        '',
        settings,
        creationMode === 'pdf' ? selectedFile : null,
        selectedImages,
        imageUsage,
        onUploadProgress
      );
      if (user && token && deviceId && updatedUser) {
        setUser(updatedUser as any);
      }
      let base64Images: string[] = [];
      if (selectedImages.length > 0) {
        base64Images = await Promise.all(selectedImages.map(imageFile => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });
        }));
      }
      const quizWithImages = { ...generatedQuiz, selectedImageFiles: base64Images };
      const savedId = await saveQuizToIndexedDB(quizWithImages);
      const quizWithId = { ...quizWithImages, id: savedId };
      onQuizGenerated(quizWithId);
    } catch (err: any) {
      if (err?.response) {
        if (err.response.status === 402) {
          setQuotaDetails(err.response.data?.details || undefined);
          setQuotaModalOpen(true);
        } else if (err.response.status === 403) {
          setDeviceLimitModalOpen(true);
        } else {
          setError(err.response.data?.message || t('errorGeneratingQuiz' as any));
        }
      } else {
        setError(t('errorGeneratingQuiz' as any));
      }
      console.error("Quiz generation error:", err);
    } finally {
      setIsLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSpeed(null);
    }
  }, [prompt, selectedFile, settings, selectedImages, onQuizGenerated, t, creationMode, imageUsage, isUploading, addToast, isGuest, currentQuota, user, token, deviceId]);

  const FileInputDisplay = ({ file, onClear, icon }: { file: File | null; onClear: () => void; icon: React.ReactNode }) => {
    if (!file) return null;
    return (
      <div className="mt-4 flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700">
        <div className="flex items-center gap-3 text-sm text-gray-300">
          {icon}
          <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
        </div>
        <button onClick={onClear} className="p-1 text-gray-400 hover:text-white">
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    );
  };
  
  return (
    <>
      <QuotaModal open={quotaModalOpen} details={quotaDetails} onUpgrade={()=>window.location.href='/billing'} onClose={()=>setQuotaModalOpen(false)} />
      <DeviceLimitModal open={deviceLimitModalOpen} onManageDevices={()=>{setDeviceLimitModalOpen(false);window.location.href='/manage-devices';}} onClose={()=>setDeviceLimitModalOpen(false)} />
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <button onClick={onBackToChoice} className="flex items-center gap-2 text-cyan-300 hover:text-cyan-100 transition-colors font-semibold">
            <ArrowRightIcon className={`w-5 h-5 ${lang === 'ar' ? '' : 'rotate-180'}`} />
            {t("backToSelection" as any)}
        </button>
        {isGuest ? (
          <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-400/30 rounded-2xl shadow-lg text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-cyan-500/20 text-cyan-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <UserIcon className="w-3 h-3" />
                  <span>{t('guestMode' as any)}</span>
              </div>
              <h4 className="text-xl font-bold text-cyan-300 mb-2">{t('guestTitle' as any)}</h4>
              <p className="text-gray-400 max-w-md mx-auto mb-4">{t('guestSubtitle' as any, { count: maxQuestions })}</p>
              <Link to="/register" className="bg-cyan-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-cyan-600 transition-all duration-300 inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20">
                  <Sparkles className="w-5 h-5" />
                  {t('unlockFullPower' as any)}
              </Link>
          </div>
        ) : (
          <div className="p-4 bg-slate-800/40 backdrop-blur-md border border-slate-600/50 rounded-2xl shadow-lg text-center flex items-center justify-center gap-3">
            <UserCheck className="w-6 h-6 text-cyan-300" />
            <p className="text-lg text-cyan-300">{t('welcomeBack' as any)}, {user.name}!</p>
          </div>
        )}
        {/* ...rest of QuizCreator UI goes here... */}
      </div>
    </>
  );
};

export default QuizCreator;