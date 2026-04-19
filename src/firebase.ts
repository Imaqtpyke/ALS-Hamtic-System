import { getApps, getApp, initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCGzXtAx8K9AhlpEvij9ZMTHQAsQoaLpVc",
  authDomain: "als-4f9bb.firebaseapp.com",
  projectId: "als-4f9bb",
  storageBucket: "als-4f9bb.firebasestorage.app",
  messagingSenderId: "589465220684",
  appId: "1:589465220684:web:20a2842810d31ddefa66e9",
  measurementId: "G-RL1F9H1Z1L"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Connect to auth emulator in development
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, 'http://localhost:9099');
// }

// Error handling wrapper
export const handleFirebaseError = (error: any) => {
  throw new Error(error.message || 'An error occurred with Firebase');
};

// Password reset function
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    handleFirebaseError(error);
  }
};

// Email verification function
export const sendVerificationEmail = async () => {
  const user = auth.currentUser;
  if (user && !user.emailVerified) {
    try {
      await sendEmailVerification(user);
    } catch (error) {
      handleFirebaseError(error);
    }
  }
};

// Update user profile
export const updateUserProfile = async (displayName: string, photoURL?: string) => {
  const user = auth.currentUser;
  if (user) {
    try {
      await updateProfile(user, {
        displayName,
        photoURL
      });
    } catch (error) {
      handleFirebaseError(error);
    }
  }
}; 