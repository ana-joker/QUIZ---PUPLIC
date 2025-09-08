import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../context/AuthContext';
import { useToast } from '../App';
import { Loader2Icon, XIcon } from '../components/ui/Icons';
import { api } from '../services/api';

const ManageDevices: React.FC = () => {
	const { user, token, deviceId } = useAuthStore();
	const { addToast } = useToast();
	const [devices, setDevices] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [removing, setRemoving] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!token) return;
		setLoading(true);
		api.get('/api/auth/devices', { headers: { Authorization: `Bearer ${token}` } })
			.then(res => setDevices(res.data.devices || []))
			.catch(() => setError('فشل تحميل الأجهزة.'))
			.finally(() => setLoading(false));
	}, [token]);

	const handleRemove = (id: string) => {
		setRemoving(id);
		api.delete(`/api/auth/devices/${id}`, { headers: { Authorization: `Bearer ${token}` } })
			.then(() => {
				setDevices(devices.filter(d => d.deviceId !== id));
				addToast('تم تسجيل الخروج من الجهاز بنجاح', 'success');
			})
			.catch(() => addToast('فشل تسجيل الخروج من الجهاز', 'error'))
			.finally(() => setRemoving(null));
	};

	if (!user) return <div className="p-8 text-center">يجب تسجيل الدخول لعرض الأجهزة.</div>;

	return (
		<div className="max-w-xl mx-auto py-10">
			<h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">إدارة الأجهزة</h2>
			{loading ? (
				<div className="flex justify-center items-center py-10"><Loader2Icon className="w-8 h-8 animate-spin text-cyan-400" /></div>
			) : error ? (
				<div className="bg-red-900/40 text-red-200 p-4 rounded-lg text-center">{error}</div>
			) : (
				<div className="space-y-4">
					{devices.length === 0 && <div className="text-gray-400 text-center">لا توجد أجهزة مسجلة.</div>}
					{devices.map((d) => (
						<div key={d.deviceId} className={`flex items-center justify-between bg-slate-900/60 p-4 rounded-lg border border-slate-700 ${d.deviceId === deviceId ? 'border-cyan-400' : ''}`}>
							<div className="flex items-center gap-3">
								<span className="w-6 h-6 inline-block bg-cyan-300 rounded-full mr-2" />
								<div>
									<div className="font-bold text-cyan-200">{d.deviceName || 'جهاز غير معروف'}</div>
									<div className="text-xs text-gray-400">آخر استخدام: {d.lastSeen ? new Date(d.lastSeen).toLocaleString('ar-EG') : 'غير متوفر'}</div>
									{d.deviceId === deviceId && <span className="text-xs text-green-400 font-bold">(هذا الجهاز)</span>}
								</div>
							</div>
							{d.deviceId !== deviceId && (
								<button onClick={() => handleRemove(d.deviceId)} disabled={removing === d.deviceId} className="p-2 text-red-400 hover:text-white">
									{removing === d.deviceId ? <Loader2Icon className="w-5 h-5 animate-spin" /> : <XIcon className="w-5 h-5" />}
								</button>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default ManageDevices;