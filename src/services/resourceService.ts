import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, serverTimestamp, Timestamp, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { Resource, ResourceType } from '../types';

const COLLECTION_NAME = 'resources';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const uploadFile = async (file: File) => {
  try {
    const storageRef = ref(storage, `resources/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const uploadResource = async (resourceData: Omit<Resource, 'id' | 'ratings' | 'reports' | 'uploadDate'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      isApproved: false, // Default to false, admin needs to approve
      ...resourceData,
      ratings: [],
      reports: [],
      uploadDate: new Date().toISOString().split('T')[0],
      uploaderId: auth.currentUser?.uid
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
};

export const getResources = async (includeUnapproved = false, course?: string, semester?: number, type?: ResourceType) => {
  try {
    let q = query(collection(db, COLLECTION_NAME));
    
    if (!includeUnapproved) {
      q = query(q, where('isApproved', '==', true));
    }

    if (course && course !== 'All Courses') {
      q = query(q, where('course', '==', course));
    }
    if (semester) {
      q = query(q, where('semester', '==', semester));
    }
    if (type && type !== 'All' as any) {
      q = query(q, where('type', '==', type));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Resource[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
};

export const approveResource = async (resourceId: string) => {
  try {
    const resourceRef = doc(db, COLLECTION_NAME, resourceId);
    await updateDoc(resourceRef, { isApproved: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${resourceId}`);
  }
};

export const deleteResource = async (resourceId: string) => {
  try {
    const resourceRef = doc(db, COLLECTION_NAME, resourceId);
    await deleteDoc(resourceRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${resourceId}`);
  }
};

export const updateResource = async (resourceId: string, resourceData: Partial<Resource>) => {
  try {
    const resourceRef = doc(db, COLLECTION_NAME, resourceId);
    const { id: _, ...data } = resourceData as any;
    await updateDoc(resourceRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${resourceId}`);
  }
};

export const rateResource = async (resourceId: string, rating: number) => {
  try {
    const resourceRef = doc(db, COLLECTION_NAME, resourceId);
    await updateDoc(resourceRef, {
      ratings: arrayUnion(rating)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${resourceId}`);
  }
};

export const reportResource = async (resourceId: string, reason: string) => {
  try {
    const resourceRef = doc(db, COLLECTION_NAME, resourceId);
    await updateDoc(resourceRef, {
      reports: arrayUnion({ reason, date: new Date().toISOString() })
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${resourceId}`);
  }
};
