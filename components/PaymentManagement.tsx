import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../App'; // Import useToast

interface Payment {
    id: string;
    userId: string;
    amount: number;
    method: string;
    reference: string;
    receiptUrl: string;
    status: string;
    createdAt: string;
    // I'll assume the user's email is sent along with the payment for display purposes
    user?: { email: string; };
}

export const PaymentManagement: React.FC = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
    const { addToast } = useToast(); // Get addToast from useToast()

    const fetchPendingPayments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/payments/pending');
            setPayments(response.data.payments || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch pending payments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const handleAction = async (paymentId: string, status: 'approved' | 'rejected') => {
        setActionLoading(prev => ({ ...prev, [paymentId]: true }));
        try {
            await api.post(`/api/admin/payments/${paymentId}/confirm`, { status });
            // Refresh list by removing the handled payment
            setPayments(prev => prev.filter(p => p.id !== paymentId));
        } catch (err: any) {
            addToast(`Failed to ${status} payment: ${err.response?.data?.message || err.message}`, 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [paymentId]: false }));
        }
    };

    if (loading) return <p>Loading payments...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Payment Management</h2>
                {payments.length === 0 ? (
                    <p className="text-gray-400">No pending payments.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead>
                                <tr className="bg-gray-900">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Reference</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Receipt</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {payments.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-700">
                                        <td className="px-6 py-4 text-white">{p.user?.email || p.userId}</td>
                                        <td className="px-6 py-4 text-gray-300">{new Date(p.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-gray-300 font-mono">{p.reference}</td>
                                        <td className="px-6 py-4"><a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Receipt</a></td>
                                        <td className="px-6 py-4 space-x-2">
                                            <button onClick={() => handleAction(p.id, 'approved')} disabled={actionLoading[p.id]} className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-500 disabled:opacity-50">Approve</button>
                                            <button onClick={() => handleAction(p.id, 'rejected')} disabled={actionLoading[p.id]} className="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-500 disabled:opacity-50">Reject</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}