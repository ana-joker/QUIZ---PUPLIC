
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useTranslation } from '../App';
import QuizRenderer from '../components/QuizRenderer';
import { saveQuizToIndexedDB } from '../services/indexedDbService';
import { Quiz, Course, Material, PromptTemplate } from '../types';

const GenerateFromMaterial: React.FC = () => {
  const { courseId: initialCourseId, materialId: initialMaterialId } = useParams<{ courseId?: string, materialId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Form State
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  
  const [selectedCourse, setSelectedCourse] = useState(initialCourseId || '');
  const [selectedMaterial, setSelectedMaterial] = useState(initialMaterialId || '');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [numQuestions, setNumQuestions] = useState(20);
  const [questionTypes, setQuestionTypes] = useState(['MCQ']);
  const [difficulty, setDifficulty] = useState('Medium');
  const [shuffleAnswers, setShuffleAnswers] = useState(true);
  const [includeImages, setIncludeImages] = useState(false);
  const [timeLimit, setTimeLimit] = useState(0);
  const [language, setLanguage] = useState('ar');
  const [randomSeed, setRandomSeed] = useState('');
  const [promptOverrides, setPromptOverrides] = useState('');
  const [saveTemplate, setSaveTemplate] = useState(false);

  // UI State
  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, templatesRes] = await Promise.all([
          api.get('/api/courses'),
          api.get('/api/templates') 
        ]);
        setCourses(coursesRes.data);
        setTemplates(templatesRes.data);
        if (initialCourseId) {
          const course = coursesRes.data.find(c => c._id === initialCourseId);
          if (course) {
            setMaterials(course.materials);
          }
        }
      } catch (err) {
        setError(t('errorLoadingCourses'));
      }
    };
    fetchData();
  }, [initialCourseId, t]);

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setSelectedMaterial('');
    const course = courses.find(c => c._id === courseId);
    setMaterials(course ? course.materials : []);
  };
  
  const handleQuestionTypeChange = (type: string) => {
    setQuestionTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleGenerateQuiz = async () => {
    if (!selectedCourse || !selectedMaterial) {
        setError(t('pleaseSelectCourseAndMaterial'));
        return;
    }

    setLoading(true);
    setError('');
    setQuizData(null);
    setJobId(null);
    setJobStatus('Queued');

    const options = {
        numQuestions,
        questionTypes,
        difficulty,
        shuffleAnswers,
        includeImages,
        timeLimit,
        language,
        seed: randomSeed,
        promptOverrides,
        saveTemplate,
    };

    try {
      const response = await api.post('/api/exams/generate', {
        courseId: selectedCourse,
        materialId: selectedMaterial,
        templateId: selectedTemplate,
        options,
      });
      
      if (response.data.jobId) {
        setJobId(response.data.jobId);
      } else {
        await saveQuizToIndexedDB(response.data);
        setQuizData(response.data);
        setJobStatus('Done');
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('errorGeneratingQuiz');
      setError(errorMessage);
      setJobStatus('Failed');
      console.error('Error generating quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId || jobStatus === 'Done' || jobStatus === 'Failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/api/jobs/${jobId}/status`);
        const { status, result } = response.data;
        setJobStatus(status);

        if (status === 'completed') {
          setJobStatus('Done');
          const quizResponse = await api.get(result.url);
          await saveQuizToIndexedDB(quizResponse.data);
          setQuizData(quizResponse.data);
          clearInterval(interval);
        } else if (status === 'failed') {
          setError(t('errorGeneratingQuiz'));
          clearInterval(interval);
        }
      } catch (err) {
        setError(t('errorCheckingStatus'));
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus, t]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-900 text-slate-50 p-8"
    >
      <h1 className="text-4xl font-bold mb-8 text-purple-600">{t('generateFromMaterial')}</h1>
      
      {quizData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-700 rounded-2xl shadow-soft p-6"
        >
          <h2 className="text-2xl font-semibold mb-4">{t('generatedQuiz')}</h2>
          <QuizRenderer quizData={quizData} />
        </motion.div>
      ) : (
        <div className="bg-slate-800 p-8 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* --- Column 1 --- */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="course" className="block text-sm font-medium text-slate-300 mb-1">{t('selectCourse')}</label>
                        <select id="course" value={selectedCourse} onChange={handleCourseChange} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                            <option value="">{t('selectCoursePlaceholder')}</option>
                            {courses.map(course => <option key={course._id} value={course._id}>{course.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="material" className="block text-sm font-medium text-slate-300 mb-1">{t('selectMaterial')}</label>
                        <select id="material" value={selectedMaterial} onChange={e => setSelectedMaterial(e.target.value)} disabled={!selectedCourse} className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                            <option value="">{t('selectMaterialPlaceholder')}</option>
                            {materials.map(material => <option key={material._id} value={material._id}>{material.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="template" className="block text-sm font-medium text-slate-300 mb-1">Template (Optional)</label>
                        <select id="template" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3">
                            <option value="">Default Template</option>
                            {templates.map(template => <option key={template._id} value={template._id}>{template.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* --- Column 2 --- */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="numQuestions" className="block text-sm font-medium text-slate-300 mb-1">{t('settingsNumQuestions')}</label>
                        <input type="number" id="numQuestions" value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value, 10))} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('settingsQuestionTypes')}</label>
                        <div className="flex gap-4 flex-wrap">
                            {[ 'mcq', 'true_false', 'short_answer', 'case', 'matching', 'image' ].map(type => (
                                <div key={type} className="flex items-center">
                                    <input id={`type-${type}`} type="checkbox" checked={questionTypes.includes(type)} onChange={() => handleQuestionTypeChange(type)} className="h-4 w-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500" />
                                    <label htmlFor={`type-${type}`} className="ml-2 text-sm text-slate-300">{type.replace(/_/g, ' ').toUpperCase()}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-slate-300 mb-1">{t('settingsDifficulty')}</label>
                        <select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3">
                            <option value="Easy">{t('settingsEasy')}</option>
                            <option value="Medium">{t('settingsMediumDifficulty')}</option>
                            <option value="Hard">{t('settingsHard')}</option>
                            <option value="Mixed">{t('settingsMixed')}</option>
                        </select>
                    </div>
                </div>

                {/* --- Column 3 --- */}
                <div className="space-y-4">
                     <div>
                        <label htmlFor="language" className="block text-sm font-medium text-slate-300 mb-1">{t('quizLanguage')}</label>
                        <select id="language" value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3">
                            <option value="ar">العربية</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="timeLimit" className="block text-sm font-medium text-slate-300 mb-1">Time Limit (minutes, 0 for none)</label>
                        <input type="number" id="timeLimit" value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value, 10))} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3" />
                    </div>
                    <div>
                        <label htmlFor="randomSeed" className="block text-sm font-medium text-slate-300 mb-1">Random Seed (Optional)</label>
                        <input type="text" id="randomSeed" value={randomSeed} onChange={e => setRandomSeed(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3" />
                    </div>
                </div>

                {/* --- Advanced Options --- */}
                <div className="md:col-span-3 space-y-4">
                    <div>
                        <label htmlFor="promptOverrides" className="block text-sm font-medium text-slate-300 mb-1">Advanced: Prompt Overrides</label>
                        <textarea id="promptOverrides" value={promptOverrides} onChange={e => setPromptOverrides(e.target.value)} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3"></textarea>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center">
                            <input id="shuffle" type="checkbox" checked={shuffleAnswers} onChange={e => setShuffleAnswers(e.target.checked)} className="h-4 w-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500" />
                            <label htmlFor="shuffle" className="ml-2 block text-sm text-slate-300">Shuffle Answers?</label>
                        </div>
                        <div className="flex items-center">
                            <input id="images" type="checkbox" checked={includeImages} onChange={e => setIncludeImages(e.target.checked)} className="h-4 w-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500" />
                            <label htmlFor="images" className="ml-2 block text-sm text-slate-300">Include Images?</label>
                        </div>
                        <div className="flex items-center">
                            <input id="saveTemplate" type="checkbox" checked={saveTemplate} onChange={e => setSaveTemplate(e.target.checked)} className="h-4 w-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500" />
                            <label htmlFor="saveTemplate" className="ml-2 block text-sm text-slate-300">Save as new Template?</label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="text-center mt-8">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateQuiz}
                    disabled={loading || (jobId && jobStatus !== 'Done' && jobStatus !== 'Failed')}
                    className="py-3 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                    {loading ? t('generating') : (jobStatus && jobStatus !== 'Done' && jobStatus !== 'Failed' ? `${t('generationStatus')}: ${jobStatus}` : t('startQuizGeneration'))}
                </motion.button>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        </div>
      )}
    </motion.div>
  );
};

export default GenerateFromMaterial;
