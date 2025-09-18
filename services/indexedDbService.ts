// src/services/indexedDbService.ts
import { openDB, IDBPDatabase } from 'idb';
import { Quiz } from '../types';


let db: IDBPDatabase;

async function initDB() {
  if (!db) {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains(QUIZZES_STORE)) {
            db.deleteObjectStore(QUIZZES_STORE);
          }
          db.createObjectStore(QUIZZES_STORE);
        }
        if (oldVersion < 3) {
          db.createObjectStore(SETTINGS_STORE);
        }
        if (oldVersion < 4) {
          db.createObjectStore(API_KEYS_STORE);
          db.createObjectStore(UI_STATE_STORE);
        }
      },
    });
  }
  return db;
}

/**
 * Saves a quiz object to IndexedDB.
 * A string 'id' and saved date will be added automatically if they don't exist.
 * @param quizData The full quiz data object.
 * @returns The unique string ID of the saved quiz.
 */
export async function saveQuizToIndexedDB(quizData: Quiz): Promise<string> {
  const database = await initDB();
  const transaction = database.transaction(QUIZZES_STORE, 'readwrite');
  const store = transaction.objectStore(QUIZZES_STORE);

  // Create a unique string key if it doesn't exist
  const idToUse: string = quizData.id ? String(quizData.id) : `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const quizToSave = {
    ...quizData,
    id: idToUse,
    savedAt: quizData.savedAt || new Date().toISOString()
  };

  // Pass the object and the key separately to store.put, as required for out-of-line keys.
  await store.put(quizToSave, idToUse);
  await transaction.done;
  console.log('Quiz saved to IndexedDB:', quizToSave);
  return idToUse;
}

/**
 * Retrieves all saved quizzes from IndexedDB.
 * @returns An array of quiz objects.
 */
export async function getQuizzesFromIndexedDB(): Promise<Quiz[]> {
  const database = await initDB();
  return database.getAll(QUIZZES_STORE);
}

/**
 * Retrieves a specific quiz from IndexedDB by its ID.
 * @param id The string ID of the quiz.
 * @returns The quiz object or undefined if not found.
 */
export async function getQuizByIdFromIndexedDB(id: number | string): Promise<Quiz | undefined> {
  const database = await initDB();
  return database.get(QUIZZES_STORE, String(id));
}

/**
 * Deletes a specific quiz from IndexedDB by its ID.
 * @param id The string ID of the quiz to delete.
 */
export async function deleteQuizFromIndexedDB(id: number | string): Promise<void> {
  const database = await initDB();
  await database.delete(QUIZZES_STORE, String(id));
  console.log('Quiz deleted from IndexedDB:', id);
}

/**
 * Saves user settings to IndexedDB.
 * @param settings The settings object to save.
 * @param userId The user ID or 'guest' for guests.
 */
export async function saveSettingsToIndexedDB(settings: any, userId: string = 'guest'): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction(SETTINGS_STORE, 'readwrite');
  const store = transaction.objectStore(SETTINGS_STORE);

  const settingsToSave = {
    ...settings,
    savedAt: new Date().toISOString()
  };

  await store.put(settingsToSave, userId);
  await transaction.done;
  console.log('Settings saved to IndexedDB for user:', userId);
}

/**
 * Retrieves user settings from IndexedDB.
 * @param userId The user ID or 'guest' for guests.
 * @returns The settings object or undefined if not found.
 */
export async function getSettingsFromIndexedDB(userId: string = 'guest'): Promise<any | undefined> {
  const database = await initDB();
  return database.get(SETTINGS_STORE, userId);
}

/**
 * Generates a SHA-256 hash of the quiz options for caching.
 * @param options The options object (settings, prompt, file metadata, etc.).
 * @returns The hex string hash.
 */
export async function generateOptionsHash(options: any): Promise<string> {
  const data = JSON.stringify(options);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks if a quiz with the given options hash exists in IndexedDB.
 * @param optionsHash The hash of the quiz options.
 * @returns The quiz object if found and not expired, otherwise undefined.
 */
export async function checkQuizExists(optionsHash: string): Promise<Quiz | undefined> {
  const database = await initDB();
  const quiz = await database.get(QUIZZES_STORE, optionsHash);
  if (quiz && quiz.expiresAt) {
    if (new Date() > new Date(quiz.expiresAt)) {
      // Expired, delete it
      await database.delete(QUIZZES_STORE, optionsHash);
      return undefined;
    }
  }
  return quiz;
}

/**
 * Saves a quiz with options hash as key and TTL.
 * @param quizData The quiz data.
 * @param optionsHash The hash key.
 * @param ttlHours Time to live in hours (default 24).
 */
export async function saveQuizWithHash(quizData: Quiz, optionsHash: string, ttlHours: number = 24): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction(QUIZZES_STORE, 'readwrite');
  const store = transaction.objectStore(QUIZZES_STORE);

  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  const quizToSave = {
    ...quizData,
    optionsHash,
    expiresAt,
    savedAt: new Date().toISOString()
  };

  await store.put(quizToSave, optionsHash);
  await transaction.done;
  console.log('Quiz saved with hash to IndexedDB:', optionsHash);
}

/**
 * Simple encryption key (in production, use a secure key derivation).
 */
const ENCRYPTION_KEY = 'quiz-app-encryption-key-2024';

/**
 * Encrypts data using AES-GCM.
 * @param data The data to encrypt.
 * @returns The encrypted data as base64 string.
 */
async function encryptData(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ENCRYPTION_KEY),
    'AES-GCM',
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(data)
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts data using AES-GCM.
 * @param encryptedData The encrypted data as base64 string.
 * @returns The decrypted data.
 */
async function decryptData(encryptedData: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ENCRYPTION_KEY),
    'AES-GCM',
    false,
    ['decrypt']
  );
  const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  return new TextDecoder().decode(decrypted);
}

/**
 * Saves an encrypted API key to IndexedDB.
 * @param apiKey The API key to save.
 * @param userId The user ID.
 */
export async function saveApiKey(apiKey: string, userId: string): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction(API_KEYS_STORE, 'readwrite');
  const store = transaction.objectStore(API_KEYS_STORE);

  const encryptedKey = await encryptData(apiKey);
  const dataToSave = {
    encryptedKey,
    savedAt: new Date().toISOString()
  };

  await store.put(dataToSave, userId);
  await transaction.done;
  console.log('API key saved to IndexedDB for user:', userId);
}

/**
 * Retrieves and decrypts an API key from IndexedDB.
 * @param userId The user ID.
 * @returns The decrypted API key or undefined if not found.
 */
export async function getApiKey(userId: string): Promise<string | undefined> {
  const database = await initDB();
  const data = await database.get(API_KEYS_STORE, userId);
  if (data) {
    try {
      return await decryptData(data.encryptedKey);
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return undefined;
    }
  }
  return undefined;
}

/**
 * Saves UI state to IndexedDB.
 * @param state The UI state object.
 * @param componentId The component identifier (e.g., 'quizCreator').
 */
export async function saveUiState(state: any, componentId: string): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction(UI_STATE_STORE, 'readwrite');
  const store = transaction.objectStore(UI_STATE_STORE);

  const stateToSave = {
    ...state,
    savedAt: new Date().toISOString()
  };

  await store.put(stateToSave, componentId);
  await transaction.done;
  console.log('UI state saved to IndexedDB for component:', componentId);
}

/**
 * Retrieves UI state from IndexedDB.
 * @param componentId The component identifier.
 * @returns The UI state object or undefined if not found.
 */
export async function getUiState(componentId: string): Promise<any | undefined> {
  const database = await initDB();
  return database.get(UI_STATE_STORE, componentId);
}

/**
 * Cleans up expired quizzes from IndexedDB.
 */
export async function cleanupExpiredData(): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction(QUIZZES_STORE, 'readwrite');
  const store = transaction.objectStore(QUIZZES_STORE);
  const cursor = await store.openCursor();

  while (cursor) {
    const quiz = cursor.value;
    if (quiz.expiresAt && new Date() > new Date(quiz.expiresAt)) {
      await cursor.delete();
      console.log('Expired quiz deleted:', cursor.key);
    }
    await cursor.continue();
  }

  await transaction.done;
}
