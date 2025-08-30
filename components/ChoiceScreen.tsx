
import React from 'react';
import { useTranslation } from '../App';
import ChoiceButton from './ChoiceButton';

export enum QuizMode {
  Text = 'text',
  Pdf = 'pdf',
}

interface ChoiceScreenProps {
  onSelectMode: (mode: QuizMode) => void;
}

const ChoiceScreen: React.FC<ChoiceScreenProps> = ({ onSelectMode }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-600/50 rounded-2xl shadow-lg p-8 sm:p-12 text-center w-full max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-tajawal">
          {t('howToCreate')}
        </h1>
        <p className="text-lg text-gray-300 mb-8 font-tajawal">
          {t('chooseMethod')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ChoiceButton
            onClick={() => onSelectMode(QuizMode.Text)}
            className="bg-cyan-700/70 hover:bg-cyan-600/80 border-cyan-500/50"
            shadowClassName="shadow-cyan-900/30"
            title={t('generateFromText')}
          />
          <ChoiceButton
            onClick={() => onSelectMode(QuizMode.Pdf)}
            className="bg-indigo-700/70 hover:bg-indigo-600/80 border-indigo-500/50"
            shadowClassName="shadow-indigo-900/30"
            title={t('generateFromPdf')}
            subtitle="PDF"
          />
        </div>
      </div>
    </div>
  );
};

export default ChoiceScreen;
