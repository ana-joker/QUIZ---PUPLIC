import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// Define types based on the plan
interface Material {
    id: string;
    title: string;
    year?: string;
    section?: string;
}

interface Course {
    id: string;
    title: string;
    description?: string;
}

interface EnrolledCourse {
    course: Course;
    materials: Material[];
}

const CourseDetails: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [courseDetails, setCourseDetails] = useState<EnrolledCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) return;
      try {
        // Re-using the /my endpoint and filtering, as per the thought process.
        // A dedicated /api/courses/:id would be more efficient.
        const response = await api.get('/api/courses/my');
        if (response.data && response.data.courses) {
          const currentCourse = response.data.courses.find((c: EnrolledCourse) => c.course.id === courseId);
          if (currentCourse) {
            setCourseDetails(currentCourse);
          } else {
            throw new Error("Course not found or you don't have access.");
          }
        } else {
          throw new Error('Invalid data format from server');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load course details.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetails();
  }, [courseId]);

  const handleGenerateFromMaterial = (material: Material) => {
      // Navigate to a unified generation page with state
      navigate('/generate', { state: { source: { courseId, materialId: material.id, title: material.title } } });
  }

  if (loading) {
    return <p className="text-center p-8">Loading course details...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 p-8">Error: {error}</p>;
  }

  if (!courseDetails) {
    return <p className="text-center p-8">Course not found.</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto p-4 md:p-8"
    >
        <h1 className="text-4xl font-bold text-slate-100 mb-2">{courseDetails.course.title}</h1>
        <p className="text-slate-400 mb-8">Available materials for this course.</p>

        <div className="bg-slate-800 rounded-lg shadow-lg">
            <ul className="divide-y divide-slate-700">
                {courseDetails.materials.length > 0 ? courseDetails.materials.map(material => (
                    <li key={material.id} className="p-4 flex justify-between items-center hover:bg-slate-700/50 transition-colors">
                        <div>
                            <p className="font-semibold text-slate-200">{material.title}</p>
                            {material.year && <span className="text-xs text-slate-400">{material.year}</span>}
                        </div>
                        <button 
                            onClick={() => handleGenerateFromMaterial(material)}
                            className="px-4 py-2 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                        >
                            Generate Quiz
                        </button>
                    </li>
                )) : (
                    <li className="p-6 text-center text-slate-400">No materials available for this course yet.</li>
                )}
            </ul>
        </div>
    </motion.div>
  );
};

export default CourseDetails;
