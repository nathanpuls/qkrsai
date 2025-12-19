
/**
 * Firebase service layer for Realtime Database integration.
 * Uses modular Firebase JS SDK (v10+).
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue, set, get, Database } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyDFP5GAwTNqLyaySh_t_2j8NFiulHTeFy8",
  authDomain: "fwdng-1d5f9.firebaseapp.com",
  databaseURL: "https://fwdng-1d5f9.firebaseio.com",
  projectId: "fwdng-1d5f9",
  storageBucket: "fwdng-1d5f9.firebasestorage.app",
  messagingSenderId: "250477002363",
  appId: "1:250477002363:web:95a89409c8d5991a9aacde"
};

let app: any;
let db: Database;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (e) {
  console.warn("Firebase initialization failed. Using mock storage.", e);
}

/**
 * Root path for database entries. 
 * As requested: "qkrsai" in all lowercase.
 */
const BASE_PATH = 'qkrsai';

export const subscribeToPage = (
  pageName: string, 
  callback: (content: string) => void,
  onError?: (error: any) => void
) => {
  if (!db) return () => {};
  const pageRef = ref(db, `${BASE_PATH}/${pageName}`);
  return onValue(pageRef, (snapshot) => {
    const data = snapshot.val();
    callback(typeof data === 'string' ? data : (data?.content || ''));
  }, (error) => {
    console.error("Firebase Subscription Error:", error);
    if (onError) onError(error);
  });
};

export const updatePageContent = async (pageName: string, content: string) => {
  if (!db) {
    localStorage.setItem(`${BASE_PATH}/${pageName}`, content);
    return;
  }
  const pageRef = ref(db, `${BASE_PATH}/${pageName}`);
  try {
    await set(pageRef, content);
  } catch (error) {
    console.error("Firebase Update Error:", error);
    throw error;
  }
};

export const getPageContent = async (pageName: string): Promise<string> => {
  if (!db) {
    return localStorage.getItem(`${BASE_PATH}/${pageName}`) || '';
  }
  const pageRef = ref(db, `${BASE_PATH}/${pageName}`);
  try {
    const snapshot = await get(pageRef);
    return snapshot.val() || '';
  } catch (error) {
    console.error("Firebase Get Error:", error);
    throw error;
  }
};
