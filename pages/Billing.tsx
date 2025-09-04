import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useAuthStore } from '../context/AuthContext';

const BillingPage: React.FC = () => {
    const { user } = useAuthStore();
    const [file, setFile] = useState<File | null>(null);
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0]) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } });

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !reference) {
            setError('Please provide a payment reference and upload a receipt.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('receipt', file);
        formData.append('reference', reference);
        formData.append('amount', '100'); // Assuming a fixed amount for now
        formData.append('method', 'manual_upload');

        try {
            await api.post('/api/payments/new', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSuccess('Your payment has been submitted for review. Your plan will be updated upon approval.');
            setFile(null);
            setReference('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto p-8">
            <h1 className="text-4xl font-bold text-slate-100 mb-8">Billing & Subscriptions</h1>

            {/* Current Plan Section */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">Your Current Plan</h2>
                <p className="text-slate-300">You are currently on the <span className="font-bold capitalize text-purple-300">{user?.plan || 'Free'}</span> plan.</p>
                {user?.planExpiresAt && <p className="text-slate-400 text-sm mt-2">Your plan is valid until: {new Date(user.planExpiresAt).toLocaleDateString()}</p>}
            </div>

            {/* Upgrade Section */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">Upgrade to Premium</h2>
                <p className="text-slate-400 mb-6">To upgrade, please complete the payment and upload your receipt below. Your request will be reviewed by an administrator.</p>
                <form onSubmit={handleSubmitPayment} className="space-y-6">
                    <input 
                        type="text" 
                        placeholder="Payment Reference ID (e.g., Transaction No.)"
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                        className="w-full p-3 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div {...getRootProps()} className="p-6 border-2 border-dashed border-slate-600 rounded-lg text-center cursor-pointer hover:border-purple-500">
                        <input {...getInputProps()} />
                        {file ? <p>Selected: {file.name}</p> : <p>Drag 'n' drop your payment receipt here, or click to select</p>}
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50 font-semibold">
                        {loading ? 'Submitting...' : 'Submit for Review'}
                    </button>
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {success && <p className="text-green-500 text-center">{success}</p>}
                </form>
            </div>
        </motion.div>
    );
};

export default BillingPage;
