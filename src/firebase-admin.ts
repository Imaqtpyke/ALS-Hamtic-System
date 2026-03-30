import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import serviceAccount from '../als-4f9bb-firebase-adminsdk-fbsvc-d6745736c8.json';

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount as any)
});

export const auth = getAuth(app);
export const db = getFirestore(app);

// Function to set custom claims for a user
export const setUserRole = async (uid: string, role: 'student' | 'admin') => {
  try {
    await auth.setCustomUserClaims(uid, { role });
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return false;
  }
};

// Function to get user role
export const getUserRole = async (uid: string) => {
  try {
    const user = await auth.getUser(uid);
    return user.customClaims?.role || 'student';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'student';
  }
}; 