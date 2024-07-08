// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "soapdelight-6f8b6.firebaseapp.com",
  projectId: "soapdelight-6f8b6",
  storageBucket: "soapdelight-6f8b6.appspot.com",
  messagingSenderId: "656409918532",
  appId: "1:656409918532:web:97916f1dab6b80824cd011"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);