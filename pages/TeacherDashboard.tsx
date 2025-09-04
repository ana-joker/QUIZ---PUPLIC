import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { TeacherCourse } from '../types'; // Import TeacherCourse from types.ts
import { useToast } from '../App'; // Import useToast

const CreateCourseModal = ({ onClose, onCourseCreated }: { onClose: () => void; onCourseCreated: () => void; }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { addToast } = useToast();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/api/teacher/courses', { title, description });
            addToast('Course created successfully!', 'success');
            onCourseCreated(); // Refresh the list in the parent component
            onClose(); // Close the modal
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to create course.';
            setError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-purple-400">Create New Course</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <input type="text" placeholder="Course Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-3 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <textarea placeholder="Course Description (Optional)" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 h-32 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y" />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50">{loading ? 'Creating...' : 'Create'}</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const TeacherDashboard: React.FC = () => {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchTeacherCourses = async () => {
    setLoading(true);
    try {
      // Assuming /api/teacher/courses is the endpoint for fetching teacher-owned courses
      const response = await api.get('/api/teacher/courses');
      setCourses(response.data.courses || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch courses.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-4 md:p-8"
    >
      {isModalOpen && <CreateCourseModal onClose={() => setIsModalOpen(false)} onCourseCreated={fetchTeacherCourses} />}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-slate-100">Teacher Dashboard</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
            Create New Course
        </button>
      </div>

      <div className="space-y-8">
        {courses.length > 0 ? courses.map(course => (
            <div key={course.id} className="bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-purple-400">{course.title}</h2>
                    <p className="text-sm text-slate-400 mt-1">{course.description}</p>
                    <p className="text-sm text-slate-400 mt-1">Students: {course.students.length}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm text-slate-400">Join Code</p>
                    <p className="font-mono bg-slate-700 text-purple-300 px-3 py-1 rounded-md">{course.code}</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700 flex gap-4">
                  <button onClick={() => navigate(`/teacher/courses/${course.id}/materials`)} className="px-4 py-2 text-sm rounded-md bg-slate-700 hover:bg-purple-600 transition-colors">Manage Materials</button>
                  <button className="px-4 py-2 text-sm rounded-md bg-slate-700 hover:bg-purple-600 transition-colors">Edit Course</button>
                  <button className="px-4 py-2 text-sm rounded-md text-red-400 hover:bg-red-500 hover:text-white transition-colors">Delete</button>
              </div>
            </div>
        )) : (
            <div className="text-center bg-slate-800 p-10 rounded-lg">
                <p className="text-slate-400">You haven't created any courses yet.</p>
            </div>
        )}
      </div>
    </motion.div>
  );
};

export default TeacherDashboard;