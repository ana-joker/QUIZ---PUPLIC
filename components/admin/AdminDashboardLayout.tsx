import React from 'react';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { key: 'metrics', label: 'Metrics' },
  { key: 'users', label: 'Users' },
  { key: 'payments', label: 'Payments' },
  { key: 'subscriptions', label: 'Subscriptions' },
  { key: 'courses', label: 'Courses' },
  { key: 'settings', label: 'Site Settings' },
];

const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="flex min-h-screen bg-slate-900">
      <aside className="w-64 bg-slate-800 p-6 border-r border-slate-700">
        <h2 className="text-2xl font-bold text-purple-400 mb-8">Admin Dashboard</h2>
        <nav className="space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === tab.key ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
};

export default AdminDashboardLayout;
