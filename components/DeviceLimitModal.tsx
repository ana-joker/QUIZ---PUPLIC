import React from 'react';

interface DeviceLimitModalProps {
  open: boolean;
  onManageDevices: () => void;
  onClose: () => void;
}

const DeviceLimitModal: React.FC<DeviceLimitModalProps> = ({ open, onManageDevices, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold mb-2 text-red-600">تم تجاوز حد الأجهزة</h2>
        <p className="mb-4">لقد وصلت إلى الحد الأقصى للأجهزة المسموح بها. يمكنك إدارة أجهزتك الحالية أو تسجيل الخروج من جهاز آخر.</p>
        <div className="flex gap-2 justify-end">
          <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={onManageDevices}>إدارة الأجهزة</button>
          <button className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-1 rounded" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
};
export default DeviceLimitModal;
