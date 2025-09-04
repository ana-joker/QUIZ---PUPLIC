import React from 'react';
import { useAuthStore } from '../context/AuthStore';

const QuotaProgress: React.FC = () => {
  const { usageToday, user } = useAuthStore();
  if (!usageToday) return null;
  if (user?.type === 'owner') return null;
  const percent = Math.min(100, Math.round((usageToday.usedGeneral / usageToday.capGeneral) * 100));
  return (
    <div className="w-full my-2">
      <div className="flex justify-between text-xs mb-1">
        <span>استهلاك اليوم</span>
        <span>{usageToday.usedGeneral} / {usageToday.capGeneral}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: percent + '%' }}></div>
      </div>
    </div>
  );
};
export default QuotaProgress;
