
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { coursesApi } from '../services/api';
import { useTranslation } from '../App';

// Assuming these types exist and will be expanded as needed
interface Material {
  _id: string;
  filename: string;
  course: string; // Course ID
}

interface Course {
  _id: string;
  name: string;
  materials: Material[];
}

const StudentDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStudentCourses = async () => {
      try {
        const response = await coursesApi.getMyCourses();
        setCourses(response.data);
      } catch (err: any) {
  const errorMessage = err.response?.data?.message || err.message || t('errorLoadingHistory');
        setError(errorMessage);
        console.error('Error fetching student courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentCourses();
  }, [t]);

  const handleGenerateQuiz = (materialId: string) => {
    // Navigate to a dedicated page for generating quiz from a specific material
    // This page will handle the API call to /api/quiz/material/:materialId
    navigate(`/generate/material/${materialId}`);
  };

  if (loading) {
  return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-50"><p>{t('loadingHistory')}</p></div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-500"><p>{error}</p></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-900 text-slate-50 p-8"
    >
      <h1 className="text-4xl font-bold mb-8 text-purple-500">{t('myCourses')}</h1>
      {courses.length === 0 ? (
        <p className="text-slate-400">{t('noHistory')}</p>
      ) : (
        <div className="space-y-8">
          {courses.map(course => (
            <div key={course._id} className="bg-slate-800 rounded-2xl shadow-soft p-6">
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">{course.name}</h2>
              {course.materials.length > 0 ? (
                <ul className="space-y-3">
                  {course.materials.map(material => (
                    <li key={material._id} className="flex items-center justify-between bg-slate-700 p-4 rounded-lg">
                      <span className="text-slate-200">{material.filename}</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleGenerateQuiz(material._id)}
                        className="py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        {t('generateQuiz')}
                      </motion.button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">{t('noValidQuestions')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default StudentDashboard;
