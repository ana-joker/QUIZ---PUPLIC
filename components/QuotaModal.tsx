import React from 'react';

interface QuotaModalProps {
  open: boolean;
  details?: { remaining: number; cap: number };
  onUpgrade?: () => void;
  onClose: () => void;
}

const QuotaModal: React.FC<QuotaModalProps> = ({ open, details, onUpgrade, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold mb-2 text-red-600">وصلت الحد اليومي</h2>
        <p className="mb-4">لقد استهلكت كل حصتك اليوم ({details?.remaining ?? 0} / {details?.cap ?? 0}). للمتابعة، يمكنك ترقية الحساب أو الانتظار حتى غد.</p>
        <div className="flex gap-2 justify-end">
          {onUpgrade && <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={onUpgrade}>ترقية الآن</button>}
          <button className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-1 rounded" onClick={onClose}>حسناً</button>
        </div>
      </div>
    </div>
  );
};
export default QuotaModal;
