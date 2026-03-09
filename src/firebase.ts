import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB8QYI68vHaHQiAFBHTUqtjKgINMSkhxdk",
  authDomain: "neulibtrack-900fe.firebaseapp.com",
  projectId: "neulibtrack-900fe",
  storageBucket: "neulibtrack-900fe.firebasestorage.app",
  messagingSenderId: "430145162869",
  appId: "1:430145162869:web:88e3260374b20c4ae7f23c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
