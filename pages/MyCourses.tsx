import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// Define types based on the plan
interface Course {
    id: string;
    title: string;
    description?: string;
    ownerId: string; // Assuming owner is the teacher
}

interface EnrolledCourse {
    course: Course;
    materials: any[]; // Define material type later
}

const CourseCard = ({ course }: { course: Course }) => {
    const navigate = useNavigate();
    return (
        <motion.div 
            className="bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col justify-between"
            whileHover={{ y: -5, boxShadow: '0px 10px 20px rgba(0,0,0,0.25)' }}
        >
            <div>
                <h3 className="text-xl font-bold text-purple-400 mb-2">{course.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{course.description || 'No description available.'}</p>
            </div>
            <button 
                onClick={() => navigate(`/courses/${course.id}`)}
                className="mt-4 w-full py-2 px-4 rounded-md bg-slate-700 text-white font-semibold hover:bg-purple-600 transition-colors"
            >
                View Materials
            </button>
        </motion.div>
    );
}

const MyCourses: React.FC = () => {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const response = await api.get('/api/courses/my');
        if (response.data && response.data.courses) {
            setEnrolledCourses(response.data.courses);
        } else {
            throw new Error('Invalid data format from server');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load your courses.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto p-4 md:p-8"
    >
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-slate-100">My Courses</h1>
            <Link to="/join-course" className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
                Join a New Course
            </Link>
        </div>

      {loading && <p className="text-center">Loading courses...</p>}
      {error && <p className="text-center text-red-500">Error: {error}</p>}
      
      {!loading && !error && (
          enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {enrolledCourses.map(enrollment => (
                    <CourseCard key={enrollment.course.id} course={enrollment.course} />
                ))}
            </div>
          ) : (
            <div className="text-center bg-slate-800 p-10 rounded-lg">
                <p className="text-slate-400">You haven't joined any courses yet.</p>
            </div>
          )
      )}
    </motion.div>
  );
};

export default MyCourses;
