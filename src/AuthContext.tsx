import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider, resetPassword, sendVerificationEmail, updateUserProfile } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError,
  UserCredential
} from 'firebase/auth';
import { handleFirebaseError } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface UserRole {
  role: 'student' | 'admin';
  isVerified: boolean;
}

interface AuthContextType {
  user: (FirebaseUser & { role?: UserRole }) | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, isAdmin: boolean) => Promise<UserCredential>;
  loginWithGoogle: () => Promise<UserCredential>;
  register: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateProfile: (displayName: string, photoURL?: string) => Promise<void>;
  resendVerification: (email: string, password: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = ((globalThis as any).__ALS_AUTH_CONTEXT__ as ReturnType<typeof createContext<AuthContextType | undefined>> | undefined)
  ?? createContext<AuthContextType | undefined>(undefined);
(globalThis as any).__ALS_AUTH_CONTEXT__ = AuthContext;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(FirebaseUser & { role?: UserRole }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Force refresh the Firebase ID token to get updated custom claims (like role)
          await firebaseUser.getIdToken(true);

          // Get or create user in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data() as UserRole & { email?: string; displayName?: string };
            // Keep Firestore isVerified in sync with actual Firebase emailVerified
            const currentVerified = !!firebaseUser.emailVerified;

            // Enforce verification for students only; admins may sign in without email verification
            if (userData.role === 'student' && !currentVerified) {
              await signOut(auth);
              setUser(null);
              setError('Account not verified. Please check your email.');
              setLoading(false);
              return;
            }

            if (userData.isVerified !== currentVerified) {
              try {
                await updateDoc(userRef, {
                  isVerified: currentVerified,
                  updatedAt: new Date().toISOString(),
                });
              } catch (firestoreErr) {
                if (import.meta.env.DEV) {
                  console.warn('[AuthContext] Firestore profile sync skipped (permissions):', firestoreErr);
                }
              }
            }
            const roleData: UserRole = { role: userData.role, isVerified: currentVerified };
            setUser({ ...firebaseUser, role: roleData });
            if (import.meta.env.DEV) {
              console.log('AuthContext setUser (with role):', { uid: firebaseUser.uid, email: firebaseUser.email, role: userData });
            }
          } else {
            // Auto-create user document for new users (default to student)
            const newUser = {
              role: 'student',
              isVerified: firebaseUser.emailVerified,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            // Create user in Firestore
            await setDoc(userRef, newUser);
            
            // Force refresh the Firebase ID token to get updated custom claims (like role)
            await firebaseUser.getIdToken(true);

            // Enforce verification for students (new accounts are unverified by default)
            if (!firebaseUser.emailVerified) {
              await signOut(auth);
              setUser(null);
              setError('Account not verified. Please check your email.');
              setLoading(false);
              return;
            }

            setUser({ ...firebaseUser, role: { role: 'student', isVerified: firebaseUser.emailVerified || false } });
            if (import.meta.env.DEV) {
              console.log('AuthContext auto-created user:', { uid: firebaseUser.uid, ...newUser });
            }
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setError(error instanceof Error ? error.message : 'An error occurred');
        }
      } else {
        setUser(null);
        if (import.meta.env.DEV) {
          console.log('User logged out');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const login = async (email: string, password: string, isAdmin: boolean) => {
    if (import.meta.env.DEV) {
      console.log('Login function called');
    }
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Ensure we have the latest emailVerified state
      await userCredential.user.reload();
      const emailVerified = !!userCredential.user.emailVerified;

      // Get or create user doc
      const userRef = doc(db, 'users', userCredential.user.uid);
      let userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          role: 'student',
          isVerified: emailVerified,
          email,
          displayName: userCredential.user.displayName || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        userDoc = await getDoc(userRef);
      }
       
      const userData = userDoc.data() as UserRole;

      if (isAdmin && userData.role !== 'admin') {
        await signOut(auth);
        throw new Error('Access denied. Admin login required.');
      }

      if (!isAdmin && userData.role !== 'student') {
        await signOut(auth);
        throw new Error('Access denied. Student login required.');
      }

      // Enforce verification for students only; admins may sign in without email verification
      if (userData.role === 'student' && !emailVerified) {
        await signOut(auth);
        throw new Error('Account not verified. Please check your email.');
      }

      // Force refresh the Firebase ID token to get updated custom claims (like role)
      await userCredential.user.getIdToken(true);

      // Persist the verification state to Firestore if it changed
      if (userData.isVerified !== emailVerified) {
        await updateDoc(userRef, { isVerified: emailVerified, updatedAt: new Date().toISOString() });
      }

      // Update local state with user data
      const userWithRole = { ...userCredential.user, role: { role: userData.role, isVerified: emailVerified } };
      setUser(userWithRole);
      
      if (import.meta.env.DEV) {
        console.log('Login successful:', { uid: userCredential.user.uid, role: userData.role });
      }
      return userCredential;
    } catch (error) {
      try {
        await signOut(auth);
      } catch {}
      setUser(null);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Login error:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          role: 'student',
          isVerified: user.emailVerified,
          email: user.email || '',
          displayName: user.displayName || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Force refresh the Firebase ID token to get updated custom claims (like role)
      await user.getIdToken(true);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Google login error:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      if (auth.currentUser) {
        await updateUserProfile(displayName);
      }
      
      // Send verification email
      await sendVerificationEmail();
      
      // Create user document in Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        role: 'student',
        isVerified: false,
        email,
        displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Force refresh the Firebase ID token to get updated custom claims (like role)
      await userCredential.user.getIdToken(true);

      // Do not allow unverified users to stay signed in
      await signOut(auth);
      setUser(null);

      return userCredential;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Registration error:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      if (import.meta.env.DEV) {
        console.log('User logged out');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Logout error:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await resetPassword(email);
    } catch (error) {
      handleFirebaseError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    try {
      setLoading(true);
      setError(null);
      await sendVerificationEmail();
    } catch (error) {
      handleFirebaseError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  // Resend verification by temporarily signing in to obtain a valid user context,
  // then immediately sign out. Useful when login is blocked by unverified status.
  const resendVerification = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await cred.user.reload();
      if (cred.user.emailVerified) {
        // Already verified; nothing to send
        return;
      }
      await sendVerificationEmail();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Failed to resend verification email';
      setError(errMsg);
      throw error;
    } finally {
      try { await signOut(auth); } catch {}
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (displayName: string, photoURL?: string) => {
    try {
      setLoading(true);
      setError(null);
      await updateUserProfile(displayName, photoURL);
    } catch (error) {
      handleFirebaseError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error, 
        login, 
        loginWithGoogle,
        register, 
        logout, 
        resetPassword: handleResetPassword,
        sendVerificationEmail: handleSendVerificationEmail,
        updateProfile: handleUpdateProfile,
        resendVerification,
        clearError 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};