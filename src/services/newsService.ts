import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { News } from '../types';
import { handleFirestoreError, OperationType } from './resourceService';

const COLLECTION_NAME = 'news';

export const getNews = async (): Promise<News[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as News[];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    return [];
  }
};

export const addNews = async (newsData: Omit<News, 'id' | 'createdAt'>) => {
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      ...newsData,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
};

export const updateNews = async (id: string, newsData: Partial<News>) => {
  try {
    const newsRef = doc(db, COLLECTION_NAME, id);
    const { id: _, createdAt, ...data } = newsData as any;
    await updateDoc(newsRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
};

export const deleteNews = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
};
