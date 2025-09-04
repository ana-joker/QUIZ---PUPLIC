import React, { useState } from 'react';
import { api, quizApi } from '../services/api';
import { useAuthStore } from '../context/AuthStore';
import QuotaModal from '../components/QuotaModal';
import DeviceLimitModal from '../components/DeviceLimitModal';
import { saveQuizToIndexedDB } from '../services/indexedDbService';
import { Quiz, AppSettings } from '../types';
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
        apiKey: '',
    });
    const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [quotaModalOpen, setQuotaModalOpen] = useState(false);
    const [quotaDetails, setQuotaDetails] = useState<{remaining:number,cap:number}|undefined>(undefined);
    const [deviceLimitModalOpen, setDeviceLimitModalOpen] = useState(false);
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('text');

    const handleGenerateQuiz = async (sourcePayload: { content?: string; source?: { courseId: string; materialId: string; } }) => {
        setLoading(true);
        setError('');
        setGeneratedQuiz(null);
        try {
            let response;
            if (sourcePayload.content) {
                response = await quizApi.generateFromText(settings, sourcePayload.content);
            } else if (sourcePayload.source) {
                response = await quizApi.generateFromMaterial(settings, sourcePayload.source.courseId, sourcePayload.source.materialId);
            } else {
                throw new Error('Invalid source payload.');
            }
            if (response.data) {
                setGeneratedQuiz(response.data);
            } else {
                throw new Error('No quiz data received');
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

    const renderTextTab = () => (
        <>
            <textarea
                className="w-full h-48 p-4 rounded-md bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button onClick={() => handleGenerateQuiz({ content: text })} disabled={loading || !text.trim()} className="mt-6 w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 font-semibold transition-all disabled:opacity-50">
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
                    {user && user.type === 'student' && 
                        <button onClick={() => setActiveTab('material')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'material' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400'}`}>From Course Material</button>}
                </div>
                {activeTab === 'text' && renderTextTab()}
                {activeTab === 'material' && <GenerateFromMaterialForm settings={settings} onGenerate={(quizData) => setGeneratedQuiz(quizData)} loading={loading} setLoading={setLoading} />}
                <h2 className="text-xl font-bold mt-6 mb-4 text-purple-400">Quiz Settings</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Number of MCQs: {settings.numMCQs}</label>
                        <input type="range" min="0" max="50" value={settings.numMCQs} onChange={(e) => setSettings({...settings, numMCQs: e.target.value})} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                     <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Difficulty</label>
                        <div className="flex gap-4">
                            <button onClick={() => setSettings({...settings, difficulty: 'easy'})} className={`px-4 py-2 rounded-md ${settings.difficulty === 'easy' ? 'bg-purple-600' : 'bg-slate-700'}`}>Easy</button>
                            <button onClick={() => setSettings({...settings, difficulty: 'medium'})} className={`px-4 py-2 rounded-md ${settings.difficulty === 'medium' ? 'bg-purple-600' : 'bg-slate-700'}`}>Medium</button>
                            <button onClick={() => setSettings({...settings, difficulty: 'hard'})} className={`px-4 py-2 rounded-md ${settings.difficulty === 'hard' ? 'bg-purple-600' : 'bg-slate-700'}`}>Hard</button>
                        </div>
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
                        {!user && <p className="mt-4 text-sm text-yellow-400">Please <a href="/login" className="underline">login or register</a> to save your quizzes and track your progress.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneratePage;
