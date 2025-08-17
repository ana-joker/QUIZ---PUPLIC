
import { GoogleGenAI, Type, Part, GenerateContentResponse } from "@google/genai";
import { AppSettings, Quiz, Question } from '../types';

export const getDocumentText = async (file: File): Promise<string> => {
    // A more robust PDF parsing would be needed for production.
    // Using a library like pdf.js is recommended.
    // This is a placeholder implementation.
    if (file.type === 'application/pdf') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
                try {
                    // Dynamically import and use pdf.js
                    const pdfJS = await import('https://esm.sh/pdfjs-dist@4.4.168');
                    // @ts-ignore
                    pdfJS.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs`;
                    
                    const pdf = await pdfJS.getDocument(typedarray).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map((item: any) => item.str).join(' ');
                    }
                    resolve(text);
                } catch (error) {
                    console.error('Error parsing PDF:', error);
                    reject('Could not extract text from PDF. The file might be corrupted or image-based.');
                }
            };
            reader.onerror = () => reject('Failed to read the file.');
            reader.readAsArrayBuffer(file);
        });
    } else if (file.type.startsWith('text/')) {
        return file.text();
    }
    return `Content from file: ${file.name}`;
};


export const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      mimeType: file.type,
      data: await base64EncodedDataPromise,
    },
  };
};

export const generateQuizContent = async (
  prompt: string,
  subject: string,
  settings: AppSettings,
  file: File | null,
  images: File[],
  imageUsage: 'auto' | 'link' | 'about'
): Promise<Quiz> => {
  
    if (!settings.apiKey && !process.env.API_KEY) {
      throw new Error("API Key not found. Please set your Gemini API key in the settings menu.");
    }
    
    const ai = new GoogleGenAI({ apiKey: settings.apiKey || process.env.API_KEY });

    // The new UI is primarily for MCQs.
    const selectedQuestionTypes = ['MCQ'];

    const schema = {
        type: Type.OBJECT,
        properties: {
            quizTitle: { type: Type.STRING, description: `A creative and relevant title for the quiz in ${settings.quizLanguage}.` },
            quizData: {
                type: Type.ARRAY,
                description: `An array of all generated quiz question objects.`,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        questionType: { type: Type.STRING, description: "Type of question. Should be 'MCQ'.", enum: ["MCQ"] },
                        question: { type: Type.STRING, description: `The question text, in ${settings.quizLanguage}.` },
                        options: {
                            type: Type.ARRAY,
                            description: `Array of 4 option strings in ${settings.quizLanguage}.`,
                            items: { type: Type.STRING }
                        },
                        correctAnswer: {
                            type: Type.STRING,
                            description: `The correct answer string, which must be one of the provided options. All text must be in ${settings.quizLanguage}.`,
                        },
                        explanation: { type: Type.STRING, description: `Detailed, multi-part explanation IN ${settings.explanationLanguage} following the protocol (simple why, practical example, key takeaway).` },
                        caseDescription: { type: Type.STRING, description: `Optional: A case study, scenario, or context for the question, in ${settings.quizLanguage}. If this question belongs to a case, this field MUST contain the full case text.` },
                        refersToUploadedImageIndex: { type: Type.INTEGER, description: "Optional: The 0-based index of the uploaded image this question refers to. Omit if not an image-based question." },
                        isFlawed: { type: Type.BOOLEAN, description: "Set to true if the question is flawed and could not be fixed according to internal critique." }
                    },
                    required: ["questionType", "question", "options", "correctAnswer", "explanation"]
                }
            }
        },
        required: ["quizTitle", "quizData"]
    };

    const fileContent = file ? await getDocumentText(file) : null;
    
    let imageInstruction = "";
    if (images.length > 0) {
        const numImgQ = parseInt(settings.numImageQuestions, 10);
        if (isNaN(numImgQ) || numImgQ <= 0) {
            imageInstruction = ""; // No image questions requested
        } else {
            let instructionText = "";
            switch (imageUsage) {
                case 'link':
                    instructionText = `You MUST generate exactly ${numImgQ} question(s) that require the user to analyze the provided images in conjunction with the provided text content.`;
                    break;
                case 'about':
                    instructionText = `You MUST generate exactly ${numImgQ} question(s) that are directly about the visual content of the provided images.`;
                    break;
                case 'auto':
                default:
                    instructionText = `Generate ${numImgQ} question(s) based on the provided images. Use your expert judgment to decide the best pedagogical approach: either by asking questions that require synthesizing information from both the text and images, or by asking questions that focus solely on interpreting the images' content.`;
                    break;
            }
            imageInstruction = `
# Image-Based Question Instructions
- You have been provided with ${images.length} image(s). They are 0-indexed.
- ${instructionText}
- For these questions, the 'question' text must clearly refer to the image (e.g., "Based on the first X-ray...", "In the image of the cell (image 1)...").
- You MUST set 'refersToUploadedImageIndex' to the 0-based index of the image being used for all questions that use an image.`;
        }
    }

    const mainContentPrompt = prompt 
        ? `\n\nUser's specific text content: "${prompt}"` 
        : (fileContent 
            ? `\n\nGenerate the quiz from this document:\n---BEGIN DOCUMENT---\n${fileContent}\n---END DOCUMENT---` 
            : (images.length > 0 ? '\n\nGenerate the quiz *exclusively* from the provided image(s).' : ''));

    const generationPrompt = `
// AI Execution Protocol: Version 2.9 (Interface 6.0 - Advanced Multi-Image Integration)

# Primary Directive
Your primary function is to act as an expert medical examinations author. You will generate high-quality Multiple-Choice Questions (MCQs) and detailed Case Scenarios based *exclusively* on the provided scientific text and/or images. All information must be derived from the provided content. The final output must be a single JSON object adhering to the schema.

# Input
- Scientific text and/or up to 5 Images: The sole source of information.
- Configuration: Detailed instructions on the number and type of questions, and how to use images.

# Protocol 1: Content Generation
## Objective
Generate MCQs and Case Scenarios based on the user's configuration.

## Rules
1.  **Structure (Case Scenario):**
    - **Vignette:** A detailed, realistic case (3-8 lines) integrating facts from the text.
    - **Associated MCQs:** Each case must be followed by the specified number of MCQs that test analysis and decision-making based on the case.
    - **Data Integrity:** For every question associated with a case, the 'caseDescription' property in the JSON object *must* contain the full text of the case vignette.

2.  **Structure (Standalone MCQ):**
    - **Question Stem:** Clear, concise problem.
    - **Options:** Exactly 4 options. One is the single best answer based on the text. The other three (distractors) must be plausible but incorrect according to the text.

3.  **Content Evaluation (Critical):**
    - **Image & Text Cohesion:** If both text and image(s) are provided, first critically assess their relationship. If they are unrelated (e.g., text about pharmacology, one image of a skin rash, another of an ECG), DO NOT force a connection. Generate questions about each source independently based on the user's requested question counts.
    - **Image Referencing:** When a question is about one of the provided images, you MUST set the 'refersToUploadedImageIndex' property to the correct 0-based index of that image. For example, if a question refers to the first uploaded image, set 'refersToUploadedImageIndex' to 0.
    - **No External Knowledge:** Generate questions and explanations *only* from the provided material. Do not introduce outside information.

4.  **Language & Quality:**
    - Generate all content (questions, options, explanations) in the specified 'Quiz Language'.
    - The 'explanation' must be in the specified 'Explanation Language'.
    - **No Textual References:** Strictly forbid phrases like "According to the text...", "As mentioned in the document...", or "Based on the provided material..." in question stems. Questions must be answerable from the content itself, not by referencing the source's existence.

# Protocol 2: Validation & Audit
## Objective
Internally critique each generated question for correctness, clarity, and adherence to all rules. Mark questions that are unfixably flawed.

## Rules
1.  **Source-Grounded Validation:** For each question, internally verify that the designated 'correctAnswer' is the *only* option directly supported by the source text/image, and the 'explanation' is a faithful summary of the reasoning in the source.
2.  **Flaw Tagging:** If a question cannot be generated that meets all criteria (e.g., source text is ambiguous or insufficient), mark it as flawed by setting 'isFlawed' to true. It is better to have fewer, high-quality questions than to produce flawed ones.

# Final Generation Task
Based on the user's provided content and settings, generate a single JSON object.

## User Configuration
- Subject: '${subject || 'the provided content'}'
- Quiz Language: ${settings.quizLanguage}
- Explanation Language: ${settings.explanationLanguage}
- Difficulty: '${settings.difficulty}'
- **Standalone MCQs to Generate**: ${settings.numMCQs}
- **Case Scenarios to Generate**: ${settings.numCases}
- **MCQs per Case Scenario**: ${settings.questionsPerCase}
${settings.additionalInstructions ? `\n- Additional Instructions: "${settings.additionalInstructions}"` : ''}

## User Content & Image Instructions
${mainContentPrompt}
${imageInstruction}

# Output Format
The output MUST be a single JSON object that strictly adheres to the provided schema. Do not include any extra text, formatting, or markdown backticks.`;

  const promptParts: Part[] = [{ text: generationPrompt }];
  if (images.length > 0) {
    for (const imageFile of images) {
        promptParts.push(await fileToGenerativePart(imageFile));
    }
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: promptParts },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: settings.temperature,
            topP: settings.topP,
            topK: settings.topK,
        },
    });

    const jsonText = response.text.trim();
    let parsedQuiz: Quiz;
    try {
        parsedQuiz = JSON.parse(jsonText);
    } catch(e) {
        console.error("Failed to parse JSON from model:", jsonText);
        throw new Error("The AI model returned an invalid response. Please try again.");
    }
    

    // Post-processing to add correctAnswerIndex for the quiz interface
    const processedQuizData = parsedQuiz.quizData.map((q: Question) => {
        if (q.questionType === 'MCQ' || q.questionType === 'TrueFalse') {
            const correctIndex = q.options.findIndex(opt => typeof q.correctAnswer === 'string' && opt.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim());
            return { ...q, correctAnswerIndex: correctIndex > -1 ? correctIndex : 0 };
        }
        return { ...q, correctAnswerIndex: -1 };
    });


    return { ...parsedQuiz, quizData: processedQuizData };

  } catch(error) {
    console.error("Gemini API call failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('API key') || errorMessage.includes('403')) {
        throw new Error("The provided API Key is invalid or has insufficient permissions. Please check the key in settings.");
    }
    if (errorMessage.includes('400') || errorMessage.includes('responseSchema')) {
        throw new Error("The model could not generate content that matches the requested format. Please try simplifying your request or reducing the number of questions.");
    }
    if (errorMessage.includes('503') || errorMessage.includes('unavailable')) {
        throw new Error("The AI service is temporarily unavailable. Please try again later.");
    }
    throw new Error(`Failed to generate quiz. Please check your inputs and try again. Error: ${errorMessage}`);
  }
};