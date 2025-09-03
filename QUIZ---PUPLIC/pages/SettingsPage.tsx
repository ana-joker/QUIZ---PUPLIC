import React, { useState, useEffect, useCallback } from 'react';
import { useSettings, useTranslation } from '../App';
import { AppSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const SettingsPage: React.FC = () => {
  const { settings, setSettings } = useSettings();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'quiz' | 'general' | 'account'>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  const handleSave = useCallback(() => {
    setSettings(localSettings);
    navigate('/'); // Go back to home after saving
  }, [localSettings, setSettings, navigate]);

  const handleLocalSettingChange = <T extends keyof AppSettings>(field: T, value: AppSettings[T]) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionTypeChange = (type: string) => {
    const newTypes = localSettings.questionTypes.includes(type)
        ? localSettings.questionTypes.filter(t => t !== type)
        : [...localSettings.questionTypes, type];
    handleLocalSettingChange('questionTypes', newTypes);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allQuestionTypes = ['MCQ', 'TrueFalse', 'ShortAnswer', 'Ordering', 'Matching'];

  const GeneralSettings = () => (
    <div className="space-y-6 text-sm">
      <div>
        <label className="font-medium text-slate-50">{t("settingsTheme")}</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => handleLocalSettingChange('theme', 'light')} className={`py-2 rounded-md ${localSettings.theme === 'light' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{t("settingsLightTheme")}</button>
            <button onClick={() => handleLocalSettingChange('theme', 'dark')} className={`py-2 rounded-md ${localSettings.theme === 'dark' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{t("settingsDarkTheme")}</button>
        </div>
      </div>
      <div>
        <label className="font-medium text-slate-50">{t("settingsLanguage")}</label>
        <select value={localSettings.uiLanguage} onChange={e => handleLocalSettingChange('uiLanguage', e.target.value)}
          className="w-full mt-2 px-3 py-2 border border-slate-600 bg-slate-800 text-slate-50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="en">English</option>
            <option value="ar">العربية</option>
        </select>
      </div>
       <div>
        <label className="font-medium text-slate-50">{t("settingsFontSize")}</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
            <button onClick={() => handleLocalSettingChange('fontSize', 'small')} className={`py-2 rounded-md ${localSettings.fontSize === 'small' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{t("settingsSmall")}</button>
            <button onClick={() => handleLocalSettingChange('fontSize', 'medium')} className={`py-2 rounded-md ${localSettings.fontSize === 'medium' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{t("settingsMedium")}</button>
            <button onClick={() => handleLocalSettingChange('fontSize', 'large')} className={`py-2 rounded-md ${localSettings.fontSize === 'large' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{t("settingsLarge")}</button>
        </div>
      </div>
      {!user && (
        <div className="pt-6 border-t border-slate-600 space-y-2">
            <Link to="/login" className="block w-full text-center py-2 px-4 rounded-md text-white bg-teal-500 hover:bg-teal-600">Login</Link>
            <Link to="/register" className="block w-full text-center py-2 px-4 rounded-md text-teal-500 border border-teal-500 hover:bg-teal-500 hover:text-white">Register</Link>
        </div>
      )}
    </div>
  );

  const QuizSettings = () => (
    <div className="space-y-6 text-sm">
        <div>
            <label htmlFor="difficulty" className="font-medium text-slate-50">{t("settingsDifficulty")}</label>
            <select id="difficulty" value={localSettings.difficulty} onChange={e => handleLocalSettingChange('difficulty', e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-slate-600 bg-slate-800 text-slate-50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="Mixed">{t("settingsMixed")}</option>
                <option value="Easy">{t("settingsEasy")}</option>
                <option value="Medium">{t("settingsMediumDifficulty")}</option>
                <option value="Hard">{t("settingsHard")}</option>
            </select>
        </div>

        <div className="space-y-4">
            <h4 className="font-bold text-purple-400 text-base">{t("languageSettings")}</h4>
            <div>
                <label htmlFor="quiz-language" className="font-medium text-slate-50">{t("quizLanguage")}</label>
                <select id="quiz-language" value={localSettings.quizLanguage} onChange={e => handleLocalSettingChange('quizLanguage', e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-slate-600 bg-slate-800 text-slate-50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                    <option value="French">French</option>
                    <option value="Spanish">Spanish</option>
                </select>
            </div>
            <div>
                <label htmlFor="explanation-language" className="font-medium text-slate-50">{t("explanationLanguage")}</label>
                <select id="explanation-language" value={localSettings.explanationLanguage} onChange={e => handleLocalSettingChange('explanationLanguage', e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-slate-600 bg-slate-800 text-slate-50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                    <option value="French">French</option>
                    <option value="Spanish">Spanish</option>
                </select>
            </div>
        </div>

         <div>
            <label className="font-medium text-slate-50">{t("settingsQuestionTypes")}</label>
            <div className="mt-2 grid grid-cols-2 gap-3">
                {allQuestionTypes.map(type => (
                    <label key={type} className="flex items-center gap-2 text-slate-300">
                        <input type="checkbox" checked={localSettings.questionTypes.includes(type)} onChange={() => handleQuestionTypeChange(type)}
                            className="h-4 w-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500"
                        />
                        {type}
                    </label>
                ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">{t("settingsQuestionTypesInfo")}</p>
        </div>
        <div className="pt-6 border-t border-slate-600">
          <h4 className="font-medium text-slate-50 mb-2">{t("settingsModelParams")}</h4>
          <div className="space-y-4">
              <div>
                  <label htmlFor="temperature" className="flex justify-between text-slate-300"><span>{t("settingsTemperature")}</span><span>{localSettings.temperature}</span></label>
                  <input id="temperature" type="range" min="0" max="1" step="0.1" value={localSettings.temperature} onChange={e => handleLocalSettingChange('temperature', parseFloat(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"/>
              </div>
              <div>
                  <label htmlFor="topP" className="flex justify-between text-slate-300"><span>{t("settingsTopP")}</span><span>{localSettings.topP}</span></label>
                  <input id="topP" type="range" min="0" max="1" step="0.05" value={localSettings.topP} onChange={e => handleLocalSettingChange('topP', parseFloat(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"/>
              </div>
              <div>
                  <label htmlFor="topK" className="flex justify-between text-slate-300"><span>{t("settingsTopK")}</span><span>{localSettings.topK}</span></label>
                  <input id="topK" type="range" min="1" max="100" step="1" value={localSettings.topK} onChange={e => handleLocalSettingChange('topK', parseInt(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"/>
              </div>
              
          </div>
        </div>
    </div>
  );

  const AccountSettings = () => (
    <div className="space-y-4 text-sm">
        <div className="p-4 bg-slate-800 rounded-lg shadow-md"> {/* Updated background and shadow */}
            <p className="font-semibold text-slate-50">Hi, {user?.name || 'User'}</p> {/* Use optional chaining for user?.name */}
            <p className="text-slate-300">{user?.email || 'N/A'}</p> {/* Display email */}
        </div>
        <div className="space-y-2">
            <h3 className="font-semibold text-slate-50 mt-4">Account Details</h3>
            <div className="flex justify-between items-center p-3 bg-slate-800 rounded-md">
                <span className="text-slate-300">Account Type:</span>
                <span className="font-medium text-teal-400">Free</span> {/* Placeholder for account type */}
            </div>
            {/* Upgrade Plan Button - only if Free */}
            {true && ( // Placeholder condition for 'if Free'
                <button className="w-full py-2 px-4 rounded-md bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold hover:shadow-lg transition-all duration-300">
                    Upgrade Plan
                </button>
            )}
            <Link to="/manage-devices" className="block py-2 px-4 rounded-md hover:bg-slate-800 transition-colors duration-200 text-slate-50">Manage Devices</Link>
            <Link to="/my-usage" className="block py-2 px-4 rounded-md hover:bg-slate-800 transition-colors duration-200 text-slate-50">My Quota</Link>
        </div>
        <div className="pt-4 border-t border-slate-600"> {/* Updated border color */}
            <button onClick={handleLogout} className="w-full py-2 px-4 rounded-md text-white bg-red-600 hover:bg-red-700">Logout</button>
        </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-50 p-4"
    >
      <div className="bg-slate-700 rounded-2xl shadow-xl w-full max-w-md mx-auto flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-600 shrink-0">
            <h2 id="settings-modal-title" className="text-xl font-semibold text-slate-50">{t("quizSettings")}</h2>
        </header>

        <main className="flex-grow overflow-y-auto">
            <div className="border-b border-slate-600">
                <div className={`grid ${user ? 'grid-cols-3' : 'grid-cols-2'}`}>
                     <button onClick={() => setActiveTab('general')} className={`py-3 text-sm font-semibold ${activeTab === 'general' ? 'text-teal-400 border-b-2 border-teal-500' : 'text-slate-400'}`}>
                        {t("settingsGeneral")}
                    </button>
                    <button onClick={() => setActiveTab('quiz')} className={`py-3 text-sm font-semibold ${activeTab === 'quiz' ? 'text-teal-400 border-b-2 border-teal-500' : 'text-slate-400'}`}>
                        {t("settingsQuiz")}
                    </button>
                    {user && (
                      <button onClick={() => setActiveTab('account')} className={`py-3 text-sm font-semibold ${activeTab === 'account' ? 'text-teal-400 border-b-2 border-teal-500' : 'text-slate-400'}`}>
                          Account
                      </button>
                    )}
                </div>
            </div>
            <div className="p-6">
                {activeTab === 'general' && <GeneralSettings />}
                {activeTab === 'quiz' && <QuizSettings />}
                {activeTab === 'account' && user && <AccountSettings />}
            </div>
        </main>
        
        <footer className="p-4 border-t border-slate-600 shrink-0">
             <button onClick={handleSave} className="w-full bg-teal-500 text-white font-bold py-2.5 rounded-lg hover:bg-teal-600 transition">
                {t("settingsDone")}
            </button>
        </footer>
      </div>
    </motion.div>
  );
};

export default SettingsPage;