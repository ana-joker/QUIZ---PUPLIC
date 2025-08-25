
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Quiz } from '../types';
import { Loader2Icon, FileTextIcon, ImageIcon, XIcon, ArrowRightIcon } from './ui/Icons';
import { useSettings, useTranslation, useToast } from '../App';
import { saveQuizToIndexedDB } from '../services/indexedDbService';
import { generateQuizContent } from '../services/geminiService';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Configure the PDF.js worker to enable text extraction in the browser.
GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs';

interface QuizCreatorProps {
  creationMode: 'text' | 'pdf';
  onQuizGenerated: (quiz: Quiz) => void;
  onBackToChoice: () => void;
}

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`bg-slate-800/40 backdrop-blur-md border border-slate-600/50 rounded-2xl shadow-lg ${className}`}>
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
  const [fileTextContent, setFileTextContent] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUsage, setImageUsage] = useState<ImageUsage>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingQuestions, setRemainingQuestions] = useState(50);

  const { settings, setSettings } = useSettings();
  const { t, lang } = useTranslation();
  const { addToast } = useToast();

  useEffect(() => {
    const MAX_TOTAL_QUESTIONS = 50;
    const currentNumMCQs = parseInt(settings.numMCQs, 10) || 0;
    const currentNumCases = parseInt(settings.numCases, 10) || 0;
    const currentQPerCase = parseInt(settings.questionsPerCase, 10) || 0;
    const currentNumImageQuestions = parseInt(settings.numImageQuestions, 10) || 0;

    const totalRequested = currentNumMCQs + (currentNumCases * currentQPerCase) + currentNumImageQuestions;
    const remaining = MAX_TOTAL_QUESTIONS - totalRequested;
    setRemainingQuestions(remaining < 0 ? 0 : remaining);
  }, [settings.numMCQs, settings.numCases, settings.questionsPerCase, settings.numImageQuestions]);


  const handleSettingChange = (field: keyof typeof settings, value: any) => {
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
          addToast(t("promptTruncated", { count: MAX_TEXT_LENGTH.toLocaleString() }), 'warning');
      }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    const MAX_PDF_SIZE_MB = 10;
    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
        setError(t("pdfTooLargeError", { size: MAX_PDF_SIZE_MB }));
        setSelectedFile(null);
        setFileTextContent(null);
        return;
    }

    setSelectedFile(file);
    setError(null);
    setIsParsingFile(true);

    try {
        let fullText = '';
        if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await getDocument({ data: arrayBuffer }).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
            }
        } else { // Handle .txt and other text-based files
            fullText = await file.text();
        }

        if (fullText.length > MAX_TEXT_LENGTH) {
            setFileTextContent(fullText.substring(0, MAX_TEXT_LENGTH));
            addToast(t("pdfContentTruncated", { count: MAX_TEXT_LENGTH.toLocaleString() }), 'warning');
        } else {
            setFileTextContent(fullText);
        }
    } catch (parseError: any) {
        console.error("Error parsing file:", parseError);
        let userErrorMessage = t("pdfReadError");
        if (parseError.name === 'PasswordException') {
            userErrorMessage = t("pdfPasswordProtected");
        } else if (parseError.name === 'InvalidPDFException') {
            userErrorMessage = t("pdfInvalid");
        }
        setError(userErrorMessage);
        setSelectedFile(null);
        setFileTextContent(null);
    } finally {
        setIsParsingFile(false);
        e.target.value = ''; // Allow re-selecting the same file
    }
  };

    const clearSelectedFile = () => {
        setSelectedFile(null);
        setFileTextContent(null);
    };

  const handleGenerateQuiz = useCallback(async () => {
    const mainContent = creationMode === 'pdf' ? fileTextContent : prompt;
    if (!mainContent && selectedImages.length === 0) {
      setError(t("inputError"));
      return;
    }
    
    const MAX_IMAGES = 5;
    if (selectedImages.length > MAX_IMAGES) {
        setError(t("tooManyImagesError", { count: MAX_IMAGES }));
        return;
    }
    const totalMCQs = parseInt(settings.numMCQs, 10) || 0;
    const totalCases = parseInt(settings.numCases, 10) || 0;
    const qPerCase = parseInt(settings.questionsPerCase, 10) || 0;
    const totalImageQuestions = parseInt(settings.numImageQuestions, 10) || 0;
    const calculatedTotalQuestions = totalMCQs + (totalCases * qPerCase) + totalImageQuestions;
    if (calculatedTotalQuestions <= 0) {
        setError(t("noQuestionsRequestedError"));
        return;
    }
    if (calculatedTotalQuestions > 50) {
        setError(t("tooManyQuestionsError", { count: 50 }));
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
        const generatedQuiz = await generateQuizContent(
            mainContent || '', '', settings,
            null, // File object is not sent; its content is sent in the prompt
            selectedImages, imageUsage, onUploadProgress
        );

        let base64Images: string[] = [];
        if (selectedImages.length > 0) {
            const imagePromises = selectedImages.map(imageFile => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageFile);
                });
            });
            base64Images = await Promise.all(imagePromises);
        }
        
        const quizWithImages = { ...generatedQuiz, selectedImageFiles: base64Images };
        const savedId = await saveQuizToIndexedDB(quizWithImages);
        const quizWithId = { ...quizWithImages, id: savedId };
        onQuizGenerated(quizWithId);

    } catch (err: any) {
        console.error("Quiz generation error:", err);
        setError(`${t("errorPrefix")} ${err.message}`);
    } finally {
        setIsLoading(false);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadSpeed(null);
    }
  }, [prompt, fileTextContent, settings, selectedImages, onQuizGenerated, t, creationMode, imageUsage, isUploading, addToast]);

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
    <div className="max-w-3xl mx-auto space-y-8">
      <button onClick={onBackToChoice} className="flex items-center gap-2 text-cyan-300 hover:text-cyan-100 transition-colors font-semibold">
          <ArrowRightIcon className={`w-5 h-5 ${lang === 'ar' ? '' : 'rotate-180'}`} />
          {t("backToSelection")}
      </button>

      <Card>
        <CardHeader>{creationMode === 'text' ? t('step1Text') : t('step1Pdf')}</CardHeader>
        <CardContent>
            {creationMode === 'text' ? (
                 <>
                    <textarea
                        value={prompt}
                        onChange={handlePromptChange}
                        onPaste={handlePaste}
                        placeholder={t("textPlaceholder")}
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
                    <label htmlFor="file-input" className={`w-full flex items-center justify-center gap-3 px-4 py-10 border-2 border-dashed border-slate-600 rounded-lg transition ${isParsingFile ? 'cursor-wait' : 'cursor-pointer hover:bg-slate-700/50 hover:border-cyan-400'}`}>
                       {isParsingFile ? (
                           <Loader2Icon className="w-8 h-8 text-slate-400 animate-spin" />
                       ) : (
                           <FileTextIcon className="w-8 h-8 text-slate-400" />
                       )}
                       <span className="text-base font-semibold text-slate-300">
                           {isParsingFile ? t('analyzingPdf') : t("pdfUploadInstruction")}
                        </span>
                    </label>
                    <input id="file-input" type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileChange} disabled={isParsingFile} />
                    <FileInputDisplay file={selectedFile} onClear={clearSelectedFile} icon={<FileTextIcon className="w-5 h-5 text-cyan-400" />} />
                </>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>{t('step2ImageIntegration')}</CardHeader>
        <CardContent>
            <p className="text-sm text-gray-400 mb-4">{t('imageIntegrationDesc')}</p>
            { creationMode === 'text' && !prompt && selectedImages.length > 0 &&
                <p className="text-sm text-cyan-300 mb-4 font-semibold">{t('imageOnlyInfo')}</p>
            }
            { creationMode === 'pdf' && !fileTextContent && selectedImages.length > 0 &&
                <p className="text-sm text-cyan-300 mb-4 font-semibold">{t('imageOnlyInfo')}</p>
            }
            <label htmlFor="image-input" className="w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 hover:border-cyan-400 transition">
              <ImageIcon className="w-8 h-8 text-slate-400" />
              <span className="text-base font-semibold text-slate-300">{t("addImage")} (up to 5)</span>
            </label>
            <input id="image-input" type="file" className="hidden" accept="image/*" multiple onChange={(e) => {
                if (e.target.files) {
                    const files = Array.from(e.target.files);
                    const combined = [...selectedImages, ...files];
                     if (combined.length > 5) {
                        setError(t("tooManyImagesError", { count: 5 }));
                        setSelectedImages(combined.slice(0, 5));
                    } else {
                        setSelectedImages(combined);
                    }
                    e.target.value = '';
                }
            }} />

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
                <div className="mt-6">
                    <label className="font-medium text-gray-300 block mb-3">{t('imageUsageTitle')}</label>
                    <div className="space-y-3">
                        {(['auto', 'link', 'about'] as ImageUsage[]).map((usage) => (
                           <label key={usage} className="flex items-start gap-3 cursor-pointer bg-slate-900/50 p-3 rounded-lg border border-slate-700 hover:border-cyan-400 transition-colors">
                             <input
                               type="radio"
                               name="imageUsage"
                               value={usage}
                               checked={imageUsage === usage}
                               onChange={() => setImageUsage(usage)}
                               className="w-4 h-4 mt-1 bg-slate-700 border-slate-500 text-cyan-500 focus:ring-cyan-500 accent-cyan-500 shrink-0"
                             />
                             <span className="text-gray-300 text-sm">{t(`imageUsage${usage.charAt(0).toUpperCase() + usage.slice(1)}` as any)}</span>
                           </label>
                        ))}
                    </div>
                </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>{t('step3Settings')}</CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 mb-4 text-center">
            {t("remainingQuestionsInfo", { count: remainingQuestions < 0 ? 0 : remainingQuestions })}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div className="space-y-2">
              <label htmlFor="num-mcqs" className="font-medium text-gray-300">{t("numMCQs")}</label>
              <input id="num-mcqs" type="number" min="0"
                max={50 - ((parseInt(settings.numCases, 10) || 0) * (parseInt(settings.questionsPerCase, 10) || 0)) - (parseInt(settings.numImageQuestions, 10) || 0)}
                value={settings.numMCQs} onChange={e => handleSettingChange('numMCQs', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="num-cases" className="font-medium text-gray-300">{t("numCases")}</label>
              <input id="num-cases" type="number" min="0" 
                max={Math.floor((50 - (parseInt(settings.numMCQs, 10) || 0) - (parseInt(settings.numImageQuestions, 10) || 0)) / (parseInt(settings.questionsPerCase, 10) || 1))}
                value={settings.numCases} onChange={e => handleSettingChange('numCases', e.target.value)}
                 className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400"
              />
            </div>
             <div className="space-y-2">
              <label htmlFor="questions-per-case" className="font-medium text-gray-300">{t("questionsPerCase")}</label>
              <input id="questions-per-case" type="number" min="0" max="5" value={settings.questionsPerCase} onChange={e => handleSettingChange('questionsPerCase', e.target.value)}
                 className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400"
              />
            </div>
             {selectedImages.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="num-image-questions" className="font-medium text-gray-300">{t("numImageQuestions")}</label>
                <input id="num-image-questions" type="number" min="0" 
                  max={50 - (parseInt(settings.numMCQs, 10) || 0) - ((parseInt(settings.numCases, 10) || 0) * (parseInt(settings.questionsPerCase, 10) || 0))}
                  value={settings.numImageQuestions} onChange={e => handleSettingChange('numImageQuestions', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="difficulty" className="font-medium text-gray-300">{t("difficultyLevel")}</label>
              <select id="difficulty" value={settings.difficulty} onChange={e => handleSettingChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400">
                  <option value="Medium">{t("comfortableDefault")}</option>
                  <option value="Easy">{t("settingsEasy")}</option>
                  <option value="Hard">{t("settingsHard")}</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
                <label htmlFor="instructions" className="font-medium text-gray-300">{t("additionalInstructions")}</label>
                <textarea id="instructions" value={settings.additionalInstructions} onChange={e => handleSettingChange('additionalInstructions', e.target.value)}
                    placeholder={t("instructionsPlaceholder")}
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
                <span>{t('uploadingFile')}... {uploadProgress.toFixed(0)}%</span>
                {uploadSpeed && <span className="font-mono text-cyan-300">{uploadSpeed}</span>}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${uploadProgress}%`, transition: 'width 0.2s ease-in-out' }}></div>
            </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg">
          <strong>{t("errorPrefix")}</strong> {error}
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={handleGenerateQuiz}
          disabled={isLoading || isParsingFile || (!(creationMode === 'pdf' ? fileTextContent : prompt) && selectedImages.length === 0)}
          className="w-full bg-cyan-500 text-white font-bold text-lg py-4 px-6 rounded-lg hover:bg-cyan-600 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transform hover:-translate-y-1"
        >
          {isLoading ? (
             <div className="flex items-center gap-3">
                <Loader2Icon className="w-6 h-6 animate-spin" />
                <span>{isUploading ? t('uploadingFile') : t('processing')}...</span>
            </div>
          ) : (
            t("generateNow")
          )}
        </button>
      </div>
    </div>
  );
};

export default QuizCreator;
