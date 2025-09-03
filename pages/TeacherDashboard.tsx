
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useTranslation } from '../App';

// Expanded types for Teacher view
interface Material {
  _id: string;
  filename: string;
  course: string;
}

interface Student {
  _id: string;
  email: string; // Assuming we get student emails
}

interface TeacherCourse {
  _id: string;
  name: string;
  courseCode: string;
  materials: Material[];
  students: Student[];
}

const TeacherDashboard: React.FC = () => {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const { t } = useTranslation();

  const fetchTeacherData = async () => {
    try {
      const response = await api.get('/api/teacher/my-courses');
      setCourses(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('errorFetchingCourses');
      setError(errorMessage);
      console.error('Error fetching teacher courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadMaterial = async (courseId: string) => {
    if (!selectedFile) {
      setUploadError(t('selectFileFirst'));
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('material', selectedFile);
    formData.append('courseId', courseId);

    try {
      await api.post('/api/teacher/materials', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Refresh data after upload
      await fetchTeacherData();
      setSelectedFile(null); // Clear selection
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('errorUploadingFile');
      setUploadError(errorMessage);
      console.error('Error uploading material:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (window.confirm(t('confirmDeleteMaterial'))) {
      try {
        await api.delete(`/api/teacher/materials/${materialId}`);
        // Refresh data after delete
        await fetchTeacherData();
      } catch (err: any) {
        console.error('Error deleting material:', err);
        alert(t('errorDeletingFile'));
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-50"><p>{t('loading')}</p></div>;
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
      <h1 className="text-4xl font-bold mb-8 text-purple-500">{t('teacherDashboard')}</h1>
      {courses.length === 0 ? (
        <p className="text-slate-400">{t('noCoursesCreated')}</p>
      ) : (
        <div className="space-y-8">
          {courses.map(course => (
            <div key={course._id} className="bg-slate-800 rounded-2xl shadow-soft p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-purple-400">{course.name}</h2>
                <span className="text-sm bg-slate-700 text-purple-300 px-3 py-1 rounded-full">Code: {course.courseCode}</span>
              </div>

              {/* Materials Section */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-200 mb-3">{t('materials')}</h3>
                {course.materials.length > 0 ? (
                  <ul className="space-y-2">
                    {course.materials.map(material => (
                      <li key={material._id} className="flex items-center justify-between bg-slate-700 p-3 rounded-lg">
                        <span className="text-slate-300">{material.filename}</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteMaterial(material._id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          {t('delete')}
                        </motion.button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 text-sm">{t('noMaterialsUploaded')}</p>
                )}
                <div className="mt-4">
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="block w-full text-sm text-slate-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"/>
                  <motion.button onClick={() => handleUploadMaterial(course._id)} disabled={uploading || !selectedFile} className="mt-2 w-full py-2 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50">
                    {uploading ? t('uploading') : t('uploadNewMaterial')}
                  </motion.button>
                  {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
                </div>
              </div>

              {/* Students Section */}
              <div>
                <h3 className="text-xl font-semibold text-slate-200 mb-3">{t('enrolledStudents')}</h3>
                {course.students.length > 0 ? (
                  <ul className="space-y-2">
                    {course.students.map(student => (
                      <li key={student._id} className="bg-slate-700 p-3 rounded-lg text-slate-300">
                        {student.email}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 text-sm">{t('noStudentsEnrolled')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default TeacherDashboard;
