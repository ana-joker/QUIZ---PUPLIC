import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useAuthStore } from '../context/AuthContext';
import { api } from '../services/api';
import { saveQuizToIndexedDB } from '../services/indexedDbService';
import { Quiz, AppSettings } from '../types';

import { GenerateFromMaterialForm } from '../components/GenerateFromMaterialForm';
import QuotaModal from '../components/QuotaModal';
import DeviceLimitModal from '../components/DeviceLimitModal';

const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-slate-800 bg-opacity-75 flex justify-center items-center z-40">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
    </div>
);

const GeneratePDFPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [settings, setSettings] = useState<AppSettings>({
        numMCQs: '10',
        numCases: '0',
        questionsPerCase: '2', // Added missing property
        difficulty: 'medium',
        quizLanguage: 'en',
        explanationLanguage: 'en',
        numImageQuestions: '0',
        additionalInstructions: '',
        questionTypes: ['MCQ'],
        shuffleAnswers: true,
        includeImages: false,
        timePerQuestion: 60,
        totalTime: 0,
        randomSeed: '',
        language: 'en',
        previewMode: false,
        saveTemplate: false,
        theme: 'dark',
        fontSize: 'medium',
        uiLanguage: 'en',
        temperature: 0.5,
        topP: 0.95,
        topK: 40,
    });
    const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // Modals for quota/device
    const [quotaModalOpen, setQuotaModalOpen] = useState(false);
    const [quotaDetails, setQuotaDetails] = useState<{ remaining: number; cap: number } | undefined>(undefined);
    const [deviceLimitModalOpen, setDeviceLimitModalOpen] = useState(false);
    const { isAuthenticated, user, deviceId } = useAuthStore();
    const [activeTab, setActiveTab] = useState('pdf');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles[0]) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, maxSize: 10 * 1024 * 1024 });

    const handleGenerateQuiz = async (payload: { file?: File | null, source?: object }) => {
        setLoading(true);
        setError('');
        setGeneratedQuiz(null);

        try {
            // 1. Check usage quota
            const usageRes = await api.get('/api/usage/today');
            const usage = usageRes.data;
            const questionsRequested = parseInt(settings.numMCQs) + parseInt(settings.numCases);
            const isCourseQuiz = payload.source && (payload.source as any).courseId;
            const quotaLimit = isCourseQuiz ? usage.limits.course : usage.limits.general;
            const currentUsage = isCourseQuiz ? (usage.today.courses[(payload.source as any).courseId] || 0) : usage.today.general;

            if (currentUsage + questionsRequested > quotaLimit) {
                setQuotaDetails({ remaining: quotaLimit - currentUsage, cap: quotaLimit });
                setQuotaModalOpen(true);
                setLoading(false);
                return;
            }

            // 2. Prepare payload and endpoint
            let response;
            if (payload.file) {
                const formData = new FormData();
                formData.append('file', payload.file);
                formData.append('settings', JSON.stringify(settings));
                formData.append('deviceId', deviceId);
                response = await api.post('/api/quiz/pdf', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else if (payload.source) {
                const { courseId, materialId } = payload.source as any;
                response = await api.post('/api/quiz/material', { courseId, materialId, settings });
            } else {
                throw new Error('No generation source provided.');
            }

            if (response.data) {
                setGeneratedQuiz(response.data);
            } else {
                throw new Error('No quiz data received');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to generate quiz.');
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

    const renderPdfTab = () => (
        <>
            <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer ${isDragActive ? 'border-purple-500 bg-slate-700' : 'border-slate-600 hover:border-purple-500'}`}>
                <input {...getInputProps()} />
                {isDragActive ? <p>Drop the PDF here ...</p> : <p>Drag 'n' drop a PDF here, or click to select a file</p>}
            </div>
            {file && <p className="mt-4 text-center text-sm text-slate-300">Selected: {file.name}</p>}
            <button onClick={() => handleGenerateQuiz({ file })} disabled={loading || !file} className="mt-6 w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 font-semibold transition-all disabled:opacity-50">
                Generate Quiz from PDF
            </button>
        </>
    );

    return (
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <QuotaModal open={quotaModalOpen} details={quotaDetails} onUpgrade={()=>window.location.href='/billing'} onClose={()=>setQuotaModalOpen(false)} />
            <DeviceLimitModal open={deviceLimitModalOpen} onManageDevices={()=>{setDeviceLimitModalOpen(false);window.location.href='/manage-devices';}} onClose={()=>setDeviceLimitModalOpen(false)} />
            
            <div className="relative bg-slate-800 p-6 rounded-lg shadow-lg">
                {loading && <LoadingOverlay />}
                <div className="flex border-b border-slate-700 mb-4">
                    <button onClick={() => setActiveTab('pdf')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'pdf' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400'}`}>From PDF</button>
                    {user && user.role === 'student' && 
                        <button onClick={() => setActiveTab('material')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'material' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400'}`}>From Course Material</button>}
                </div>

                {activeTab === 'pdf' && renderPdfTab()}
                {activeTab === 'material' && <GenerateFromMaterialForm settings={settings} onGenerate={(source) => handleGenerateQuiz({ source })} loading={loading} setLoading={setLoading} />}

                <h2 className="text-xl font-bold mt-6 mb-4 text-purple-400">Quiz Settings</h2>
                <div className="space-y-4">
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
                                    onChange={(e) => setSettings({...settings, timePerQuestion: parseInt(e.target.value)})}
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
                                    onChange={(e) => setSettings({...settings, totalTime: parseInt(e.target.value)})}
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
                                handleGenerateQuiz({ file });
                            }} 
                            disabled={loading || !file} 
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
                            <button onClick={() => alert('Starting quiz...')} className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors">Start Quiz</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-400">
                        <p>Your generated quiz will appear here.</p>
                        {!isAuthenticated && <p className="mt-4 text-sm text-yellow-400">Please <a href="/login" className="underline">login or register</a> to save your quizzes and track your progress.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneratePDFPage;