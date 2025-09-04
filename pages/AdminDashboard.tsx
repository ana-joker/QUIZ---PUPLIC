import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AdminDashboardLayout from '../components/admin/AdminDashboardLayout';
import { api } from '../services/api';
import { PaymentManagement } from '../components/PaymentManagement';
import { CourseManagement } from '../components/CourseManagement';
import { SiteSettings } from '../components/SiteSettings';
import { useToast } from '../App';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'owner'; // Updated roles
  plan: 'guest' | 'free' | 'paid'; // Updated plans
  currentQuota: number;
  maxQuota: number;
  quotaResetDate?: string;
  isTrialActive?: boolean;
  trialEndDate?: string;
  deviceCount: number;
  lastActive: string;
}

interface Statistics {
  totalUsers: number;
  totalExams: number;
  activeUsers: number;
  freeUsers: number;
  paidUsers: number;
  teacherUsers: number;
  totalQuestions: number;
  averageQuestionsPerUser: number;
  dailyActiveUsers: number;
}

interface PlanUpdate {
  userId: string;
  plan: 'guest' | 'free' | 'paid'; // Updated plan type
  customQuota?: number;
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, role: User['role'], plan: User['plan']) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const [selectedRole, setSelectedRole] = useState<User['role']>(user.role);
  const [selectedPlan, setSelectedPlan] = useState<User['plan']>(user.plan);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(user.id, selectedRole, selectedPlan);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-purple-400">Edit User: {user.email}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as User['role'])}
              className="w-full p-3 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Plan</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as User['plan'])}
              className="w-full p-3 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="guest">Guest</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState('metrics'); // البداية بقسم الإحصائيات
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        api.get<{ users: User[] }>('/api/admin/users'),
        api.get<Statistics>('/api/admin/statistics')
      ]);
      setUsers(usersResponse.data.users);
      setStatistics(statsResponse.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch admin data.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUserChanges = async (userId: string, role: User['role'], plan: User['plan']) => {
    try {
      await api.put(`/api/admin/users/${userId}`, { role, plan });
      addToast('User updated successfully!', 'success');
      fetchData(); // Refresh data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update user.';
      addToast(errorMessage, 'error');
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.delete(`/api/admin/users/${userId}`);
        addToast('User deleted successfully!', 'success');
        fetchData();
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to delete user.';
        addToast(errorMessage, 'error');
        console.error(err);
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <AdminDashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (error) {
    return (
      <AdminDashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="bg-red-500 text-white p-4 rounded-lg shadow">
          {error}
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {/* Metrics Section */}
      {activeTab === 'metrics' && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={containerVariants}
          className="space-y-8"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <button
              onClick={fetchData}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors duration-200"
            >
              Refresh Data
            </button>
          </div>
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-blue-100">Total Users</h3>
              <p className="text-4xl font-bold text-white">{statistics?.totalUsers}</p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-green-100">Total Exams</h3>
              <p className="text-4xl font-bold text-white">{statistics?.totalExams}</p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-purple-100">Active Today</h3>
              <p className="text-4xl font-bold text-white">{statistics?.dailyActiveUsers}</p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-yellow-100">Questions Generated</h3>
              <p className="text-4xl font-bold text-white">{statistics?.totalQuestions}</p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      {/* Users Section */}
      {activeTab === 'users' && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={containerVariants}
          className="space-y-8"
        >
          <h1 className="text-3xl font-bold text-white mb-6">User Management</h1>
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full p-3 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-lg">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Plan</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Quota</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Devices</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Last Active</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">{user.plan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.currentQuota}/{user.maxQuota}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.deviceCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{new Date(user.lastActive).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); }}
                        className="text-indigo-400 hover:text-indigo-600 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-300">Page {currentPage} of {pageCount}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {isEditModalOpen && selectedUser && (
            <EditUserModal
              user={selectedUser}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleSaveUserChanges}
            />
          )}
        </motion.div>
      )}
      {/* Payments Section */}
      {activeTab === 'payments' && (
        <PaymentManagement />
      )}
      {/* Courses Section */}
      {activeTab === 'courses' && (
        <CourseManagement />
      )}
      {/* Site Settings Section */}
      {activeTab === 'settings' && (
        <SiteSettings />
      )}
    </AdminDashboardLayout>
  );
}

export default AdminDashboard;
