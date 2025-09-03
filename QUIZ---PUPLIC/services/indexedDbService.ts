// src/services/indexedDbService.ts
import { openDB, IDBPDatabase } from 'idb';
import { Quiz } from '../types';

const DB_NAME = 'QuizAppDB';
const DB_VERSION = 2; // Incremented version to trigger upgrade
const STORE_NAME = 'quizzes'; // to store quizzes

let db: IDBPDatabase;

async function initDB() {
  if (!db) {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // This upgrade path handles the transition from a potentially incorrect
        // schema (with keyPath) to the correct one (without keyPath).
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains(STORE_NAME)) {
            db.deleteObjectStore(STORE_NAME);
          }
          // Create the object store without a keyPath, allowing explicit key provision.
          // This is the "out-of-line keys" approach, which resolves the error.
          db.createObjectStore(STORE_NAME);
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
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

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
  return database.getAll(STORE_NAME);
}

/**
 * Retrieves a specific quiz from IndexedDB by its ID.
 * @param id The string ID of the quiz.
 * @returns The quiz object or undefined if not found.
 */
export async function getQuizByIdFromIndexedDB(id: number | string): Promise<Quiz | undefined> {
  const database = await initDB();
  return database.get(STORE_NAME, String(id));
}

/**
 * Deletes a specific quiz from IndexedDB by its ID.
 * @param id The string ID of the quiz to delete.
 */
export async function deleteQuizFromIndexedDB(id: number | string): Promise<void> {
  const database = await initDB();
  await database.delete(STORE_NAME, String(id));
  console.log('Quiz deleted from IndexedDB:', id);
}