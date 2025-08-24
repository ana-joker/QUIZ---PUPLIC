import { AppSettings, Quiz } from '../types';

// The backend service is responsible for handling Gemini API calls.
// This URL should point to your deployed backend (e.g., on Railway).
const BACKEND_URL = 'https://quiz-time-backend-production.up.railway.app';

export const generateQuizContent = async (
  prompt: string,
  subject: string, // subject is not used in the UI, but part of the function signature
  settings: AppSettings,
  file: File | null,
  images: File[],
  imageUsage: 'auto' | 'link' | 'about'
): Promise<Quiz> => {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('settings', JSON.stringify(settings));
  formData.append('imageUsage', imageUsage);

  if (file) {
    formData.append('file', file);
  }

  images.forEach(imageFile => {
    formData.append('images', imageFile);
  });

  try {
    const response = await fetch(`${BACKEND_URL}/generate-quiz`, {
      method: 'POST',
      body: formData,
      // Headers are not strictly necessary for FormData with fetch, 
      // as the browser sets the 'Content-Type' to 'multipart/form-data' automatically.
    });

    const responseData = await response.json();

    if (!response.ok) {
      // If the backend provides a specific error message, use it.
      const errorMsg = responseData.error || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }
    
    // The backend already processes the quiz data, so we can return it directly.
    return responseData as Quiz;

  } catch (error) {
    console.error("Backend API call failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Provide more user-friendly error messages based on common issues
    if (errorMessage.includes('Failed to fetch')) {
        throw new Error("Could not connect to the quiz generation service. Please check your internet connection and try again.");
    }

    throw new Error(`Failed to generate quiz: ${errorMessage}`);
  }
};
