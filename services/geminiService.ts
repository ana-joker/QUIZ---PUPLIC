
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
  
    if (!process.env.API_KEY) {
      throw new Error("API Key not found. Please ensure it is set in the environment variables.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
                        questionType: {
                            type: Type.STRING,
                            description: "Type of question. Must be one of the requested types.",
                            enum: ["MCQ", "TrueFalse", "ShortAnswer", "Ordering", "Matching"]
                        },
                        question: { type: Type.STRING, description: `The question text, in ${settings.quizLanguage}.` },
                        options: {
                            type: Type.ARRAY,
                            description: `Array of options. For MCQ/TrueFalse, it holds the choices. For Ordering, it holds the items to be ordered. For Matching, it holds the prompts. For ShortAnswer, it's an empty array.`,
                            items: { type: Type.STRING }
                        },
                        matchOptions: {
                            type: Type.ARRAY,
                            description: `Optional: Array of answer items for Matching questions.`,
                            items: { type: Type.STRING }
                        },
                        correctAnswer: {
                            type: Type.STRING,
                            description: `The correct answer. For MCQ, TrueFalse, and ShortAnswer, this is a string. For Ordering and Matching questions, this MUST be a JSON.stringified array. For Ordering, it's a string array. For Matching, it's an array of {prompt, answer} objects.`,
                        },
                        explanation: { type: Type.STRING, description: `Detailed, multi-part explanation IN ${settings.explanationLanguage}.` },
                        caseDescription: { type: Type.STRING, description: `Optional: A case study, scenario, or context for the question, in ${settings.quizLanguage}.` },
                        refersToUploadedImageIndex: { type: Type.INTEGER, description: "Optional: The 0-based index of the uploaded image this question refers to." },
                        isFlawed: { type: Type.BOOLEAN, description: "Set to true if the question is flawed." }
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

    const allQuestionTypes = ["MCQ", "TrueFalse", "ShortAnswer", "Ordering", "Matching"];

    const generationPrompt = `
// AI Execution Protocol: Version 3.2 (Adaptive Quiz Generation with Multi-Type Questions & Deterministic Answer Distribution)

# Primary Directive
Your primary function is to act as an expert examinations author. You will generate high-quality questions based *exclusively* on the provided content. The questions will be of the types explicitly requested by the user. All information must be derived from the provided content. The final output must be a single JSON object adhering to the schema.

# Input
- Content: Scientific text and/or Images. This is the sole source of information.
- Configuration: Detailed instructions on the number and type of questions, and how to use images.

# Protocol 0: Content Domain Analysis & Role Adaptation
## Objective
Analyze the provided 'User Content' to infer its primary domain (e.g., Medical, Engineering, General Science, Humanities, etc.). Adapt your role and question generation style to match the rigor, terminology, and typical question patterns of that specific domain.

## Rules
1.  **Domain Inference:** Before generating any questions, perform a rapid internal analysis of the 'User Content'. Identify keywords, concepts, and typical structures to determine if it is:
    -   **Medical Content:** Characterized by medical terminology, diseases, treatments, anatomy, physiology, clinical cases, patient scenarios.
    -   **Engineering Content:** Characterized by technical specifications, design principles, calculations, systems, processes, materials, schematics.
    -   **General Science Content:** Characterized by scientific principles, theories, experiments, natural phenomena, formulas (but not necessarily complex engineering applications).
    -   **Other (Default):** If none of the above, treat it as general academic or factual content.
2.  **Role Adaptation:**
    -   **If Medical Content:** Adopt the role of an "expert medical examinations author specializing in the provided medical sub-domain (e.g., Gynecology, Cardiology, etc., infer from text if not explicit)". Focus on clinical reasoning, diagnosis, management, pathophysiology, and high-stakes information. Case Scenarios are highly applicable.
    -   **If Engineering Content:** Adopt the role of an "expert engineering examinations author specializing in the provided engineering sub-domain". Focus on problem-solving, application of formulas, system analysis, design considerations, and technical specifications. Case Scenarios might be less common but can be adapted for design problems or failure analysis.
    -   **If General Science Content:** Adopt the role of an "expert science educator". Focus on understanding concepts, principles, experimental design, and data interpretation. Case Scenarios are less common.
    -   **If Other (Default):** Adopt the role of a "general academic quiz master". Focus on factual recall, conceptual understanding, and logical inference.
3.  **Terminology and Tone:** Use domain-specific terminology accurately and maintain the appropriate academic/professional tone for the inferred domain. Avoid mixing terminologies or styles from different domains.

# Protocol 1: Content Generation (Multi-Type Questions & Case Scenarios)
## Objective
Generate questions based on the user's configuration, strictly adhering to the inferred domain's rigor, terminology, and content sourcing, and **incorporating ALL requested question types.**

## Rules for Question Types (General):
1.  **Structure:** Each question must adhere to the specific structure of its \`questionType\`.
2.  **Content Adherence:** All parts of the question (stem, options, correct answer, distractors, case description) must be directly derived or logically inferred *only* from the provided content. No outside information.
3.  **Quality:** Use clear, precise domain-specific language. Avoid ambiguity.
4.  **Absolute Prohibition of Textual References in Standalone Questions:**
    -   **Forbidden phrases in Question Stem (Standalone):** "According to the text", "Based on the provided content", "As per the document", "In the given text", "From the information provided", "According to the diagnostic criteria mentioned", "According to the study", "as mentioned in the text", "per the text", "as described in the text", "from the text", "in the text", "as per the information", "based on the information".
    -   **Sole Exception:** These phrases ARE allowed within Case Scenario questions to refer to the "case" itself (e.g., "Based on this case", "According to the patient's presentation"), NOT the general text.

## Specific Rules for Each Question Type:
1.  **MCQ (Multiple Choice Questions):**
    -   **Question Stem:** Clear, concise problem or mini-case.
    -   **Options:** Exactly 4 plausible options (A, B, C, D). One is the single best correct answer; three are plausible distractors.
    -   **\`correctAnswer\`:** The exact string of the correct option.
2.  **TrueFalse:**
    -   **Question Stem:** A statement that is either true or false based on the content.
    -   **Options:** Must be \`["True", "False"]\`.
    -   **\`correctAnswer\`:** Either "True" or "False".
3.  **ShortAnswer:**
    -   **Question Stem:** A direct question requiring a concise factual answer.
    -   **Options:** Empty array \`[]\`.
    -   **\`correctAnswer\`:** The precise factual string answer.
4.  **Ordering:**
    -   **Question Stem:** A prompt asking the user to arrange a list of items in a specific logical or chronological order.
    -   **Options:** An array of strings representing the items to be ordered (unshuffled).
    -   **\`correctAnswer\`:** An array of strings representing the items in the *correct* order.
5.  **Matching:**
    -   **Question Stem:** A prompt asking the user to match items from one list (prompts) to another (answers).
    -   **Options:** An array of strings representing the 'prompts' (e.g., definitions, terms).
    -   **\`matchOptions\`:** An array of strings representing the 'answers' (e.g., corresponding terms, concepts).
    -   **\`correctAnswer\`:** An array of objects \`[{ prompt: string, answer: string }]\` representing the correct pairs.

## Rules for Case Scenarios (Applicability depends on inferred domain):
1.  **Structure:** Each Case Scenario MUST be followed by 2 to 3 associated questions (of the requested types) based *solely* on that case.
2.  **Vignette/Scenario Description:** Detailed, realistic (3-8 lines) patient description for medical, or a detailed problem/system description for engineering/science. Include relevant context, data, or observations. Narration must be fluid and integrated.
3.  **Content Adherence (Vignette):** All details in the scenario description must be derived *only* from the provided content. You may invent non-factual scenario details (e.g., specific names, dates for context) to link concepts from the text, but you CANNOT invent domain-specific facts (diagnoses, specific results, treatments, technical specifications) not mentioned in the provided text.

# Protocol 2: Internal Answer Distribution Correction (Deterministic & Balanced)
## Objective
After generating all MCQs (including True/False treated as MCQs), you MUST internally analyze and modify the correct answer positions to ensure a deterministic and balanced distribution for MCQs (and True/False), minimizing excessive repetition of any single position within short ranges.

## Process (Step-by-Step Logic - Internal Execution for MCQ/TrueFalse):
1.  **Compile relevant MCQs:** Create an internal ordered list of ALL MCQs and True/False questions generated.
2.  **Iterate and Adjust:** Start analyzing from the 4th question in this compiled list (index 3 if 0-indexed).
    For each current question (let's call it question \`i\`, where \`i >= 3\`):
    a.  Define a 4-question window: Questions from \`i-3\` to \`i\`.
    b.  Count the frequency of each answer position (A, B, C, D) within this 4-question window. (For True/False, 'True' can be A, 'False' can be B).
    c.  Identify if any single answer position \`P\` has occurred more than twice in this window.
    d.  If such a position \`P\` is found:
        i.   Locate the *first* question \`j\` within the window (\`i-3 <= j <= i\`) whose correct answer position is \`P\`.
        ii.  Determine a \`NewPos\` (the deterministically optimized new position):
            1.  Calculate the frequency of each position (A, B, C, D) in the 4-question window *excluding* question \`j\` itself.
            2.  Find the position with the *lowest* frequency among the remaining positions.
            3.  If multiple positions have the same lowest frequency, choose the alphabetically earliest position (A before B, B before C, etc.).
            4.  This position is \`NewPos\`.
        iii. **Crucially:** Internally swap the *content* of the current correct option (at position \`P\`) with the *content* of the option at \`NewPos\` within question \`j\`'s options array.
        iv.  Update question \`j\`'s \`correctAnswer\` (string) to reflect the new option content at \`NewPos\`.
        v.   Update question \`j\`'s \`correctAnswerIndex\` to reflect the new index of \`NewPos\`.
        vi.  (Self-correction): Re-evaluate the window after this adjustment if needed for subsequent questions, ensuring the logic remains consistent.
    e.  Proceed to the next question (\`i+1\`) and repeat.
3.  **Ensure Full Balance:** Continue this process until the end of the compiled question list, guaranteeing a balanced and deterministic distribution of correct answers across all relevant questions.

# Final Generation Task
Based on the user's provided content and settings, and after performing the internal content generation and answer distribution correction, generate a single JSON object that strictly adheres to the provided schema. Do not include any extra text, formatting, or markdown backticks.

## User Configuration
- Subject: '${subject || 'the provided content'}'
- Quiz Language: ${settings.quizLanguage}
- Explanation Language: ${settings.explanationLanguage}
- Difficulty: '${settings.difficulty}'
- **Requested Question Types**: [${(settings.questionTypes.length > 0 ? settings.questionTypes : allQuestionTypes).map(type => `'${type}'`).join(', ')}] // IMPORTANT: Use these types!
- **Standalone MCQs to Generate**: ${settings.numMCQs}
- **Case Scenarios to Generate**: ${settings.numCases}
- **MCQs per Case Scenario**: ${settings.questionsPerCase}
${settings.additionalInstructions ? `\n- Additional Instructions: "${settings.additionalInstructions}"` : ''}

## User Content & Image Instructions
${mainContentPrompt}
${imageInstruction}`;

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
    

    // Post-processing to add correctAnswerIndex and parse stringified answers
    const processedQuizData = parsedQuiz.quizData.map((q: Question) => {
        let processedQuestion = { ...q };

        // 1. Parse correctAnswer for array-based types
        if (q.questionType === 'Ordering' || q.questionType === 'Matching') {
            try {
                // The model returns a stringified JSON, so we parse it.
                processedQuestion.correctAnswer = JSON.parse(q.correctAnswer as string);
            } catch (e) {
                console.warn(`Could not parse correctAnswer for ${q.questionType}:`, q.correctAnswer);
                // Mark as flawed if parsing fails, as it's unusable
                processedQuestion.isFlawed = true; 
            }
        }

        // 2. Add correctAnswerIndex for MCQ/TrueFalse for the UI
        if (processedQuestion.questionType === 'MCQ') {
            const correctIndex = processedQuestion.options.findIndex(opt => 
                typeof processedQuestion.correctAnswer === 'string' && 
                opt.toLowerCase().trim() === (processedQuestion.correctAnswer as string).toLowerCase().trim()
            );
            processedQuestion.correctAnswerIndex = correctIndex > -1 ? correctIndex : 0;
        } else if (processedQuestion.questionType === 'TrueFalse') {
            // For TrueFalse, 'True' is usually index 0 and 'False' is index 1
            if (typeof processedQuestion.correctAnswer === 'string') {
                const normalizedCorrectAnswer = processedQuestion.correctAnswer.toLowerCase().trim();
                if (normalizedCorrectAnswer === 'true') {
                    processedQuestion.correctAnswerIndex = 0;
                } else if (normalizedCorrectAnswer === 'false') {
                    processedQuestion.correctAnswerIndex = 1;
                } else {
                    // Fallback if the answer is neither 'true' nor 'false'
                    console.warn(`TrueFalse question has an unexpected correct answer: ${processedQuestion.correctAnswer}`);
                    processedQuestion.correctAnswerIndex = -1; // Mark as invalid
                    processedQuestion.isFlawed = true;
                }
            } else {
                console.warn(`TrueFalse question has a non-string correct answer:`, processedQuestion.correctAnswer);
                processedQuestion.correctAnswerIndex = -1;
                processedQuestion.isFlawed = true;
            }
        } else {
            processedQuestion.correctAnswerIndex = -1;
        }
        
        return processedQuestion;
    });


    return { ...parsedQuiz, quizData: processedQuizData };

  } catch(error) {
    console.error("Gemini API call failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('API key') || errorMessage.includes('403')) {
        throw new Error("The provided API Key is invalid or has insufficient permissions. Please check the key in the environment variables.");
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
