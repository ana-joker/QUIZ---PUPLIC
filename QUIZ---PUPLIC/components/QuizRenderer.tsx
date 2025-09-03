import React from 'react';
import { Quiz, Question, QuestionType } from '../types';

interface QuizRendererProps {
  quizData: Quiz; // Expecting the full Quiz object
}

const QuizRenderer: React.FC<QuizRendererProps> = ({ quizData }) => {
  if (!quizData || !quizData.quizData || quizData.quizData.length === 0) {
    return <div className="text-slate-400">No quiz data to display.</div>;
  }

  return (
    <div className="space-y-8">
      {quizData.quizTitle && (
        <h1 className="text-3xl font-bold text-purple-500 mb-6">{quizData.quizTitle}</h1>
      )}
      {quizData.quizData.map((question: Question, index: number) => (
        <div key={index} className="bg-slate-800 p-6 rounded-lg shadow-md">
          <p className="text-lg font-semibold mb-3 text-slate-200">{index + 1}. {question.question}</p>

          {question.questionType === 'MCQ' && (
            <div className="space-y-2">
              {question.options && question.options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center">
                  <input
                    type="radio"
                    id={`q${index}-opt${optIndex}`}
                    name={`question-${index}`}
                    className="form-radio h-4 w-4 text-purple-600 transition duration-150 ease-in-out"
                    disabled // This component is for rendering, not answering
                  />
                  <label htmlFor={`q${index}-opt${optIndex}`} className="ml-2 text-slate-300">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          )}

          {question.questionType === 'TrueFalse' && (
            <div className="space-y-2">
              <div className="flex items-center">
                <input type="radio" id={`q${index}-true`} name={`question-${index}`} className="form-radio h-4 w-4 text-purple-600" disabled />
                <label htmlFor={`q${index}-true`} className="ml-2 text-slate-300">True</label>
              </div>
              <div className="flex items-center">
                <input type="radio" id={`q${index}-false`} name={`question-${index}`} className="form-radio h-4 w-4 text-purple-600" disabled />
                <label htmlFor={`q${index}-false`} className="ml-2 text-slate-300">False</label>
              </div>
            </div>
          )}

          {question.questionType === 'ShortAnswer' && (
            <div className="mt-2">
              <input
                type="text"
                className="w-full p-2 rounded-md bg-slate-700 text-slate-50 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Short Answer (disabled)"
                disabled
              />
            </div>
          )}

          {question.questionType === 'Ordering' && (
            <div className="mt-2 space-y-2">
              <p className="text-slate-300">Order the following:</p>
              {question.options && question.options.map((item, itemIndex) => (
                <div key={itemIndex} className="bg-slate-700 p-2 rounded-md text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          )}

          {question.questionType === 'Matching' && (
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="font-medium text-slate-300">Prompts:</p>
                {question.options && question.options.map((item, itemIndex) => (
                  <div key={itemIndex} className="bg-slate-700 p-2 rounded-md text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="font-medium text-slate-300">Matches:</p>
                {question.matchOptions && question.matchOptions.map((item, itemIndex) => (
                  <div key={itemIndex} className="bg-slate-700 p-2 rounded-md text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {question.caseDescription && (
            <div className="mt-4 p-4 bg-slate-700 rounded-md text-slate-300">
              <h3 className="font-semibold mb-2">Case Description:</h3>
              <p>{question.caseDescription}</p>
            </div>
          )}

          {/* Assuming image questions would have a URL or base64 in question.question or a specific field */}
          {/* For now, just a placeholder if refersToUploadedImageIndex is present */}
          {question.refersToUploadedImageIndex !== undefined && (
            <div className="mt-4 p-4 bg-slate-700 rounded-md text-slate-300">
              <h3 className="font-semibold mb-2">Image Question:</h3>
              <p>Image would be displayed here (index: {question.refersToUploadedImageIndex})</p>
              {/* You would typically render an <img> tag here, possibly using a base64 string from quizData.selectedImageFiles */}
            </div>
          )}

          {/* Display correct answer and explanation (optional, for review mode) */}
          {/* This part can be conditionally rendered based on a prop, e.g., showAnswers */}
          {/*
          <div className="mt-4 text-sm text-green-400">
            <p>Correct Answer: {question.correctAnswer}</p>
            <p>Explanation: {question.explanation}</p>
          </div>
          */}
        </div>
      ))}
    </div>
  );
};

export default QuizRenderer;
