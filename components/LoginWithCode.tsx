import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/AuthContext';
import { api } from '../services/api';
import { getDeviceName } from '../utils/deviceUtils';

export const LoginWithCode = () => {
    const { login, deviceId } = useAuthStore();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', code: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/api/auth/code-login', {
                name: form.name || undefined, // Send undefined if empty
                email: form.email || undefined,
                code: form.code,
                deviceId: deviceId,
                deviceName: getDeviceName(),
            });

            if (res.data.token && res.data.user) {
                login(res.data.user, res.data.token);
                // --- AZIZ: قبول الدعوة إذا وُجدت ---
                const inviteToken = localStorage.getItem('qt_inviteToken');
                if (inviteToken) {
                  try {
                    await api.post('/api/admin/invites/accept', { token: inviteToken }, {
                      headers: { Authorization: `Bearer ${res.data.token}` }
                    });
                    localStorage.removeItem('qt_inviteToken');
                  } catch (err) {
                    // تجاهل الخطأ، الدعوة قد تكون غير صالحة
                  }
                }
                // As per plan, redirect to the course page
                navigate(`/courses/${res.data.courseId}`); 
            } else {
                throw new Error(res.data.message || 'No token received after code login.');
            }
        } catch (err: any) {
            console.error("Code Login Failed:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to join with code. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleJoin} className="space-y-4">
            <input
                type="text"
                placeholder="Name (Optional)"
                className="w-full p-3 rounded-md bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
                type="email"
                placeholder="Email (Optional)"
                className="w-full p-3 rounded-md bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
                type="text"
                placeholder="Course Code"
                className="w-full p-3 rounded-md bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
            />
            <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
            >
                {loading ? 'Joining...' : 'Join Now'}
            </button>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </form>
    );
};
