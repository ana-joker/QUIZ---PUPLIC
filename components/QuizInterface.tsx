

import React, { useMemo, useEffect, useCallback } from 'react';
import { Quiz } from '../types';
import { useSettings, useTranslation } from '../App';
import { saveQuizToIndexedDB, getQuizByIdFromIndexedDB } from '../services/indexedDbService';
import { generateQuizHtml } from '../utils/quizHtmlGenerator';

interface QuizInterfaceProps {
    quiz: Quiz;
    onExit: () => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ quiz, onExit }) => {
    const { settings } = useSettings();
    const { t } = useTranslation();

    const handleDownloadHtml = useCallback(() => {
        if (!quiz) return;
        const quizTitle = quiz.quizTitle || t("untitledQuiz");
        const htmlContent = generateQuizHtml(quiz, quizTitle);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${quizTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, [quiz, t]);

    // Effect to listen for messages from the iframe
    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data && typeof event.data === 'object' && event.data.type === 'quiz-finished') {
                if (!quiz.id) return;

                const { score, total, percentage, timeTaken } = event.data.payload;
                
                try {
                    const existingQuiz = await getQuizByIdFromIndexedDB(quiz.id);
                    if (existingQuiz) {
                        const updatedQuiz = {
                            ...existingQuiz,
                            score,
                            total,
                            percentage: `${percentage.toFixed(1)}%`,
                            timeTaken: `${Math.floor(timeTaken / 60).toString().padStart(2, '0')}:${(timeTaken % 60).toString().padStart(2, '0')}`,
                        };
                        await saveQuizToIndexedDB(updatedQuiz);
                    }
                } catch (error) {
                    console.error("Failed to update quiz in IndexedDB with results:", error);
                }
                
                onExit();

            } else if (event.data && event.data.type === 'download-quiz') {
                handleDownloadHtml();
            } else if (event.data === 'quiz-exit') {
                onExit();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [onExit, quiz, handleDownloadHtml]);

    // useMemo to generate the HTML content only when the quiz data or theme changes.
    const htmlContent = useMemo(() => {
        const quizDataString = JSON.stringify(quiz.quizData);
        const quizTitleString = JSON.stringify(quiz.quizTitle);
        const selectedImageFilesString = JSON.stringify(quiz.selectedImageFiles || []);
        const lang = settings.uiLanguage;
        
        const translationsForScript = JSON.stringify({
            questionOf: t('questionOf'),
            caseScenario: t('caseScenario'),
            explanation: t('explanation'),
            noValidQuestions: t('noValidQuestions'),
            startQuiz: t('startQuiz'),
            fastSummary: t('fastSummary'),
            previousQuestion: t('previousQuestion'),
            nextQuestion: t('nextQuestion'),
            finishQuiz: t('finishQuiz'),
            quizComplete: t('quizComplete'),
            yourScore: t('yourScore'),
            reviewAnswers: t('reviewAnswers'),
            retakeQuiz: t('retakeQuiz'),
            exitToMainMenu: t('exitToMainMenu'),
            backToResults: t('backToResults'),
            reviewAnswersTitle: t('reviewAnswersTitle'),
            transformContentToQuiz: t('transformContentToQuiz'),
            saveAsHtml: t('saveAsHtml'),
        });

        return `
            <!DOCTYPE html>
            <html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${quiz.quizTitle}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --ms-blue: #0078D4; --ms-light-blue: #EFF6FC; --ms-dark-blue: #005A9E;
                        --ms-gray-100: #F3F2F1; --ms-text-color: #323130; --ms-correct-green: #107C10;
                        --ms-incorrect-red: #D83B01; --ms-correct-bg: #DFF6DD; --ms-incorrect-bg: #FDE7E9;
                        --ms-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); --body-bg: #FDFDFD;
                        --container-bg: rgba(255, 255, 255, 0.8); --container-border: rgba(0, 0, 0, 0.05);
                        --card-bg: rgba(255, 255, 255, 0.9); --card-border: #E1DFDD;
                    }
                    html.dark {
                        --ms-blue: #2899F5; --ms-light-blue: #0c2d48; --ms-dark-blue: #50BFFF;
                        --ms-gray-100: #2D2D2D; --ms-text-color: #F3F2F1; --ms-correct-green: #27B327;
                        --ms-incorrect-red: #F1704A; --ms-correct-bg: #0A3D0A; --ms-incorrect-bg: #4B1705;
                        --ms-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); --body-bg: #121212;
                        --container-bg: rgba(29, 29, 29, 0.8); --container-border: rgba(255, 255, 255, 0.1);
                        --card-bg: rgba(40, 40, 40, 0.9); --card-border: #4a4a4a;
                    }
                    body { font-family: 'Segoe UI', 'Tajawal', sans-serif; color: var(--ms-text-color); background-color: var(--body-bg); transition: background-color 0.3s ease, color 0.3s ease; }
                    .container-glass { background-color: var(--container-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--container-border); transition: background-color 0.3s ease, border 0.3s ease; }
                    .page { display: none; }
                    .page.active { display: block; animation: page-fade-in 0.5s ease-out forwards; }
                    @keyframes page-fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    .question-card { background-color: var(--card-bg); backdrop-filter: blur(10px); border: 1px solid var(--card-border); box-shadow: var(--ms-shadow); transition: all 0.3s ease; }
                    .case-card, .explanation-box { padding: 1rem; border-radius: 0.375rem; margin-bottom: 1rem; font-family: 'Tajawal', sans-serif; border-inline-start-width: 5px; }
                    .case-card { background-color: var(--ms-light-blue); border-inline-start-color: var(--ms-blue); }
                    .case-card .title { color: var(--ms-dark-blue); font-weight: bold; font-size: 1.125rem; }
                    html.dark .case-card .title { color: var(--ms-blue); }
                    .case-card .body { color: var(--ms-text-color); margin-top: 0.5rem; }
                    html.dark .case-card .body { color: #e0e0e0; }
                    .explanation-box { background-color: var(--ms-gray-100); border-inline-start-color: #a19f9d; }
                    html.dark .explanation-box { background-color: #252423; border-inline-start-color: #605e5c;}
                    .explanation-box .title { font-weight: bold; color: var(--ms-text-color); }
                    .explanation-box .body { margin-top: 0.5rem; color: var(--ms-text-color); }
                    .option-label { cursor: pointer; padding: 0.75rem 1rem; border: 2px solid transparent; border-radius: 0.375rem; transition: all 0.2s; background-color: rgba(128,128,128,0.1); }
                    .option-label:hover { border-color: var(--ms-blue); }
                    .option-label.selected { border-color: var(--ms-dark-blue); background-color: var(--ms-light-blue); }
                    .option-label.correct-answer-feedback { background-color: var(--ms-correct-bg) !important; border-color: var(--ms-correct-green) !important; color: #000 !important; }
                    html.dark .option-label.correct-answer-feedback { color: #fff !important; }
                    .option-label.incorrect-answer-feedback { background-color: var(--ms-incorrect-bg) !important; border-color: var(--ms-incorrect-red) !important; }
                    .review .option-label.correct-answer, .basmaja-correct-answer { background-color: var(--ms-correct-bg) !important; border-color: var(--ms-correct-green) !important; }
                    .review .option-label.incorrect-answer { background-color: var(--ms-incorrect-bg); border-color: var(--ms-incorrect-red); }
                    .btn-primary, .btn-secondary, .btn-tertiary { color: white; transition: all .3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                    .btn-primary { background-color: var(--ms-blue); } .btn-primary:hover:not(:disabled) { background-color: var(--ms-dark-blue); transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
                    .btn-secondary { background-color: #6c757d; } .btn-secondary:hover:not(:disabled) { background-color: #5a6268; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
                    .btn-tertiary { background-color: #107C10; } .btn-tertiary:hover:not(:disabled) { background-color: #0b530b; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
                    .btn-primary:disabled, .btn-secondary:disabled, .btn-tertiary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
                    .flawed-tag { background-color: var(--ms-incorrect-bg); border: 1px solid var(--ms-incorrect-red); color: var(--ms-incorrect-red); padding: 0.5rem 1rem; border-radius: 0.375rem; margin-bottom: 1rem; font-weight: bold; display: flex; align-items: center; gap: 0.5rem; }
                    .protected-content {
                        user-select: none;
                        -webkit-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                    }
                </style>
            </head>
            <body class="${settings.theme}">
                <div class="max-w-4xl mx-auto p-4 md:p-8">
                    <div id="landing-page" class="page active text-center container-glass p-8 rounded-lg"></div>
                    <div id="quiz-page" class="page container-glass p-6 rounded-lg protected-content"></div>
                    <div id="results-page" class="page container-glass p-6 md:p-8 rounded-lg"></div>
                    <div id="review-page" class="page container-glass p-6 rounded-lg protected-content"></div>
                    <div id="basmaja-page" class="page container-glass p-6 rounded-lg protected-content"></div>
                </div>
                <script>
                    const quizData = ${quizDataString};
                    const quizTitle = ${quizTitleString};
                    const selectedImageFiles = ${selectedImageFilesString};
                    const translations = ${translationsForScript};
                    const scorableQuizData = quizData.filter(q => !q.isFlawed);
                    const userAnswers = new Array(scorableQuizData.length).fill(null);
                    let currentQuestionIndex = 0;
                    let quizStartTime = 0;
                    let timerInterval;

                    const pages = { landing: document.getElementById('landing-page'), quiz: document.getElementById('quiz-page'), results: document.getElementById('results-page'), review: document.getElementById('review-page'), basmaja: document.getElementById('basmaja-page') };
                    
                    function showPage(pageId) { Object.values(pages).forEach(p => p.classList.remove('active')); if (pages[pageId]) pages[pageId].classList.add('active'); window.scrollTo(0, 0); }
                    
                    function updateProgressBar() {
                        const progressBar = document.getElementById('progress-bar');
                        if(progressBar) progressBar.style.width = scorableQuizData.length > 0 ? \`\${((currentQuestionIndex + 1) / scorableQuizData.length) * 100}%\` : '0%';
                    }
                    
                    function startTimer() {
                        quizStartTime = Date.now();
                        const timerEl = document.getElementById('quiz-timer');
                        timerInterval = setInterval(() => {
                            const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
                            const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
                            const secs = (elapsed % 60).toString().padStart(2, '0');
                            if(timerEl) timerEl.textContent = \`\${mins}:\${secs}\`;
                        }, 1000);
                    }
                    
                    function updateNavigationButtons() {
                        const prevBtn = document.getElementById('prev-question-btn');
                        const nextBtn = document.getElementById('next-question-btn');
                        const finishBtn = document.getElementById('finish-quiz-btn');
                        
                        if (!prevBtn || !nextBtn || !finishBtn) return;
                        
                        prevBtn.disabled = currentQuestionIndex === 0;
                        nextBtn.disabled = userAnswers[currentQuestionIndex] === null;

                        if (currentQuestionIndex === scorableQuizData.length - 1) {
                            nextBtn.classList.add('hidden');
                            finishBtn.classList.remove('hidden');
                            finishBtn.disabled = userAnswers[currentQuestionIndex] === null;
                        } else {
                            nextBtn.classList.remove('hidden');
                            finishBtn.classList.add('hidden');
                        }
                    }

                    function displayQuestion(index) {
                        if (index < 0 || index >= scorableQuizData.length) return;
                        currentQuestionIndex = index;
                        const q = scorableQuizData[index];
                        const quizContentContainer = document.getElementById('quiz-content');

                        document.getElementById('question-counter').textContent = translations.questionOf.replace('{current}', index + 1).replace('{total}', scorableQuizData.length);
                        
                        let imageHTML = '';
                        if (typeof q.refersToUploadedImageIndex === 'number' && q.refersToUploadedImageIndex >= 0 && selectedImageFiles[q.refersToUploadedImageIndex]) {
                            imageHTML = \`<img src="\${selectedImageFiles[q.refersToUploadedImageIndex]}" alt="Quiz Image" class="max-w-lg w-full mx-auto mb-4 rounded-lg shadow-md border-2 border-gray-300 dark:border-gray-600" />\`;
                        }

                        let caseHTML = '';
                        if (q.caseDescription && (index === 0 || q.caseDescription !== scorableQuizData[index - 1].caseDescription)) {
                            caseHTML = \`<div class="case-card"><h3 class="title">\${translations.caseScenario}</h3><p class="body">\${q.caseDescription}</p></div>\`;
                        }
                        
                        const optionsHTML = q.options.map((opt, optIndex) => \`<label class="option-label block" for="q\${index}o\${optIndex}"><input type="radio" id="q\${index}o\${optIndex}" name="q\${index}" value="\${optIndex}" class="hidden"> \${String.fromCharCode(65 + optIndex)}. \${opt}</label>\`).join('');
                        
                        quizContentContainer.innerHTML = \`\${imageHTML}\${caseHTML}<div class="question-card p-6 rounded-lg"><p class="font-bold text-base sm:text-lg mb-4"> \${q.question}</p><div class="options space-y-3" data-question-index="\${index}">\${optionsHTML}</div><div id="feedback-area-\${index}" class="mt-4"></div></div>\`;
                        
                        const optionsElement = quizContentContainer.querySelector('.options');
                        if (userAnswers[index] !== null) {
                            const radio = quizContentContainer.querySelector(\`input[value="\${userAnswers[index]}"]\`);
                            if(radio) radio.checked = true;
                            showFeedback(index);
                        } else {
                            if(optionsElement) optionsElement.addEventListener('change', handleOptionSelection);
                        }
                        updateNavigationButtons();
                        updateProgressBar();
                    }

                    function showFeedback(index) {
                        const q = scorableQuizData[index];
                        const userAnswer = userAnswers[index];
                        const isCorrect = userAnswer === q.correctAnswerIndex;
                        const feedbackArea = document.getElementById(\`feedback-area-\${index}\`);
                        const quizContentContainer = document.getElementById('quiz-content');
                        const optionsContainer = quizContentContainer.querySelector('.options');
                        if(optionsContainer) optionsContainer.removeEventListener('change', handleOptionSelection);
                        optionsContainer.querySelectorAll('input').forEach(input => input.disabled = true);
                        
                        const selectedLabel = optionsContainer.querySelector(\`label[for="q\${index}o\${userAnswer}"]\`);
                        
                        if (isCorrect) {
                            if (selectedLabel) selectedLabel.classList.add('correct-answer-feedback');
                        } else {
                            if (selectedLabel) selectedLabel.classList.add('incorrect-answer-feedback');
                            const correctLabel = optionsContainer.querySelector(\`label[for="q\${index}o\${q.correctAnswerIndex}"]\`);
                            if (correctLabel) correctLabel.classList.add('correct-answer-feedback');
                        }
                        
                        const explanationHTML = q.explanation ? \`<div class="explanation-box"><h4 class="title">\${translations.explanation}</h4><p class="body">\${q.explanation.replace(/\\n/g, '<br/>')}</p></div>\` : '';
                        if(feedbackArea) feedbackArea.innerHTML = explanationHTML;
                        updateNavigationButtons();
                    }

                    function handleOptionSelection(e) {
                        const questionIndex = parseInt(e.currentTarget.dataset.questionIndex);
                        userAnswers[questionIndex] = parseInt(e.target.value);
                        showFeedback(questionIndex);
                    }
                    
                    function finishQuiz() {
                        clearInterval(timerInterval);
                        const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
                        const score = scorableQuizData.reduce((s, q, i) => s + (userAnswers[i] === q.correctAnswerIndex ? 1 : 0), 0);
                        const total = scorableQuizData.length;
                        const percentage = total > 0 ? (score / total) * 100 : 0;
                        
                        pages.results.innerHTML = \`<div class="text-center mb-8"><h2 class="text-3xl font-bold mb-2 font-tajawal">\${translations.quizComplete}</h2></div><div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 text-center mb-8"><p class="text-xl mb-2 text-gray-700 dark:text-gray-300 font-tajawal">\${translations.yourScore}</p><p id="score-text" class="text-5xl font-bold text-teal-500">\${score} / \${total}</p><p id="score-percentage" class="text-lg font-medium text-gray-500 dark:text-gray-400 mt-1">(\${percentage.toFixed(1)}%)</p></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><button id="review-answers-btn" class="btn-primary font-bold py-3 px-4 rounded-lg font-tajawal">\${translations.reviewAnswers}</button><button id="retake-quiz-btn" class="btn-primary font-bold py-3 px-4 rounded-lg font-tajawal">\${translations.retakeQuiz}</button><button id="exit-btn" class="sm:col-span-2 btn-secondary font-bold py-3 px-4 rounded-lg font-tajawal">\${translations.exitToMainMenu}</button></div>\`;
                        
                        document.getElementById('review-answers-btn').addEventListener('click', () => { loadReviewContent(); showPage('review'); });
                        document.getElementById('retake-quiz-btn').addEventListener('click', startQuiz);
                        document.getElementById('exit-btn').addEventListener('click', () => {
                             window.parent.postMessage({ type: 'quiz-finished', payload: { score, total, percentage, timeTaken } }, '*');
                        });
                        
                        showPage('results');
                    }

                    function loadReviewContent() {
                        const content = scorableQuizData.map((q, index) => {
                            const isCorrect = userAnswers[index] === q.correctAnswerIndex;
                            const optionsHTML = q.options.map((opt, optIndex) => \`<div class="option-label block \${optIndex === q.correctAnswerIndex ? 'correct-answer' : ''} \${!isCorrect && optIndex === userAnswers[index] ? 'incorrect-answer' : ''}">\${String.fromCharCode(65 + optIndex)}. \${opt}</div>\`).join('');
                            const explanationHTML = q.explanation ? \`<div class="explanation-box mt-4"><h4 class="title">\${translations.explanation}</h4><p class="body">\${q.explanation.replace(/\\n/g, '<br/>')}</p></div>\` : '';
                             let imageHTML = '';
                            if (typeof q.refersToUploadedImageIndex === 'number' && q.refersToUploadedImageIndex >= 0 && selectedImageFiles[q.refersToUploadedImageIndex]) {
                                imageHTML = \`<img src="\${selectedImageFiles[q.refersToUploadedImageIndex]}" alt="Quiz Image" class="max-w-md mx-auto mb-4 rounded-lg shadow-md" />\`;
                            }
                            return \`<div class="question-card p-6 rounded-lg review">\${imageHTML}<p class="font-bold text-lg mb-2">\${index + 1}. \${q.question}</p><div class="options space-y-3">\${optionsHTML}</div>\${explanationHTML}</div>\`;
                        }).join('');

                        pages.review.innerHTML = \`<h2 class="text-3xl font-bold mb-6 text-center font-tajawal">\${translations.reviewAnswersTitle}</h2><div class="space-y-6">\${content}</div><button id="back-to-results-btn" class="btn-primary w-full font-bold py-3 px-4 rounded-lg mt-6 font-tajawal">\${translations.backToResults}</button>\`;
                        document.getElementById('back-to-results-btn').addEventListener('click', () => showPage('results'));
                    }
                    
                    function loadBasmajaContent() {
                        const content = quizData.map((q, index) => {
                             const optionsHTML = q.options.map((opt, optIndex) => \`<div class="option-label block \${optIndex === q.correctAnswerIndex ? 'basmaja-correct-answer' : ''}">\${String.fromCharCode(65 + optIndex)}. \${opt}</div>\`).join('');
                             const explanationHTML = q.explanation ? \`<div class="explanation-box mt-4"><h4 class="title">\${translations.explanation}</h4><p class="body">\${q.explanation.replace(/\\n/g, '<br/>')}</p></div>\` : '';
                             const flawedTag = q.isFlawed ? \`<div class="flawed-tag">Flawed Question</div>\` : '';
                             return \`<div class="question-card p-6 rounded-lg mb-6">\${flawedTag}<p class="font-bold text-lg mb-4">\${index + 1}. \${q.question}</p><div class="options space-y-3">\${optionsHTML}</div>\${explanationHTML}</div>\`;
                        }).join('');
                        pages.basmaja.innerHTML = \`<h2 class="text-3xl font-bold mb-6 text-center font-tajawal">📚 \${translations.fastSummary}</h2><div id="basmaja-container" class="space-y-6">\${content}</div><button id="back-to-start-from-basmaja-btn" class="btn-secondary w-full font-bold py-3 px-4 rounded-lg mt-6 font-tajawal">\${translations.exitToMainMenu}</button>\`;
                        document.getElementById('back-to-start-from-basmaja-btn').addEventListener('click', () => window.parent.postMessage('quiz-exit', '*'));
                    }

                    function applyCopyProtection() {
                        const protectedElements = document.querySelectorAll('.protected-content');
                        const watermark = '\\n\\n---\\nتم إنشاء هذا المحتوى بواسطة تطبيق مولد الاختبارات الذكي - AHMED AL3NANY';

                        protectedElements.forEach(element => {
                            // الطبقة الأولى: منع القص بالكامل
                            element.addEventListener('cut', (e) => {
                                e.preventDefault();
                            });
                            
                            // الطبقة الثانية: اعتراض النسخ وتعديل المحتوى
                            element.addEventListener('copy', (e) => {
                                const selection = window.getSelection();
                                // تأكد من وجود حافظة و نص محدد
                                if (!selection || !e.clipboardData) return;
                                
                                const selectedText = selection.toString();
                                const watermarkedText = selectedText + watermark;

                                // ضع النص المعدل في الحافظة
                                e.clipboardData.setData('text/plain', watermarkedText);
                                // امنع السلوك الافتراضي للنسخ (نسخ النص الأصلي)
                                e.preventDefault();
                            });
                        });
                    }

                    function startQuiz() {
                        if (scorableQuizData.length === 0) { alert(translations.noValidQuestions); return; }
                        userAnswers.fill(null);
                        currentQuestionIndex = 0;
                        pages.quiz.innerHTML = \`<div id="quiz-header" class="flex justify-between items-center mb-4 text-sm"><span id="question-counter"></span><span id="quiz-timer"></span></div><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6"><div id="progress-bar" class="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style="width:0%"></div></div><div id="quiz-content"></div><div class="flex flex-col sm:flex-row justify-between gap-4 mt-6"><button id="prev-question-btn" class="btn-secondary font-bold py-3 px-4 rounded-lg flex-1 font-tajawal">\${translations.previousQuestion}</button><button id="next-question-btn" class="btn-primary font-bold py-3 px-4 rounded-lg flex-1 font-tajawal">\${translations.nextQuestion}</button><button id="finish-quiz-btn" class="btn-primary font-bold py-3 px-4 rounded-lg flex-1 hidden font-tajawal">\${translations.finishQuiz}</button></div>\`;
                        document.getElementById('prev-question-btn').addEventListener('click', () => displayQuestion(currentQuestionIndex - 1));
                        document.getElementById('next-question-btn').addEventListener('click', () => displayQuestion(currentQuestionIndex + 1));
                        document.getElementById('finish-quiz-btn').addEventListener('click', finishQuiz);
                        displayQuestion(0);
                        startTimer();
                        showPage('quiz');
                    }

                    function init() {
                        pages.landing.innerHTML = \`<h1 class="text-3xl sm:text-4xl font-bold mb-2 font-tajawal">\${quizTitle}</h1><h2 class="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-4 font-tajawal">Scientific Quiz</h2><p class="mb-8 font-tajawal">\${translations.transformContentToQuiz}</p><div class="flex flex-col sm:flex-row gap-4 justify-center mb-8"><button id="start-quiz-btn" class="btn-primary font-bold py-3 px-8 rounded-lg text-lg font-tajawal">\${translations.startQuiz}</button><button id="basmaja-btn" class="btn-secondary font-bold py-3 px-8 rounded-lg text-lg font-tajawal">💡 \${translations.fastSummary}</button></div>\`;
                        document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);
                        document.getElementById('basmaja-btn').addEventListener('click', () => { loadBasmajaContent(); showPage('basmaja'); });
                        showPage('landing');
                        applyCopyProtection(); // تطبيق الحماية عند بدء التشغيل
                    }

                    init();
                </script>
            </body>
            </html>
        `;
    }, [quiz, settings.theme, settings.uiLanguage, t]);

    return (
        <iframe
            srcDoc={htmlContent}
            style={{ width: '100%', height: '100vh', border: 'none', position: 'fixed', top: 0, left: 0, zIndex: 100 }}
            title={quiz.quizTitle}
            sandbox="allow-scripts allow-same-origin"
        />
    );
};

export default QuizInterface;