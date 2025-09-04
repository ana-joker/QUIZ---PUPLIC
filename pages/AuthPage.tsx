import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Login } from '../components/LoginForm'; // Will create this next
import { Register } from '../components/RegisterForm'; // Will create this next
import { LoginWithCode } from '../components/LoginWithCode';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/AuthContext'; // Import useAuthStore
import { useToast } from '../App'; // Import useToast

type AuthTab = 'login' | 'register' | 'code';

const AuthPage = () => {
    const [activeTab, setActiveTab] = useState<AuthTab>('login');
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, acceptInvite } = useAuthStore(); // Get isAuthenticated and acceptInvite
    const { addToast } = useToast(); // Get addToast

    // منطق التقاط invite token من URL وتخزينه مؤقتًا
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const invite = params.get('invite');
        if (invite) {
            localStorage.setItem('qt_inviteToken', invite);
            // إزالة invite من URL بعد الالتقاط
            params.delete('invite');
            navigate({ search: params.toString() }, { replace: true });
        }
    }, [location, navigate]);

    // Handle invite token after successful authentication
    useEffect(() => {
        if (isAuthenticated) {
            const inviteToken = localStorage.getItem('qt_inviteToken');
            if (inviteToken) {
                acceptInvite(inviteToken).then(success => {
                    if (success) {
                        addToast('Invite accepted successfully!', 'success');
                    } else {
                        addToast('Failed to accept invite.', 'error');
                    }
                    localStorage.removeItem('qt_inviteToken'); // Always remove after attempt
                });
            }
        }
    }, [isAuthenticated, acceptInvite, addToast]); // Depend on isAuthenticated, acceptInvite, and addToast

    const renderContent = () => {
        switch (activeTab) {
            case 'register':
                return <Register />;
            case 'code':
                return <LoginWithCode />;
            case 'login':
            default:
                return <Login />;
        }
    };

    const getTabClass = (tab: AuthTab) => {
        return `px-4 py-2 font-semibold rounded-t-lg transition-colors duration-300 focus:outline-none ` + 
               (activeTab === tab 
                ? 'bg-slate-700 text-purple-400' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-50 p-4"
        >
            <div className="w-full max-w-md">
                <div className="flex">
                    <button onClick={() => setActiveTab('login')} className={getTabClass('login')}>
                        Login
                    </button>
                    <button onClick={() => setActiveTab('register')} className={getTabClass('register')}>
                        Sign Up
                    </button>
                    <button onClick={() => setActiveTab('code')} className={getTabClass('code')}>
                        Course Code
                    </button>
                </div>
                <div className="bg-slate-700 p-8 rounded-b-2xl rounded-tr-2xl shadow-xl">
                    {renderContent()}
                </div>
            </div>
        </motion.div>
    );
};

export default AuthPage;
