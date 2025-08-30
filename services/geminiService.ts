
import { AppSettings, Quiz, User } from '../types';

// The backend service is responsible for handling Gemini API calls.
// This URL should point to your deployed backend (e.g., on Railway).
// It's recommended to set this as an environment variable `BACKEND_URL` in your deployment environment (e.g., Vercel).
const BACKEND_URL = process.env.BACKEND_URL || 'https://quiz-time-backend-production.up.railway.app';

export const generateQuizContent = (
  prompt: string,
  subject: string, // subject is not used in the UI, but part of the function signature
  settings: AppSettings,
  file: File | null,
  images: File[],
  imageUsage: 'auto' | 'link' | 'about',
  onUploadProgress: (progress: { loaded: number; total: number }) => void
): Promise<{ quiz: Quiz, user: User }> => {
  return new Promise((resolve, reject) => {
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

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BACKEND_URL}/generate-quiz`, true);

      const deviceId = localStorage.getItem('deviceId');
      if (deviceId) {
          xhr.setRequestHeader('x-device-id', deviceId);
      }

      xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
              onUploadProgress({ loaded: event.loaded, total: event.total });
          }
      };

      xhr.onload = () => {
          try {
              const responseData = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) {
                  if (responseData.quiz && responseData.user) {
                      resolve({ quiz: responseData.quiz as Quiz, user: responseData.user as User });
                  } else {
                      reject(new Error("Invalid response from server: missing quiz or user data."));
                  }
              } else {
                  const errorMsg = responseData.error || `Request failed with status ${xhr.status}`;
                  reject(new Error(errorMsg));
              }
          } catch (e) {
              reject(new Error("Failed to parse server response."));
          }
      };

      xhr.onerror = () => {
          reject(new Error("Could not connect to the quiz generation service. Please check your internet connection and try again."));
      };
      
      xhr.ontimeout = () => {
          reject(new Error("The request timed out. The server is taking too long to respond."));
      };

      xhr.send(formData);
  });
};
