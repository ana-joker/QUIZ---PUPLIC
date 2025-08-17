import React from 'react';
import { useTranslation } from '../App';

interface ChoiceScreenProps {
  onSelectMode: (mode: 'text' | 'pdf') => void;
}

const ChoiceScreen: React.FC<ChoiceScreenProps> = ({ onSelectMode }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-600/50 rounded-2xl shadow-lg p-8 sm:p-12 text-center w-full max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-tajawal">
          {t('howToCreate')}
        </h1>
        <p className="text-lg text-gray-300 mb-8 font-tajawal">
          {t('chooseMethod')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => onSelectMode('text')}
            className="bg-cyan-700/70 hover:bg-cyan-600/80 text-white font-bold py-8 px-6 rounded-xl transition-all duration-300 border border-cyan-500/50 shadow-lg shadow-cyan-900/30 transform hover:-translate-y-2"
          >
            <span className="text-2xl font-tajawal">{t('generateFromText')}</span>
          </button>
          <button
            onClick={() => onSelectMode('pdf')}
            className="bg-indigo-700/70 hover:bg-indigo-600/80 text-white font-bold py-8 px-6 rounded-xl transition-all duration-300 border border-indigo-500/50 shadow-lg shadow-indigo-900/30 transform hover:-translate-y-2"
          >
            <span className="text-2xl font-tajawal">{t('generateFromPdf')}</span>
            <span className="block text-sm font-normal mt-1">PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChoiceScreen;
