

import React, { useState, useEffect, useCallback } from 'react';
import { useSettings, useTranslation } from '../App';
import { AppSettings } from '../types';
import { XIcon } from './ui/Icons';

interface SettingsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPopover: React.FC<SettingsPopoverProps> = ({ isOpen, onClose }) => {
  const { settings, setSettings } = useSettings();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'quiz' | 'general'>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  // When the popover is opened, reset the local state to match the global context.
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  // Save the local state to the global context and close the popover.
  const handleSaveAndClose = useCallback(() => {
    setSettings(localSettings);
    onClose();
  }, [localSettings, setSettings, onClose]);
    
  // Handle escape key to close and save.
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
       if (isOpen && event.key === 'Escape') {
         handleSaveAndClose();
       }
    };
    window.addEventListener('keydown', handleEsc);
    
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handleSaveAndClose]);
    
  const handleLocalSettingChange = (field: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };
  
  const handleQuestionTypeChange = (type: string) => {
    const newTypes = localSettings.questionTypes.includes(type)
        ? localSettings.questionTypes.filter(t => t !== type)
        : [...localSettings.questionTypes, type];
    handleLocalSettingChange('questionTypes', newTypes);
  };
  
  const allQuestionTypes = ['MCQ', 'TrueFalse', 'ShortAnswer', 'Ordering', 'Matching'];

  const GeneralSettings = () => (
    <div className="space-y-6 text-sm">
      <div>
        <label className="font-medium text-gray-700 dark:text-gray-300">{t("settingsTheme")}</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => handleLocalSettingChange('theme', 'light')} className={`py-2 rounded-md ${localSettings.theme === 'light' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{t("settingsLightTheme")}</button>
            <button onClick={() => handleLocalSettingChange('theme', 'dark')} className={`py-2 rounded-md ${localSettings.theme === 'dark' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{t("settingsDarkTheme")}</button>
        </div>
      </div>
      <div>
        <label className="font-medium text-gray-700 dark:text-gray-300">{t("settingsLanguage")}</label>
        <select value={localSettings.uiLanguage} onChange={e => handleLocalSettingChange('uiLanguage', e.target.value)}
          className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-teal-500">
            <option value="en">English</option>
            <option value="ar">العربية</option>
        </select>
      </div>
       <div>
        <label className="font-medium text-gray-700 dark:text-gray-300">{t("settingsFontSize")}</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
            <button onClick={() => handleLocalSettingChange('fontSize', 'small')} className={`py-2 rounded-md ${localSettings.fontSize === 'small' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{t("settingsSmall")}</button>
            <button onClick={() => handleLocalSettingChange('fontSize', 'medium')} className={`py-2 rounded-md ${localSettings.fontSize === 'medium' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{t("settingsMedium")}</button>
            <button onClick={() => handleLocalSettingChange('fontSize', 'large')} className={`py-2 rounded-md ${localSettings.fontSize === 'large' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>{t("settingsLarge")}</button>
        </div>
      </div>
    </div>
  );

  const QuizSettings = () => (
    <div className="space-y-6 text-sm">
        <div>
            <label htmlFor="difficulty" className="font-medium text-gray-700 dark:text-gray-300">{t("settingsDifficulty")}</label>
            <select id="difficulty" value={localSettings.difficulty} onChange={e => handleLocalSettingChange('difficulty', e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-teal-500">
                <option value="Mixed">{t("settingsMixed")}</option>
                <option value="Easy">{t("settingsEasy")}</option>
                <option value="Medium">{t("settingsMediumDifficulty")}</option>
                <option value="Hard">{t("settingsHard")}</option>
            </select>
        </div>

        <div className="space-y-4">
            <h4 className="font-tajawal font-bold text-pink-600 dark:text-pink-500 text-base">{t("languageSettings")}</h4>
            <div>
                <label htmlFor="quiz-language" className="font-medium text-gray-700 dark:text-gray-300">{t("quizLanguage")}</label>
                <select id="quiz-language" value={localSettings.quizLanguage} onChange={e => handleLocalSettingChange('quizLanguage', e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-teal-500">
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                    <option value="French">French</option>
                    <option value="Spanish">Spanish</option>
                </select>
            </div>
            <div>
                <label htmlFor="explanation-language" className="font-medium text-gray-700 dark:text-gray-300">{t("explanationLanguage")}</label>
                <select id="explanation-language" value={localSettings.explanationLanguage} onChange={e => handleLocalSettingChange('explanationLanguage', e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-teal-500">
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                    <option value="French">French</option>
                    <option value="Spanish">Spanish</option>
                </select>
            </div>
        </div>

         <div>
            <label className="font-medium text-gray-700 dark:text-gray-300">{t("settingsQuestionTypes")}</label>
            <div className="mt-2 grid grid-cols-2 gap-3">
                {allQuestionTypes.map(type => (
                    <label key={type} className="flex items-center gap-2">
                        <input type="checkbox" checked={localSettings.questionTypes.includes(type)} onChange={() => handleQuestionTypeChange(type)}
                            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        {type}
                    </label>
                ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t("settingsQuestionTypesInfo")}</p>
        </div>
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t("settingsModelParams")}</h4>
          <div className="space-y-4">
              <div>
                  <label htmlFor="temperature" className="flex justify-between"><span>{t("settingsTemperature")}</span><span>{localSettings.temperature}</span></label>
                  <input id="temperature" type="range" min="0" max="1" step="0.1" value={localSettings.temperature} onChange={e => handleLocalSettingChange('temperature', parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-teal-600"/>
              </div>
              <div>
                  <label htmlFor="topP" className="flex justify-between"><span>{t("settingsTopP")}</span><span>{localSettings.topP}</span></label>
                  <input id="topP" type="range" min="0" max="1" step="0.05" value={localSettings.topP} onChange={e => handleLocalSettingChange('topP', parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-teal-600"/>
              </div>
              <div>
                  <label htmlFor="topK" className="flex justify-between"><span>{t("settingsTopK")}</span><span>{localSettings.topK}</span></label>
                  <input id="topK" type="range" min="1" max="100" step="1" value={localSettings.topK} onChange={e => handleLocalSettingChange('topK', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-teal-600"/>
              </div>
          </div>
        </div>
    </div>
  );

  return (
    <>
      <div onClick={handleSaveAndClose} aria-hidden="true" className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      
      <div role="dialog" aria-modal="true" aria-labelledby="settings-modal-title" className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? '' : 'pointer-events-none'}`}>
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
              <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                  <h2 id="settings-modal-title" className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t("quizSettings")}</h2>
                  <button onClick={handleSaveAndClose} aria-label="Close settings" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <XIcon className="w-5 h-5" />
                  </button>
              </header>

              <main className="flex-grow overflow-y-auto">
                  <div className="border-b border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2">
                           <button onClick={() => setActiveTab('general')} className={`py-3 text-sm font-semibold ${activeTab === 'general' ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-500' : 'text-gray-500 dark:text-gray-400'}`}>
                              {t("settingsGeneral")}
                          </button>
                          <button onClick={() => setActiveTab('quiz')} className={`py-3 text-sm font-semibold ${activeTab === 'quiz' ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-500' : 'text-gray-500 dark:text-gray-400'}`}>
                              {t("settingsQuiz")}
                          </button>
                      </div>
                  </div>
                  <div className="p-6">
                      {activeTab === 'general' ? <GeneralSettings /> : <QuizSettings />}
                  </div>
              </main>
              
              <footer className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
                   <button onClick={handleSaveAndClose} className="w-full bg-teal-600 text-white font-bold py-2.5 rounded-lg hover:bg-teal-700 transition">
                      {t("settingsDone")}
                  </button>
              </footer>
          </div>
      </div>
    </>
  );
};

export default SettingsPopover;