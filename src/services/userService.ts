import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { User } from '../types';

const COLLECTION_NAME = 'users';

export const getUserProfile = async (uid: string) => {
  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const createUserProfile = async (firebaseUser: any, additionalData?: { college?: string; course?: string }) => {
  try {
    const userRef = doc(db, COLLECTION_NAME, firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const newUser: Omit<User, 'createdAt'> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        role: (firebaseUser.email === 'amanmaurya9.AM@gmail.com' || firebaseUser.email === 'mycollegegenie@gmail.com') ? 'admin' : 'user',
        ...additionalData
      };
      
      await setDoc(userRef, {
        ...newUser,
        createdAt: serverTimestamp()
      });
      
      return newUser;
    } else if (additionalData) {
      // Update existing profile if additional data is provided (e.g. during signup)
      await setDoc(userRef, { ...additionalData }, { merge: true });
      return { ...(userSnap.data() as User), ...additionalData };
    }
    return userSnap.data() as User;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
};
