
import React, { useState, useCallback } from 'react';
import { Quiz } from '../types';
import { generateQuizContent } from '../services/geminiService';
import { Loader2Icon, FileTextIcon, ImageIcon, XIcon, ArrowRightIcon } from './ui/Icons';
import { useSettings, useTranslation } from '../App';

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
    <h3 className="font-bold text-xl text-cyan-300 font-tajawal">{children}</h3>
  </div>
);

const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6">
    {children}
  </div>
);

type ImageUsage = 'auto' | 'link' | 'about';

const QuizCreator: React.FC<QuizCreatorProps> = ({ creationMode, onQuizGenerated, onBackToChoice }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUsage, setImageUsage] = useState<ImageUsage>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const { settings, setSettings } = useSettings();
  const { t, lang } = useTranslation();

  const handleSettingChange = (field: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateQuiz = useCallback(async () => {
    if (!prompt && !selectedFile && !selectedImage) {
      setError(t("inputError"));
      return;
    }

    setIsLoading(true);
    setError(null);

    // Set loading messages
    if (creationMode === 'pdf' && selectedFile) {
        setLoadingMessage('Analyzing PDF document...');
    } else if (selectedImage) {
        setLoadingMessage('Analyzing image and crafting questions...');
    }
    else {
        setLoadingMessage('Crafting questions...');
    }

    try {
      // The subject is not part of the new UI, so we pass an empty string
      const generatedQuiz = await generateQuizContent(prompt, '', settings, selectedFile, selectedImage, imageUsage);
      
      setLoadingMessage('Finalizing quiz...');

      if (selectedImage) {
          const reader = new FileReader();
          reader.onloadend = () => {
              onQuizGenerated({ ...generatedQuiz, selectedImageFile: reader.result as string });
          };
          reader.readAsDataURL(selectedImage);
      } else {
          onQuizGenerated(generatedQuiz);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [prompt, settings, selectedFile, selectedImage, onQuizGenerated, t, creationMode, imageUsage]);

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
            { !prompt && !selectedFile && selectedImage && 
                <p className="text-sm text-cyan-300 mb-4 font-semibold">{t('imageOnlyInfo')}</p>
            }
            <label htmlFor="image-input" className="w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 hover:border-cyan-400 transition">
              <ImageIcon className="w-8 h-8 text-slate-400" />
              <span className="text-base font-semibold text-slate-300">{t("addImage")}</span>
            </label>
            <input id="image-input" type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedImage(e.target.files ? e.target.files[0] : null)} />
            <FileInputDisplay file={selectedImage} onClear={() => setSelectedImage(null)} icon={<ImageIcon className="w-5 h-5 text-cyan-400" />} />

            {selectedImage && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div className="space-y-2">
              <label htmlFor="num-mcqs" className="font-medium text-gray-300">{t("numMCQs")}</label>
              <input id="num-mcqs" type="number" min="1" max="20" value={settings.numMCQs} onChange={e => handleSettingChange('numMCQs', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="num-cases" className="font-medium text-gray-300">{t("numCases")}</label>
              <input id="num-cases" type="number" min="0" max="10" value={settings.numCases} onChange={e => handleSettingChange('numCases', e.target.value)}
                 className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400"
              />
            </div>
             <div className="space-y-2">
              <label htmlFor="questions-per-case" className="font-medium text-gray-300">{t("questionsPerCase")}</label>
              <input id="questions-per-case" type="number" min="1" max="5" value={settings.questionsPerCase} onChange={e => handleSettingChange('questionsPerCase', e.target.value)}
                 className="w-full px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-400"
              />
            </div>
             {selectedImage && (
              <div className="space-y-2">
                <label htmlFor="num-image-questions" className="font-medium text-gray-300">{t("numImageQuestions")}</label>
                <input id="num-image-questions" type="number" min="0" max="10" value={settings.numImageQuestions} onChange={e => handleSettingChange('numImageQuestions', e.target.value)}
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
          disabled={isLoading || (!prompt && !selectedFile && !selectedImage)}
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