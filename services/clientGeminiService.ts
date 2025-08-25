import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Grades a short answer question using the Gemini API.
 * @param question The quiz question.
 * @param correctAnswer The expected correct answer.
 * @param userAnswer The user's submitted answer.
 * @returns A promise that resolves to a boolean indicating if the answer is correct.
 */
export const gradeShortAnswer = async (
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<boolean> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an intelligent quiz grading assistant. Evaluate the user's answer for the following question.

**Question:** "${question}"
**Expected Correct Answer:** "${correctAnswer}"
**User's Answer:** "${userAnswer}"

Is the user's answer semantically correct? It does not have to be an exact match, but it should convey the same core meaning and contain the key information from the expected answer.

Respond with JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: {
              type: Type.BOOLEAN,
              description: 'Whether the user answer is semantically correct.',
            },
          },
          required: ['isCorrect'],
        },
      },
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    return result.isCorrect === true;
  } catch (error) {
    console.error("Error grading short answer with AI:", error);
    // Fallback to strict comparison in case of API error
    return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  }
};
