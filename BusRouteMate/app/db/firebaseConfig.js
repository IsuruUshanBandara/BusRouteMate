import { initializeApp,getApp,getApps} from 'firebase/app';
// import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getAuth,initializeAuth,getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import {getDatabase}from 'firebase/database';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyADk3v7kJXBLSPKeQMRgM415D6E1kUcik8",
  authDomain: "bus-route-mate.firebaseapp.com",
  projectId: "bus-route-mate",
  storageBucket: "bus-route-mate.firebasestorage.app",
  messagingSenderId: "211407313322",
  appId: "1:211407313322:web:5fd614cfb87f3f8fa273d3", 
  databaseURL:"https://bus-route-mate-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

export { auth, db, realtimeDb };
