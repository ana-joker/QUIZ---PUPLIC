

import React, { useState, useCallback, useEffect } from 'react';
import { Quiz } from '../types';
import { Loader2Icon, FileTextIcon, ImageIcon, XIcon, ArrowRightIcon } from './ui/Icons';
import { useSettings, useTranslation } from '../App';
import { saveQuizToIndexedDB } from '../services/indexedDbService';

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

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const base64Content = reader.result.split(',')[1];
                if (base64Content) {
                    resolve(base64Content);
                } else {
                    reject(new Error('File content is empty or invalid data URL.'));
                }
            } else {
                reject(new Error('Failed to read file as data URL.'));
            }
        };
        reader.onerror = error => reject(error);
    });
};

const QuizCreator: React.FC<QuizCreatorProps> = ({ creationMode, onQuizGenerated, onBackToChoice }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUsage, setImageUsage] = useState<ImageUsage>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [remainingQuestions, setRemainingQuestions] = useState(50);

  const { settings, setSettings } = useSettings();
  const { t, lang } = useTranslation();

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

  const handleGenerateQuiz = useCallback(async () => {
    // 1. Basic input check
    if (!prompt && !selectedFile && selectedImages.length === 0) {
      setError(t("inputError"));
      return;
    }

    // 2. Content limits check
    if (creationMode === 'text' && prompt.length > 40000) {
        setError(t("promptTooLongError", { count: '40,000' }));
        return;
    }

    if (creationMode === 'pdf' && selectedFile) {
        const MAX_PDF_SIZE_MB = 10;
        if (selectedFile.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
            setError(t("pdfTooLargeError", { size: MAX_PDF_SIZE_MB }));
            return;
        }
    }

    const MAX_IMAGES = 5;
    if (selectedImages.length > MAX_IMAGES) {
        setError(t("tooManyImagesError", { count: MAX_IMAGES }));
        return;
    }

    // 3. Question count check
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

    try {
        setIsLoading(true);
        setError(null);

        if (creationMode === 'pdf' && selectedFile) {
            setLoadingMessage(t('processing'));
        } else if (selectedImages.length > 0) {
            setLoadingMessage(t('processing'));
        }
        else {
            setLoadingMessage(t('processing'));
        }

        const payload: any = {
            prompt,
            settings,
            imageUsage,
        };

        if (selectedFile) {
            payload.file = {
                content: await fileToBase64(selectedFile),
                name: selectedFile.name,
                type: selectedFile.type,
            };
        }

        if (selectedImages.length > 0) {
            payload.images = await Promise.all(selectedImages.map(async (imageFile) => ({
                content: await fileToBase64(imageFile),
                name: imageFile.name,
                type: imageFile.type,
            })));
        }

        const response = await fetch(`https://quiz-puplic-production.up.railway.app/generate-quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });


        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || t("unknownError"));
        }

        const generatedQuiz: Quiz = await response.json();

        setLoadingMessage(t('finalizingQuiz'));

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

        // Save the newly generated quiz to IndexedDB and get its ID
        const savedId = await saveQuizToIndexedDB(quizWithImages);
        
        const quizWithId = { ...quizWithImages, id: savedId };

        onQuizGenerated(quizWithId);

    } catch (err: any) {
        console.error("Quiz generation error:", err);
        setError(`${t("errorPrefix")} ${err.message}`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [prompt, settings, selectedFile, selectedImages, onQuizGenerated, t, creationMode, imageUsage]);

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
                 <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t("textPlaceholder")}
                    className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition min-h-[150px] text-gray-200 placeholder-gray-500"
                    rows={6}
                    maxLength={40000}
                />
            ) : (
                <>
                    <label htmlFor="file-input" className="w-full flex items-center justify-center gap-3 px-4 py-10 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 hover:border-cyan-400 transition">
                       <FileTextIcon className="w-8 h-8 text-slate-400" />
                       <span className="text-base font-semibold text-slate-300">{t("pdfUploadInstruction")}</span>
                    </label>
                    <input id="file-input" type="file" className="hidden" accept=".pdf,.txt" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                    <FileInputDisplay file={selectedFile} onClear={() => setSelectedFile(null)} icon={<FileTextIcon className="w-5 h-5 text-cyan-400" />} />
                </>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>{t('step2ImageIntegration')}</CardHeader>
        <CardContent>
            <p className="text-sm text-gray-400 mb-4">{t('imageIntegrationDesc')}</p>
            { !prompt && !selectedFile && selectedImages.length > 0 && 
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
      
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg">
          <strong>{t("errorPrefix")}</strong> {error}
        </div>
      )}

      <div className="mt-8">
        <button
          onClick={handleGenerateQuiz}
          disabled={isLoading || (!prompt && !selectedFile && selectedImages.length === 0)}
          className="w-full bg-cyan-500 text-white font-bold text-lg py-4 px-6 rounded-lg hover:bg-cyan-600 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transform hover:-translate-y-1"
        >
          {isLoading ? (
            <>
              <Loader2Icon className="w-6 h-6 animate-spin" />
              <span>{loadingMessage || t("processing")}</span>
            </>
          ) : (
            t("generateNow")
          )}
        </button>
      </div>
    </div>
  );
};

export default QuizCreator;