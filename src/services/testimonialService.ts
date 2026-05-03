import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Testimonial } from '../types';
import { toast } from 'sonner';

const COLLECTION_NAME = 'testimonials';

const DEFAULT_DATA = [
  {
    image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200",
    name: "Aarav Sharma",
    handle: "@aarav_du",
    text: "MyCollegeGenie made preparing for my final semester exams an absolute breeze. The notes and PYQs are totally game-changing!"
  },
  {
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
    name: "Riya Patel",
    handle: "@riya_sgtb",
    text: "MyCollegeGenie made preparing for my final semester exams an absolute breeze. The notes and PYQs are totally game-changing!"
  },
  {
    image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60",
    name: "Kabir Singh",
    handle: "@kabir_hindu",
    text: "MyCollegeGenie made preparing for my final semester exams an absolute breeze. The notes and PYQs are totally game-changing!"
  },
  {
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60",
    name: "Ananya Desai",
    handle: "@ananya_srcc",
    text: "MyCollegeGenie made preparing for my final semester exams an absolute breeze. The notes and PYQs are totally game-changing!"
  }
];

export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Testimonial[];
    
    // Seed defaults if totally empty
    if (results.length === 0) {
      try {
        for (const item of DEFAULT_DATA) {
          await addTestimonial(item);
        }
        return getTestimonials(); // recursive once
      } catch (err) {
        console.warn('Could not seed testimonials, returning defaults');
        return DEFAULT_DATA.map((d, i) => ({ 
          ...d, 
          id: `dummy-${i}`, 
          createdAt: new Date().toISOString() 
        }));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return DEFAULT_DATA.map((d, i) => ({ 
      ...d, 
      id: `dummy-${i}`, 
      createdAt: new Date().toISOString() 
    }));
  }
};

export const addTestimonial = async (testimonial: Omit<Testimonial, 'id' | 'createdAt'>): Promise<void> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...testimonial,
      createdAt: new Date().toISOString()
    });
    // omit toast for initial seeding script implicitly? no we just don't want it to clutter.
  } catch (error) {
    console.error('Error adding testimonial:', error);
    throw error;
  }
};

export const updateTestimonial = async (id: string, updates: Partial<Testimonial>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
    toast.success('Testimonial updated successfully');
  } catch (error) {
    console.error('Error updating testimonial:', error);
    toast.error('Failed to update testimonial');
    throw error;
  }
};

export const deleteTestimonial = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    toast.success('Testimonial deleted successfully');
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    toast.error('Failed to delete testimonial');
    throw error;
  }
};
