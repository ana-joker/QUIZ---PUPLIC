import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../context/AuthContext';
import UsageBadge from '../components/UsageBadge';
import QuotaProgress from '../components/QuotaProgress';
import { api } from '../services/api';

const Dashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [loadingUsage, setLoadingUsage] = useState(true);
    const [usageToday, setUsageToday] = useState<any>(null);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const response = await api.get('/api/usage/today');
                                setUsageToday({
                                    usedGeneral: response.data.today.general,
                                    remainingGeneral: response.data.limits.general - response.data.today.general,
                                    capGeneral: response.data.limits.general,
                                      usedCourse: response.data.today.courses ? Object.values(response.data.today.courses).map(Number).reduce((a, b) => a + b, 0) : 0,
                                      remainingCourse: response.data.limits.course ? response.data.limits.course - (response.data.today.courses ? Object.values(response.data.today.courses).map(Number).reduce((a, b) => a + b, 0) : 0) : undefined,
                                    capCourse: response.data.limits.course
                                });
            } catch (error) {
                console.error("Failed to fetch usage data", error);
            } finally {
                setLoadingUsage(false);
            }
        };
        fetchUsage();
    }, [setUsageToday]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 md:p-8"
        >
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-4xl font-bold text-slate-100">Hi {user?.name || 'User'} 👋</h1>
              <UsageBadge />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Plan Card */}
                <div className="bg-slate-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-purple-400 mb-4">Current Plan</h2>
                    <p className="text-3xl font-bold text-white capitalize">{user?.plan || 'Free'}</p>
                    {/* planExpiresAt not in User type, remove for now */}
                    <Link to="/billing" className="text-purple-400 hover:underline mt-4 inline-block">Manage Subscription</Link>
                </div>
                {/* Quota Card */}
                <div className="bg-slate-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-purple-400 mb-4">Daily Usage</h2>
                    {loadingUsage ? <p>Loading usage...</p> : <QuotaProgress />}
                    <Link to="/my-usage" className="text-purple-400 hover:underline mt-4 inline-block">View Details</Link>
                </div>
                {/* Generate Quiz Card */}
                <div className="bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-semibold mb-4">Generate New Quiz</h2>
                    <Link to="/generate-text" className="w-full">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                        >
                            Start Generating
                        </motion.button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;