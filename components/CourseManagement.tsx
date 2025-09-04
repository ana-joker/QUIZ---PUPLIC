import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../App'; // Import useToast

interface Course {
    id: string;
    title: string;
    ownerId: string;
    // Assuming user object is populated for display
    owner?: { name: string; email: string; };
    _count?: { students: number; materials: number; };
}

export const CourseManagement: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { addToast } = useToast(); // Get addToast from useToast()

    const fetchAllCourses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/courses');
            setCourses(response.data.courses || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch courses.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllCourses();
    }, []);

    const handleDelete = async (courseId: string) => {
        if (window.confirm('Are you sure you want to delete this entire course? This is irreversible.')) {
            try {
                await api.delete(`/api/admin/courses/${courseId}`);
                setCourses(prev => prev.filter(c => c.id !== courseId));
            } catch (err: any) {
                addToast(`Failed to delete course: ${err.response?.data?.message || err.message}`, 'error');
            }
        }
    };

    if (loading) return <p>Loading courses...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Course Management</h2>
                {courses.length === 0 ? (
                    <p className="text-gray-400">No courses found in the system.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead>
                                <tr className="bg-gray-900">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Teacher</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Students</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Materials</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {courses.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-700">
                                        <td className="px-6 py-4 text-white font-medium">{c.title}</td>
                                        <td className="px-6 py-4 text-gray-300">{c.owner?.email || c.ownerId}</td>
                                        <td className="px-6 py-4 text-gray-300">{c._count?.students || 0}</td>
                                        <td className="px-6 py-4 text-gray-300">{c._count?.materials || 0}</td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleDelete(c.id)} className="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-500">Delete</button>
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