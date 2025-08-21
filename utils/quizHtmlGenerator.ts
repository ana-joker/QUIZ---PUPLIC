// src/utils/quizHtmlGenerator.ts
import { Quiz } from '../types';

export const generateQuizHtml = (quiz: Quiz, title: string = "Quiz Result"): string => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 800px;
                margin: 20px auto;
                padding: 20px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .question {
                background-color: #f9f9f9;
                border: 1px solid #ddd;
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 20px;
            }
            .question-text {
                font-weight: bold;
                font-size: 1.1em;
                margin-bottom: 10px;
            }
            .options-list {
                list-style: none;
                padding: 0;
            }
            .option-item {
                margin-bottom: 8px;
                padding: 8px;
                border-radius: 4px;
                background-color: #eee;
            }
            .correct-answer {
                background-color: #d4edda; /* Light green */
                border-color: #28a745; /* Green */
                font-weight: bold;
            }
            .explanation {
                font-size: 0.9em;
                color: #555;
                margin-top: 10px;
                padding-left: 10px;
                border-left: 3px solid #007bff;
            }
            .quiz-header {
                text-align: center;
                margin-bottom: 30px;
            }
            .quiz-header h1 {
                font-size: 2.5em;
                color: #333;
            }
            .quiz-header p {
                font-size: 1.1em;
                color: #666;
            }
            /* Dark Mode styles (optional, requires JS to toggle) */
            @media (prefers-color-scheme: dark) {
                body {
                    background-color: #2d3748;
                    color: #e2e8f0;
                }
                .container {
                    background: #1a202c;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                }
                .question {
                    background-color: #2d3748;
                    border-color: #4a5568;
                }
                .question-text {
                    color: #e2e8f0;
                }
                .option-item {
                    background-color: #4a5568;
                    color: #e2e8f0;
                }
                .correct-answer {
                    background-color: #48bb78; /* Green */
                    border-color: #2f855a; /* Darker green */
                }
                .explanation {
                    color: #cbd5e0;
                    border-left: 3px solid #63b3ed; /* Blue */
                }
                .quiz-header h1 {
                    color: #e2e8f0;
                }
                .quiz-header p {
                    color: #cbd5e0;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="quiz-header">
                <h1>${quiz.quizTitle || title}</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            ${quiz.quizData.map((q, qIndex) => `
                <div class="question">
                    <p class="question-text">${qIndex + 1}. ${q.question}</p>
                    <ul class="options-list">
                        ${q.options.map((option, oIndex) => `
                            <li class="option-item ${(q.questionType === 'MCQ' || q.questionType === 'TrueFalse') && option === q.correctAnswer ? 'correct-answer' : ''}">
                                ${String.fromCharCode(65 + oIndex)}. ${option}
                            </li>
                        `).join('')}
                    </ul>
                    ${q.explanation ? `
                        <div class="explanation">
                            <strong>Explanation:</strong> ${q.explanation}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    </body>
    </html>
  `;
  return htmlContent;
};
