// src/services/indexedDbService.ts
import { openDB, IDBPDatabase } from 'idb';
import { Quiz } from '../types';

const DB_NAME = 'QuizAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'quizzes'; // to store quizzes

let db: IDBPDatabase;

async function initDB() {
  if (!db) {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return db;
}

/**
 * Saves a quiz object to IndexedDB.
 * An 'id' and saved date will be added automatically if they don't exist.
 * @param quizData The full quiz data object.
 * @returns The unique ID of the saved quiz.
 */
export async function saveQuizToIndexedDB(quizData: any): Promise<number> {
  const database = await initDB();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const quizToSave = {
    ...quizData,
    id: quizData.id || undefined, // If quizData has an ID, use it, otherwise let IndexedDB create it
    savedAt: quizData.savedAt || new Date().toISOString()
  };

  const id = await store.put(quizToSave);
  await transaction.done;
  console.log('Quiz saved to IndexedDB:', quizToSave);
  return id as number;
}

/**
 * Retrieves all saved quizzes from IndexedDB.
 * @returns An array of quiz objects.
 */
export async function getQuizzesFromIndexedDB(): Promise<any[]> {
  const database = await initDB();
  return database.getAll(STORE_NAME);
}

/**
 * Retrieves a specific quiz from IndexedDB by its ID.
 * @param id The ID of the quiz.
 * @returns The quiz object or undefined if not found.
 */
export async function getQuizByIdFromIndexedDB(id: number): Promise<any | undefined> {
  const database = await initDB();
  return database.get(STORE_NAME, id);
}

/**
 * Deletes a specific quiz from IndexedDB by its ID.
 * @param id The ID of the quiz to delete.
 */
export async function deleteQuizFromIndexedDB(id: number): Promise<void> {
  const database = await initDB();
  await database.delete(STORE_NAME, id);
  console.log('Quiz deleted from IndexedDB:', id);
}