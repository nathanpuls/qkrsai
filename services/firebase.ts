import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDFP5GAwTNqLyaySh_t_2j8NFiulHTeFy8",
  authDomain: "fwdng-1d5f9.firebaseapp.com",
  databaseURL: "https://fwdng-1d5f9.firebaseio.com",
  projectId: "fwdng-1d5f9",
  storageBucket: "fwdng-1d5f9.firebasestorage.app",
  messagingSenderId: "250477002363",
  appId: "1:250477002363:web:95a89409c8d5991a9aacde"
};

// Initialize Firebase using singleton pattern
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db: Database = getDatabase(app);
const BASE_PATH = 'qkrsai';

export const subscribeToPage = (
  pageName: string, 
  callback: (content: string) => void,
  onError?: (error: any) => void
) => {
  const pageRef = ref(db, `${BASE_PATH}/${pageName}`);
  return onValue(pageRef, (snapshot) => {
    const data = snapshot.val();
    // Support both direct strings and object-wrapped content
    const content = typeof data === 'string' ? data : (data?.content || '');
    callback(content);
  }, (error) => {
    console.error("Firebase Sync Error:", error);
    if (onError) onError(error);
  });
};

export const updatePageContent = async (pageName: string, content: string) => {
  const pageRef = ref(db, `${BASE_PATH}/${pageName}`);
  try {
    await set(pageRef, content);
  } catch (error) {
    console.error("Firebase Update Error:", error);
    throw error;
  }
};

export const getPageContent = async (pageName: string): Promise<string> => {
  const pageRef = ref(db, `${BASE_PATH}/${pageName}`);
  try {
    const snapshot = await get(pageRef);
    const data = snapshot.val();
    return typeof data === 'string' ? data : (data?.content || '');
  } catch (error) {
    console.error("Firebase Fetch Error:", error);
    throw error;
  }
};