import React from 'react';
import { useAuthStore } from '../context/AuthContext';

const UsageBadge: React.FC = () => {
  const { user, usageToday } = useAuthStore();
  if (!usageToday) return null;
  if (user?.role === 'owner') return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-600 text-white text-xs font-bold">∞</span>
  );
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
      {usageToday.remainingGeneral} / {usageToday.capGeneral}
    </span>
  );
};
export default UsageBadge;
