import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Quiz } from '../types';
import { GUEST_MAX_QUESTIONS } from '../constants';
import { User } from '../types';
import { Loader2Icon, FileTextIcon, ImageIcon, XIcon, ArrowRightIcon, Sparkles, UserCheck, UserIcon } from './ui/Icons';
import { useSettings, useTranslation, useToast } from '../App';
import { saveQuizToIndexedDB } from '../services/indexedDbService';
import { generateQuizContent } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
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

  const { settings, setSettings } = useSettings();
  const { t, lang } = useTranslation();
  const { addToast } = useToast();
  const { user, login, token, deviceId } = useAuth(); // Destructure login from useAuth

  const isGuest = !user || user.planType === 'guest';
  const maxQuestions = isGuest ? GUEST_MAX_QUESTIONS : (user ? user.maxQuota : 0);
  const currentQuota = user ? user.currentQuota : 0; // Use user.currentQuota

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
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      if (newText.length <= MAX_TEXT_LENGTH) {
          setPrompt(newText);
      }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = e.clipboardData.getData('text');
      const currentText = e.currentTarget.value;
      const selectionStart = e.currentTarget.selectionStart;
      const selectionEnd = e.currentTarget.selectionEnd;
      
      const newText = currentText.slice(0, selectionStart) + pastedText + currentText.slice(selectionEnd);

      if (newText.length > MAX_TEXT_LENGTH) {
          addToast(t("promptTruncated" as any, { count: MAX_TEXT_LENGTH.toLocaleString() }), 'warning');
      }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGuest) return;
    const file = e.target.files ? e.target.files[0] : null;
    e.target.value = '';
    if (!file) return;

    const MAX_PDF_SIZE_MB = 10;
    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
        setError(t("pdfTooLargeError" as any, { size: MAX_PDF_SIZE_MB }));
        setSelectedFile(null);
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        addToast(t("pdfContentWarning" as any), 'warning');
    }

    if (file.type === 'application/pdf') {
        setIsAnalyzingPdf(true);
        setError(null);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let totalChars = 0;
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join('');
                totalChars += pageText.replace(/\s/g, '').length;
            }
            
            const avgCharsPerPage = pdf.numPages > 0 ? totalChars / pdf.numPages : 0;
            const CHARS_PER_PAGE_THRESHOLD = 100;

            if (avgCharsPerPage < CHARS_PER_PAGE_THRESHOLD) {
                if (!window.confirm(t("pdfScanWarning" as any))) {
                    setIsAnalyzingPdf(false);
                    return;
                }
            }
        } catch (pdfError) {
            console.error("Error analyzing PDF:", pdfError);
        } finally {
            setIsAnalyzingPdf(false);
        }
    }

    setSelectedFile(file);
    setError(null);
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

        // Update AuthContext with the new user data
        if (user && token && deviceId) { // Ensure user, token, and deviceId exist
            login(token, updatedUser, deviceId);
        } else if (updatedUser) { // Handle case where user might be a guest and just registered/logged in
            // This scenario is less likely here as login/register handles initial user setting
            // But as a fallback, if updatedUser is returned and current user is null, we can set it.
            // However, for quiz generation, a user (even guest) should have a deviceId.
            // The login function expects a token, so we can't just call login with updatedUser if no token.
            // For now, we rely on the existing user's token and deviceId.
            // If the backend sends a new token with updatedUser, we would need to handle that.
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
        console.error("Quiz generation error:", err);
        setError(`${t("errorPrefix" as any)} ${err.message}`);
    } finally {
        setIsLoading(false);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadSpeed(null);
    }
  }, [prompt, selectedFile, settings, selectedImages, onQuizGenerated, t, creationMode, imageUsage, isUploading, addToast, isGuest, currentQuota, user, token, deviceId, login]);

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

      <Card disabled={isGuest && creationMode === 'pdf'}>
        <CardHeader>{creationMode === 'text' ? t('step1Text' as any) : t('step1Pdf' as any)}</CardHeader>
        <CardContent>
            {creationMode === 'text' ? (
                 <>
                    <textarea
                        value={prompt}
                        onChange={handlePromptChange}
                        onPaste={handlePaste}
                        placeholder={t("textPlaceholder" as any)}
                        className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition min-h-[150px] text-gray-200 placeholder-gray-500"
                        rows={6}
                        maxLength={MAX_TEXT_LENGTH}
                    />
                    <div className="text-right text-xs font-mono text-gray-400 mt-1">
                        {prompt.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
                    </div>
                 </>
            ) : (
                <>
                    <label htmlFor="file-input" className={`w-full flex items-center justify-center gap-3 px-4 py-10 border-2 border-dashed border-slate-600 rounded-lg transition ${isAnalyzingPdf || isGuest ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-700/50 hover:border-cyan-400'}`}
                        title={isGuest ? t('featureForRegisteredUsers' as any) : ''}
                    >
                       {isAnalyzingPdf ? (
                           <>
                                <Loader2Icon className="w-8 h-8 text-slate-400 animate-spin" />
                                <span className="text-base font-semibold text-slate-300">{t("analyzingPdf" as any)}</span>
                           </>
                       ) : (
                           <>
                                <FileTextIcon className="w-8 h-8 text-slate-400" />
                                <span className="text-base font-semibold text-slate-300">{t("pdfUploadInstruction" as any)}</span>
                           </>
                       )}
                    </label>
                    <input id="file-input" type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileChange} disabled={isAnalyzingPdf || isGuest} />
                    <FileInputDisplay file={selectedFile} onClear={clearSelectedFile} icon={<FileTextIcon className="w-5 h-5 text-cyan-400" />} />
                    {isGuest && <p className="text-xs text-cyan-300 text-center mt-2">{t('pdfUploadGuestInfo' as any)}</p>}
                </>
            )}
        </CardContent>
      </Card>
      
      <Card disabled={isGuest}>
        <CardHeader>{t('step2ImageIntegration' as any)}</CardHeader>
        <CardContent>
            <p className="text-sm text-gray-400 mb-4">{t('imageIntegrationDesc' as any)}</p>
            <label htmlFor="image-input" className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-600 rounded-lg ${isGuest ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-700/50 hover:border-cyan-400'} transition`}
              title={isGuest ? t('featureForRegisteredUsers' as any) : ''}
            >
              <ImageIcon className="w-8 h-8 text-slate-400" />
              <span className="text-base font-semibold text-slate-300">{t("addImage" as any)} (up to 5)</span>
            </label>
            <input id="image-input" type="file" className="hidden" accept="image/*" multiple onChange={(e) => {
                if (isGuest) return;
                if (e.target.files) {
                    const files = Array.from(e.target.files);
                    const combined = [...selectedImages, ...files];
                     if (combined.length > 5) {
                        setError(t("tooManyImagesError" as any, { count: 5 }));
                        setSelectedImages(combined.slice(0, 5));
                    } else {
                        setSelectedImages(combined);
                    }
                    e.target.value = '';
                }
            }} disabled={isGuest} />

            {selectedImages.map((file, index) => (
                <div key={index} className="mt-4 flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                        <ImageIcon className="w-5 h-5 text-cyan-400" />
                        <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                    </div>
                    <button onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== index))} className="p-1 text-gray-400 hover:text-white">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}

            {selectedImages.length > 0 && (
                <div className={`mt-6 ${isGuest ? 'opacity-50' : ''}`}>
                    <label className="font-medium text-gray-300 block mb-3">{t('imageUsageTitle' as any)}</label>
                    <div className="space-y-3">
                        {(['auto', 'link', 'about'] as ImageUsage[]).map((usage) => (
                           <label key={usage} className={`flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700 ${isGuest ? 'cursor-not-allowed' : 'hover:border-cyan-400 cursor-pointer'} transition-colors`}>
                             <input
                               type="radio"
                               name="imageUsage"
                               value={usage}
                               checked={imageUsage === usage}
                               onChange={() => setImageUsage(usage)}
                               className="w-4 h-4 mt-1 bg-slate-700 border-slate-500 text-cyan-500 focus:ring-cyan-500 accent-cyan-500 shrink-0"
                               disabled={isGuest}
                             />
                             <span className="text-gray-300 text-sm">{t(`imageUsage${usage.charAt(0).toUpperCase() + usage.slice(1)}` as any)}</span>
                           </label>
                        ))}
                    </div>
                </div>
            )}
             {isGuest && <p className="text-xs text-cyan-300 text-center mt-4">{t('imageUploadGuestInfo' as any)}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>{t('step3Settings' as any)}</CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 mb-4 text-center">
            {isGuest 
              ? t("guestRemainingQuestionsInfo" as any, { count: remainingQuestions < 0 ? 0 : remainingQuestions, max: maxQuestions })
              : t("remainingQuestionsInfo" as any, { count: remainingQuestions < 0 ? 0 : remainingQuestions })
            }
          </p>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 ${isGuest ? 'opacity-60' : ''}`}>
            <div className="space-y-2">
              <label htmlFor="num-mcqs" className="font-medium text-gray-300">{t("numMCQs" as any)}</label>
              <input id="num-mcqs" type="number" min="0"
                max={currentQuota - ((parseInt(settings.numCases, 10) || 0) * (parseInt(settings.questionsPerCase, 10) || 0)) - (parseInt(settings.numImageQuestions, 10) || 0)}
                value={settings.numMCQs} onChange={e => handleSettingChange('numMCQs', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400 disabled:cursor-not-allowed"
                disabled={isGuest && (parseInt(settings.numMCQs, 10) || 0) >= GUEST_MAX_QUESTIONS}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="num-cases" className="font-medium text-gray-300">{t("numCases" as any)}</label>
              <input id="num-cases" type="number" min="0" 
                max={Math.floor((currentQuota - (parseInt(settings.numMCQs, 10) || 0) - (parseInt(settings.numImageQuestions, 10) || 0)) / (parseInt(settings.questionsPerCase, 10) || 1))}
                value={settings.numCases} onChange={e => handleSettingChange('numCases', e.target.value)}
                 className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400 disabled:cursor-not-allowed"
                 disabled={isGuest}
              />
            </div>
             <div className="space-y-2">
              <label htmlFor="questions-per-case" className="font-medium text-gray-300">{t("questionsPerCase" as any)}</label>
              <input id="questions-per-case" type="number" min="0" max="5" value={settings.questionsPerCase} onChange={e => handleSettingChange('questionsPerCase', e.target.value)}
                 className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400 disabled:cursor-not-allowed"
                 disabled={isGuest}
              />
            </div>
             {selectedImages.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="num-image-questions" className="font-medium text-gray-300">{t("numImageQuestions" as any)}</label>
                <input id="num-image-questions" type="number" min="0" 
                  max={currentQuota - (parseInt(settings.numMCQs, 10) || 0) - ((parseInt(settings.numCases, 10) || 0) * (parseInt(settings.questionsPerCase, 10) || 0))}
                  value={settings.numImageQuestions} onChange={e => handleSettingChange('numImageQuestions', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400 disabled:cursor-not-allowed"
                  disabled={isGuest}
                />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="difficulty" className="font-medium text-gray-300">{t("difficultyLevel" as any)}</label>
              <select id="difficulty" value={settings.difficulty} onChange={e => handleSettingChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400">
                  <option value="Medium">{t("comfortableDefault" as any)}</option>
                  <option value="Easy">{t("settingsEasy" as any)}</option>
                  <option value="Hard">{t("settingsHard" as any)}</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
                <label htmlFor="instructions" className="font-medium text-gray-300">{t("additionalInstructions" as any)}</label>
                <textarea id="instructions" value={settings.additionalInstructions} onChange={e => handleSettingChange('additionalInstructions', e.target.value)}
                    placeholder={t("instructionsPlaceholder" as any)}
                    className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400 min-h-[80px]"
                    rows={3}
                />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isUploading && (
        <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
            <div className="flex justify-between items-center text-sm font-medium text-gray-200 mb-2">
                <span>{t('uploadingFile' as any)}... {uploadProgress.toFixed(0)}%</span>
                {uploadSpeed && <span className="font-mono text-cyan-300">{uploadSpeed}</span>}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${uploadProgress}%`, transition: 'width 0.2s ease-in-out' }}></div>
            </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg">
          <strong>{t("errorPrefix" as any)}</strong> {error}
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={handleGenerateQuiz}
          disabled={isLoading || isAnalyzingPdf || (isGuest && creationMode === 'pdf') || (!(creationMode === 'pdf' ? selectedFile : prompt) && selectedImages.length === 0) || currentQuota <= 0}
          className="w-full bg-cyan-500 text-white font-bold text-lg py-4 px-6 rounded-lg hover:bg-cyan-600 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transform hover:-translate-y-1"
          title={isGuest && creationMode === 'pdf' ? t('featureForRegisteredUsers' as any) : ''}
        >
          {isLoading ? (
             <div className="flex items-center gap-3">
                <Loader2Icon className="w-6 h-6 animate-spin" />
                <span>{isUploading ? t('uploadingFile' as any) : t('processing' as any)}...</span>
            </div>
          ) : (
            t("generateNow" as any)
          )}
        </button>
        {isGuest && (
          <p className="text-center text-sm text-gray-400 mt-4">
            {t('saveQuizzesPrompt' as any)}{' '}
            <Link to="/register" className="text-cyan-400 hover:underline font-semibold">{t('createAnAccount' as any)}</Link>.
          </p>
        )}
      </div>
    </div>
  );
};

export default QuizCreator;