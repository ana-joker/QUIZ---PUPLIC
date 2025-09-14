
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../context/AuthContext';
import { useToast } from '../App';
import { Loader2Icon } from '../components/ui/Icons';
import { userApi } from '../services/api';
import UsageBadge from '../components/UsageBadge';
import QuotaProgress from '../components/QuotaProgress';
import { Link } from 'react-router-dom';

const MyUsage: React.FC = () => {
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    userApi.getUsage()
      .then(res => setUsage(res.data))
      .catch(() => {
        setError('فشل تحميل سجل الاستخدام.');
        addToast('فشل تحميل سجل الاستخدام', 'error');
      })
      .finally(() => setLoading(false));
  }, [token, addToast]);

  if (!user) return <div className="p-8 text-center">يجب تسجيل الدخول لعرض سجل الاستخدام.</div>;

  return (
    <div className="max-w-xl mx-auto py-10">
      <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">سجل الاستخدام</h2>
      {loading ? (
        <div className="flex justify-center items-center py-10"><Loader2Icon className="w-8 h-8 animate-spin text-cyan-400" /></div>
      ) : error ? (
        <div className="bg-red-900/40 text-red-200 p-4 rounded-lg text-center">{error}</div>
      ) : usage ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-lg border border-slate-700">
            <div className="font-bold text-cyan-200">الخطة: <span className="text-cyan-400">{usage.plan}</span></div>
            <div className="font-bold text-cyan-200">المتبقي اليوم: <span className="text-green-400">{usage.today.general} / {usage.limits.general}</span></div>
          </div>
          <div className="py-4 flex justify-center">
            <UsageBadge />
          </div>
          <div className="py-4 flex justify-center">
            <QuotaProgress />
          </div>
          {/* استهلاك الكورسات */}
          {usage.today.courses && Object.keys(usage.today.courses).length > 0 && (
            <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700">
              <div className="font-bold text-cyan-200 mb-2">استهلاك الكورسات اليومي:</div>
              <ul className="text-gray-300 space-y-1">
                {Object.entries(usage.today.courses).map(([courseId, courseUsage]: [string, any]) => (
                  <li key={courseId} className="flex justify-between">
                    <span>كورس: {courseId}</span>
                    <span>{courseUsage} / {usage.limits.course} سؤال</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* سجل آخر 7 أيام */}
          <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700">
            <div className="font-bold text-cyan-200 mb-2">الاستهلاك آخر 7 أيام:</div>
            <ul className="text-gray-300 space-y-1">
              {usage.history && usage.history.length > 0 ? usage.history.map((h: any, i: number) => (
                <li key={i} className="flex justify-between">
                  <span>{h.date}</span>
                  <span>{h.questions} سؤال</span>
                </li>
              )) : <li>لا يوجد بيانات.</li>}
            </ul>
          </div>
          {/* زر الترقية للخطة المدفوعة */}
          {(usage.plan === 'free' || usage.plan === 'guest') && (
            <div className="pt-6 border-t border-slate-600">
              <Link
                to="/upgrade"
                className="block w-full text-center py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                الترقية إلى بريميوم
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default MyUsage;
