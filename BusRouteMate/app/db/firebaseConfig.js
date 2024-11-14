import { initializeApp,getApp,getApps} from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// import { 
//   API_KEY, 
//   AUTH_DOMAIN, 
//   PROJECT_ID, 
//   STORAGE_BUCKET, 
//   MESSAGING_SENDER_ID, 
//   APP_ID 
// } from '@env';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADk3v7kJXBLSPKeQMRgM415D6E1kUcik8",
  authDomain: "bus-route-mate.firebaseapp.com",
  projectId: "bus-route-mate",
  storageBucket: "bus-route-mate.firebasestorage.app",
  messagingSenderId: "211407313322",
  appId: "1:211407313322:web:5fd614cfb87f3f8fa273d3"
  // apiKey: API_KEY,
  // authDomain: AUTH_DOMAIN,
  // projectId: PROJECT_ID,
  // storageBucket: STORAGE_BUCKET,
  // messagingSenderId: MESSAGING_SENDER_ID,
  // appId: APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with persistence using AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
