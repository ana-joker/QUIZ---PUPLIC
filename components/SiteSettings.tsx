import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface SiteSettings {
    freeLaunch: {
        enabled: boolean;
        endDate: string;
    };
    ownerEmails: string[];
}

export const SiteSettings: React.FC = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/api/admin/settings');
                setSettings(response.data.settings);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load site settings.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setLoading(true);
        try {
            await api.post('/api/admin/settings', { settings });
            alert('Settings saved successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsChange = (field: keyof SiteSettings, value: any) => {
        if (settings) {
            setSettings({ ...settings, [field]: value });
        }
    };
    
    const handleFreeLaunchChange = (field: keyof SiteSettings['freeLaunch'], value: any) => {
        if (settings) {
            setSettings({ 
                ...settings, 
                freeLaunch: { ...settings.freeLaunch, [field]: value } 
            });
        }
    };

    if (loading) return <p>Loading settings...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!settings) return <p>No settings data found.</p>;

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Site Settings</h2>
            <div className="space-y-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-purple-400 mb-2">Free Launch Promotion</h3>
                    <div className="flex items-center justify-between">
                        <label htmlFor="freeLaunchEnabled" className="text-gray-300">Enable Free Month</label>
                        <input 
                            type="checkbox" 
                            id="freeLaunchEnabled"
                            checked={settings.freeLaunch.enabled}
                            onChange={e => handleFreeLaunchChange('enabled', e.target.checked)}
                            className="h-6 w-6 rounded text-purple-600 bg-gray-900 border-gray-600 focus:ring-purple-500"
                        />
                    </div>
                    <div className="mt-4">
                        <label htmlFor="freeLaunchEndDate" className="block text-sm text-gray-400 mb-1">End Date</label>
                        <input 
                            type="date" 
                            id="freeLaunchEndDate"
                            value={settings.freeLaunch.endDate.split('T')[0]} // Format for date input
                            onChange={e => handleFreeLaunchChange('endDate', e.target.value)}
                            className="w-full p-2 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-purple-400 mb-2">Owner Emails</h3>
                     <textarea 
                        placeholder="Enter owner emails, separated by commas"
                        value={settings.ownerEmails.join(', ')}
                        onChange={e => handleSettingsChange('ownerEmails', e.target.value.split(',').map(s => s.trim()))}
                        className="w-full p-2 h-24 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <div className="flex justify-end">
                    <button onClick={handleSave} disabled={loading} className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 font-semibold">
                        {loading ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
