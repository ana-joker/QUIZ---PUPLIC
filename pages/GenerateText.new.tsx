import React, { useState, useEffect } from 'react';
import { coursesApi, quizApi, templatesApi } from '../services/api';
import { useAuthStore } from '../context/AuthContext';
import QuotaModal from '../components/QuotaModal';
import DeviceLimitModal from '../components/DeviceLimitModal';
import { saveQuizToIndexedDB } from '../services/indexedDbService';
import { Quiz, AppSettings, Course, Template } from '../types';
import { GenerateFromMaterialForm } from '../components/GenerateFromMaterialForm';

const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-slate-800 bg-opacity-75 flex justify-center items-center z-40">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
    </div>
);

const GeneratePage: React.FC = () => {
    const [text, setText] = useState('');
    const [settings, setSettings] = useState<AppSettings>({
        numMCQs: '10',
        numCases: '0',
        questionsPerCase: '2',
        difficulty: 'medium',
        quizLanguage: 'ar',
        explanationLanguage: 'ar',
        numImageQuestions: '0',
        additionalInstructions: '',
        questionTypes: ['MCQ'],
        theme: 'dark',
        fontSize: 'medium',
        uiLanguage: 'ar',
        temperature: 0.5,
        topP: 0.95,
        topK: 40,
        shuffleAnswers: true,
        includeImages: false,
        timePerQuestion: 60,
        totalTime: 0,
        randomSeed: '',
        language: 'ar',
        previewMode: false,
        saveTemplate: false,
    });
    const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [quotaModalOpen, setQuotaModalOpen] = useState(false);
    const [quotaDetails, setQuotaDetails] = useState<{remaining:number,cap:number}|undefined>(undefined);
    const [deviceLimitModalOpen, setDeviceLimitModalOpen] = useState(false);
    const [jobStatus, setJobStatus] = useState<any>(null);
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('text');
    const [courses, setCourses] = useState<Course[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [promptOverrides, setPromptOverrides] = useState('');


    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [coursesRes, templatesRes] = await Promise.all([
                    coursesApi.getMyCourses(),
                    templatesApi.getTemplates(),
                ]);
                setCourses(coursesRes.data.courses || []);
                setTemplates(templatesRes.data || []);
            } catch (err) {
                console.error("Failed to fetch initial data", err);
                setError("Failed to load courses and templates.");
            }
        };

        fetchInitialData();
    }, []);


    // Clean up polling on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    // Poll job status
    const startPollingJobStatus = (jobId: string) => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }

        const interval = setInterval(async () => {
            try {
                const response = await quizApi.getJobStatus(jobId);
                setJobStatus(response.data);

                if (response.data.status === 'completed') {
                    clearInterval(interval);
                    setPollingInterval(null);

                    // Fetch the exam data
                    const examResponse = await quizApi.getExam(response.data.result.examId);
                    if (examResponse.data) {
                        // Convert exam data to quiz format for display
                        const quizData: Quiz = {
                            quizId: examResponse.data._id,
                            quizTitle: `Exam - ${examResponse.data.meta.courseName || 'General'}`,
                            quizData: examResponse.data.questions.map((q: any) => ({
                                question: q.stem,
                                options: q.choices,
                                correctAnswer: q.choices[q.correctIndex],
                                explanation: q.explanation,
                                difficulty: q.difficulty,
                                type: q.type || 'MCQ'
                            })),
                            settings: examResponse.data.meta,
                            createdAt: examResponse.data.createdAt,
                            pdfUrl: examResponse.data.pdfUrl
                        };
                        setGeneratedQuiz(quizData);
                    }
                } else if (response.data.status === 'failed') {
                    clearInterval(interval);
                    setPollingInterval(null);
                    setError(response.data.error || 'Exam generation failed');
                }
            } catch (err: any) {
                console.error('Error polling job status:', err);
                clearInterval(interval);
                setPollingInterval(null);
                setError('Failed to check job status');
            }
        }, 2000); // Poll every 2 seconds

        setPollingInterval(interval);
    };

    const handleGenerateQuiz = async () => {
        setLoading(true);
        setError('');
        setGeneratedQuiz(null);
        setJobStatus(null);

        try {
            const payload = {
                courseId: selectedCourse || 'general',
                templateId: selectedTemplate || undefined,
                numQuestions: parseInt(settings.numMCQs),
                difficulty: settings.difficulty,
                language: settings.language,
                shuffleAnswers: settings.shuffleAnswers,
                includeImages: settings.includeImages,
                topic: settings.additionalInstructions || undefined,
                promptOverrides: promptOverrides || undefined,
                sourceText: text,
            };

            const response = await quizApi.generateExam(payload);

            if (response.data.status === 'queued') {
                // Start polling job status
                setJobStatus({ status: 'queued', jobId: response.data.jobId });
                startPollingJobStatus(response.data.jobId);
            } else if (response.data.status === 'completed') {
                // Exam was returned from cache
                const examResponse = await quizApi.getExam(response.data.examId);
                if (examResponse.data) {
                    // Convert exam data to quiz format for display
                    const quizData: Quiz = {
                        quizId: examResponse.data._id,
                        quizTitle: `Exam - ${examResponse.data.meta.courseName || 'General'}`,
                        quizData: examResponse.data.questions.map((q: any) => ({
                            question: q.stem,
                            options: q.choices,
                            correctAnswer: q.choices[q.correctIndex],
                            explanation: q.explanation,
                            difficulty: q.difficulty,
                            type: q.type || 'MCQ'
                        })),
                        settings: examResponse.data.meta,
                        createdAt: examResponse.data.createdAt,
                        pdfUrl: examResponse.data.pdfUrl
                    };
                    setGeneratedQuiz(quizData);
                }
            }
        } catch (err: any) {
            if (err?.response) {
                if (err.response.status === 402) {
                    setQuotaDetails(err.response.data?.details || undefined);
                    setQuotaModalOpen(true);
                } else if (err.response.status === 403) {
                    setDeviceLimitModalOpen(true);
                } else {
                    setError(err.response.data?.message || 'Failed to generate quiz.');
                }
            } else {
                setError('Failed to generate quiz.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLocally = async () => {
        if (generatedQuiz) {
            try {
                await saveQuizToIndexedDB(generatedQuiz);
                alert('Quiz saved locally!');
            } catch (saveError: any) {
                setError(saveError.message || 'Could not save the quiz.');
            }
        }
    };

    const handleDownloadPdf = () => {
        if (generatedQuiz && generatedQuiz.pdfUrl) {
            window.open(generatedQuiz.pdfUrl, '_blank');
        }
    };

    const renderTextTab = () => (
        <>
            <textarea
                className="w-full h-48 p-4 rounded-md bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button onClick={handleGenerateQuiz} disabled={loading || !text.trim()} className="mt-6 w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 font-semibold transition-all disabled:opacity-50">
                Generate Quiz from Text
            </button>
        </>
    );

    return (
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <QuotaModal open={quotaModalOpen} details={quotaDetails} onUpgrade={()=>window.location.href='/billing'} onClose={()=>setQuotaModalOpen(false)} />
            <DeviceLimitModal open={deviceLimitModalOpen} onManageDevices={()=>{setDeviceLimitModalOpen(false);window.location.href='/manage-devices';}} onClose={()=>setDeviceLimitModalOpen(false)} />
            {/* Left Column: Input & Settings */}
            <div className="relative bg-slate-800 p-6 rounded-lg shadow-lg">
                {loading && <LoadingOverlay />}
                <div className="flex border-b border-slate-700 mb-4">
                    <button onClick={() => setActiveTab('text')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'text' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400'}`}>From Text</button>
                    {user && (user.role === 'student' || user.role === 'teacher') &&
                        <button onClick={() => setActiveTab('material')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'material' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400'}`}>From Course Material</button>}
                </div>
                {activeTab === 'text' && renderTextTab()}
                {activeTab === 'material' && <GenerateFromMaterialForm settings={settings} onGenerate={(quizData) => setGeneratedQuiz(quizData)} loading={loading} setLoading={setLoading} />}
                <h2 className="text-xl font-bold mt-6 mb-4 text-purple-400">Quiz Settings</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-300">Course</label>
                            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full p-2 rounded-md bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="">Select a Course</option>
                                {courses.map(course => (
                                    <option key={course._id} value={course._id}>{course.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-300">Template</label>
                            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="w-full p-2 rounded-md bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="">Select a Template</option>
                                {templates.map(template => (
                                    <option key={template._id} value={template._id}>{template.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Number of Questions: {settings.numMCQs}</label>
                        <input type="range" min="1" max="50" value={settings.numMCQs} onChange={(e) => setSettings({...settings, numMCQs: e.target.value})} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Question Types</label>
                        <div className="flex flex-wrap gap-2">
                            {["MCQ", "TrueFalse", "ShortAnswer"].map(type => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        const currentTypes = settings.questionTypes || [];
                                        if (currentTypes.includes(type)) {
                                            setSettings({...settings, questionTypes: currentTypes.filter(t => t !== type)});
                                        } else {
                                            setSettings({...settings, questionTypes: [...currentTypes, type]});
                                        }
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-sm ${settings.questionTypes?.includes(type) ? 'bg-purple-600' : 'bg-slate-700'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Difficulty</label>
                        <div className="flex gap-4">
                            <button onClick={() => setSettings({...settings, difficulty: 'easy'})} className={`px-4 py-2 rounded-md ${settings.difficulty === 'easy' ? 'bg-purple-600' : 'bg-slate-700'}`}>Easy</button>
                            <button onClick={() => setSettings({...settings, difficulty: 'medium'})} className={`px-4 py-2 rounded-md ${settings.difficulty === 'medium' ? 'bg-purple-600' : 'bg-slate-700'}`}>Medium</button>
                            <button onClick={() => setSettings({...settings, difficulty: 'hard'})} className={`px-4 py-2 rounded-md ${settings.difficulty === 'hard' ? 'bg-purple-600' : 'bg-slate-700'}`}>Hard</button>
                            <button onClick={() => setSettings({...settings, difficulty: 'mixed'})} className={`px-4 py-2 rounded-md ${settings.difficulty === 'mixed' ? 'bg-purple-600' : 'bg-slate-700'}`}>Mixed</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="shuffleAnswers"
                            checked={settings.shuffleAnswers || false}
                            onChange={(e) => setSettings({...settings, shuffleAnswers: e.target.checked})}
                            className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="shuffleAnswers" className="text-sm font-medium text-slate-300">Shuffle Answers</label>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="includeImages"
                            checked={settings.includeImages || false}
                            onChange={(e) => setSettings({...settings, includeImages: e.target.checked})}
                            className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="includeImages" className="text-sm font-medium text-slate-300">Include Images</label>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Time Settings</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Time per question (seconds)</label>
                                <input
                                    type="number"
                                    min="10"
                                    max="300"
                                    value={settings.timePerQuestion || 60}
                                    onChange={(e) => setSettings({...settings, timePerQuestion: parseInt(e.target.value)})
                                    }
                                    className="w-full p-2 rounded-md bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Total time (minutes, 0 for no limit)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="180"
                                    value={settings.totalTime || 0}
                                    onChange={(e) => setSettings({...settings, totalTime: parseInt(e.target.value)})
                                    }
                                    className="w-full p-2 rounded-md bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Language</label>
                        <div className="flex gap-4">
                            <button onClick={() => setSettings({...settings, language: 'ar'})} className={`px-4 py-2 rounded-md ${settings.language === 'ar' ? 'bg-purple-600' : 'bg-slate-700'}`}>Arabic</button>
                            <button onClick={() => setSettings({...settings, language: 'en'})} className={`px-4 py-2 rounded-md ${settings.language === 'en' ? 'bg-purple-600' : 'bg-slate-700'}`}>English</button>
                            <button onClick={() => setSettings({...settings, language: 'auto'})} className={`px-4 py-2 rounded-md ${settings.language === 'auto' ? 'bg-purple-600' : 'bg-slate-700'}`}>Auto-detect</button>
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Random Seed (optional)</label>
                        <input
                            type="text"
                            value={settings.randomSeed || ''}
                            onChange={(e) => setSettings({...settings, randomSeed: e.target.value})}
                            placeholder="Enter a seed for reproducible results"
                            className="w-full p-2 rounded-md bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Additional Instructions</label>
                        <textarea
                            value={settings.additionalInstructions || ''}
                            onChange={(e) => setSettings({...settings, additionalInstructions: e.target.value})}
                            placeholder="Enter any specific requirements for the quiz"
                            rows={3}
                            className="w-full p-2 rounded-md bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Advanced: Prompt Overrides</label>
                        <textarea
                            value={promptOverrides}
                            onChange={(e) => setPromptOverrides(e.target.value)}
                            placeholder="Override parts of the prompt, e.g., {"system": "New system prompt"}"
                            rows={3}
                            className="w-full p-2 rounded-md bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="saveTemplate"
                            checked={settings.saveTemplate || false}
                            onChange={(e) => setSettings({...settings, saveTemplate: e.target.checked})}
                            className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="saveTemplate" className="text-sm font-medium text-slate-300">Save as Template</label>
                    </div>
                    <div>
                        <button
                            onClick={() => {
                                setSettings({...settings, previewMode: true});
                                handleGenerateQuiz();
                            }}
                            disabled={loading || !text.trim()}
                            className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50"
                        >
                            Preview (Generate 1-3 sample questions)
                        </button>
                    </div>
                </div>
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            </div>
            {/* Right Column: Results */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Results</h2>
                {jobStatus && (
                    <div className="mb-4 p-4 bg-slate-900 rounded-md">
                        <h3 className="text-lg font-semibold mb-2">Generation Status</h3>
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${ 
                                jobStatus.status === 'queued' ? 'bg-yellow-500' :
                                jobStatus.status === 'generating' ? 'bg-blue-500' :
                                jobStatus.status === 'completed' ? 'bg-green-500' :
                                'bg-red-500'
                            }`}></div>
                            <span className="capitalize">{jobStatus.status}</span>
                        </div>
                        {jobStatus.status === 'queued' && (
                            <p className="text-sm text-slate-400 mt-2">Your exam is in the queue. Please wait...</p>
                        )}
                        {jobStatus.status === 'generating' && (
                            <p className="text-sm text-slate-400 mt-2">Your exam is being generated. This may take a moment...</p>
                        )}
                    </div>
                )}
                {generatedQuiz ? (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">{generatedQuiz.quizTitle}</h3>
                        <div className="max-h-96 overflow-y-auto p-2 bg-slate-900 rounded-md">
                            {generatedQuiz.quizData.map((q, i) => (
                                <div key={i} className="mb-4 p-2 border-b border-slate-700">
                                    <p className="font-semibold">{i+1}. {q.question}</p>
                                    <ul className="list-disc pl-5 mt-2 text-sm text-slate-300">
                                        {q.options.map((opt: string, j: number) => <li key={j}>{opt}</li>)}
                                    </ul>
                                    <p className="text-green-400 mt-2 text-sm">Correct Answer: {
                                        Array.isArray(q.correctAnswer)
                                            ? q.correctAnswer.map((ans, idx) => (
                                                typeof ans === 'object' && ans !== null && 'prompt' in ans && 'answer' in ans
                                                    ? <div key={idx}>{ans.prompt}: {ans.answer}</div>
                                                    : <div key={idx}>{ans}</div>
                                            ))
                                            : q.correctAnswer
                                    }</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 mt-4">
                            <button onClick={handleSaveLocally} className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">Save Locally</button>
                            {generatedQuiz.pdfUrl && (
                                <button onClick={handleDownloadPdf} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors">Download PDF</button>
                            )}
                            <button onClick={() => alert('Starting quiz...')} className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors">Start Quiz</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-400">
                        <p>Your generated quiz will appear here.</p>
                        {!user && <p className="mt-4 text-sm text-yellow-400">Please <a href="/login" className="underline">login or register</a> to save your quizzes and track your progress.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneratePage;