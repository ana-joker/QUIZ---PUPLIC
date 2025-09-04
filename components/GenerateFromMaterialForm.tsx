import React, { useState, useEffect } from 'react';
import { api, quizApi } from '../services/api';
import { AppSettings } from '../types';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../App';

interface EnrolledCourse {
    course: { id: string; title: string; };
    materials: { id: string; title: string; }[];
}

interface GenerateFromMaterialFormProps {
    settings: AppSettings; // Changed from QuizSettings to AppSettings
    onGenerate: (quizData: any) => void; // Changed source to quizData
    loading: boolean;
    setLoading: (loading: boolean) => void; // Add setLoading prop
}

export const GenerateFromMaterialForm: React.FC<GenerateFromMaterialFormProps> = ({ settings, onGenerate, loading, setLoading }) => {
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
    const [error, setError] = useState('');
    const { addToast } = useToast();
    const { t } = useTranslation();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/api/courses/my');
                setEnrolledCourses(response.data.courses || []);
            } catch (err) {
                setError(t('errorLoadingCourses') || 'Could not load your courses.');
                addToast(t('errorLoadingCourses') || 'Could not load your courses.', 'error');
            }
        };
        fetchCourses();
    }, [addToast, t]);

    const selectedCourse = enrolledCourses.find(c => c.course.id === selectedCourseId);

    const handleGenerate = async () => {
        setError('');
        if (!selectedCourseId) {
            setError(t('pleaseSelectCourse') || 'Please select a course.');
            addToast(t('pleaseSelectCourse') || 'Please select a course.', 'warning');
            return;
        }
        if (!selectedMaterialId) {
            setError(t('pleaseSelectMaterial') || 'Please select a material.');
            addToast(t('pleaseSelectMaterial') || 'Please select a material.', 'warning');
            return;
        }
        setLoading(true);
        try {
            const res = await quizApi.generateFromMaterial(settings, selectedCourseId, selectedMaterialId);
            onGenerate(res.data);
            addToast(t('quizGeneratedSuccessfully') || 'Quiz generated successfully!', 'success');
        } catch (err: any) {
            console.error('Error generating quiz from material:', err);
            setError(err.response?.data?.message || t('errorGeneratingQuizFromMaterial') || 'Failed to generate quiz from material.');
            addToast(err.response?.data?.message || t('errorGeneratingQuizFromMaterial') || 'Failed to generate quiz from material.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Friendly message if no courses
    if (!loading && enrolledCourses.length === 0) {
        return <div className="text-center text-slate-400 py-8">{t('noCoursesFound') || 'No courses found. Please join a course first.'}</div>;
    }

    // Friendly message if no materials
    if (!loading && selectedCourse && selectedCourse.materials.length === 0) {
        return <div className="text-center text-slate-400 py-8">{t('noMaterialsFound') || 'No materials found for this course.'}</div>;
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block mb-2 text-sm font-medium text-slate-300">{t('selectCourse') || 'Select Course'}</label>
                <select
                    value={selectedCourseId}
                    onChange={e => {
                        setSelectedCourseId(e.target.value);
                        setSelectedMaterialId('');
                    }}
                    className="w-full p-3 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="" disabled>{t('selectCoursePlaceholder') || '-- Select a course --'}</option>
                    {enrolledCourses.map(c => <option key={c.course.id} value={c.course.id}>{c.course.title}</option>)}
                </select>
            </div>

            {selectedCourse && (
                <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">{t('selectMaterial') || 'Select Material'}</label>
                    <select
                        value={selectedMaterialId}
                        onChange={e => setSelectedMaterialId(e.target.value)}
                        className="w-full p-3 rounded-md bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="" disabled>{t('selectMaterialPlaceholder') || '-- Select a material --'}</option>
                        {selectedCourse.materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                </div>
            )}

            <button
                onClick={handleGenerate}
                disabled={loading || !selectedCourseId || !selectedMaterialId}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
            >
                {loading && <span className="loader mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                {t('generateQuizFromMaterial') || 'Generate Quiz from Material'}
            </button>
            {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        </div>
    );
};