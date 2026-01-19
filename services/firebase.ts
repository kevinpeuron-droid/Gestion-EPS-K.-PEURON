import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  collection, 
  addDoc,
  onSnapshot,
  query,
  where,
  Timestamp
} from 'firebase/firestore';

// NOTE: In a real environment, replace these with process.env.REACT_APP_FIREBASE_...
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForTemplate",
  authDomain: "eps-analytics.firebaseapp.com",
  projectId: "eps-analytics",
  storageBucket: "eps-analytics.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize only if not already initialized (singleton pattern safe)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable Offline Persistence
// Note: This might fail in privacy mode or multiple tabs, so we catch errors.
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence not supported by browser');
    }
  });
} catch (e) {
  // Ignore in non-browser environments or if already enabled
}

export { db, collection, addDoc, onSnapshot, query, where, Timestamp };