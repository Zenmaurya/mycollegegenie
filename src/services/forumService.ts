import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  increment, 
  arrayUnion, 
  arrayRemove,
  getDoc,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ForumPost, Comment } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
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
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const ForumService = {
  // Posts
  getPosts: (course?: string, topic?: string, limitCount?: number, callback?: (posts: ForumPost[]) => void) => {
    let q = query(collection(db, 'forum_posts'), orderBy('createdAt', 'desc'));
    
    if (course && course !== 'All') {
      q = query(q, where('course', '==', course));
    }
    if (topic && topic !== 'All') {
      q = query(q, where('topic', '==', topic));
    }
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
      })) as ForumPost[];
      callback?.(posts);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      callback?.([]);
      // Don't throw for snapshot listeners to prevent app crash
    });
  },

  getPost: async (postId: string) => {
    try {
      const docRef = doc(db, 'forum_posts', postId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
        } as ForumPost;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `forum_posts/${postId}`);
    }
  },

  getPostStream: (postId: string, callback: (post: ForumPost | null) => void) => {
    const docRef = doc(db, 'forum_posts', postId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const post = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
        } as ForumPost;
        callback(post);
      } else {
        callback(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `forum_posts/${postId}`));
  },

  createPost: async (post: Omit<ForumPost, 'id' | 'createdAt' | 'commentCount' | 'upvotes' | 'downvotes'>) => {
    try {
      const docRef = await addDoc(collection(db, 'forum_posts'), {
        ...post,
        createdAt: serverTimestamp(),
        commentCount: 0,
        upvotes: [],
        downvotes: []
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'forum_posts');
    }
  },

  updatePost: async (postId: string, updates: Partial<ForumPost>) => {
    try {
      const docRef = doc(db, 'forum_posts', postId);
      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `forum_posts/${postId}`);
    }
  },

  deletePost: async (postId: string) => {
    try {
      const docRef = doc(db, 'forum_posts', postId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `forum_posts/${postId}`);
    }
  },

  toggleUpvote: async (postId: string, userId: string, isUpvoted: boolean) => {
    try {
      const docRef = doc(db, 'forum_posts', postId);
      await updateDoc(docRef, {
        upvotes: isUpvoted ? arrayRemove(userId) : arrayUnion(userId),
        downvotes: arrayRemove(userId) // Always remove from downvotes if upvoting
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `forum_posts/${postId}`);
    }
  },

  toggleDownvote: async (postId: string, userId: string, isDownvoted: boolean) => {
    try {
      const docRef = doc(db, 'forum_posts', postId);
      await updateDoc(docRef, {
        downvotes: isDownvoted ? arrayRemove(userId) : arrayUnion(userId),
        upvotes: arrayRemove(userId) // Always remove from upvotes if downvoting
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `forum_posts/${postId}`);
    }
  },

  // Comments
  getComments: (postId: string, callback: (comments: Comment[]) => void) => {
    const q = query(collection(db, 'forum_posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
      })) as Comment[];
      callback(comments);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `forum_posts/${postId}/comments`));
  },

  addComment: async (postId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'upvotes' | 'downvotes'>) => {
    try {
      const postRef = doc(db, 'forum_posts', postId);
      const commentRef = await addDoc(collection(db, 'forum_posts', postId, 'comments'), {
        ...comment,
        createdAt: serverTimestamp(),
        upvotes: [],
        downvotes: []
      });
      await updateDoc(postRef, {
        commentCount: increment(1)
      });
      return commentRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `forum_posts/${postId}/comments`);
    }
  },

  toggleCommentUpvote: async (postId: string, commentId: string, userId: string, isUpvoted: boolean) => {
    try {
      const docRef = doc(db, 'forum_posts', postId, 'comments', commentId);
      await updateDoc(docRef, {
        upvotes: isUpvoted ? arrayRemove(userId) : arrayUnion(userId),
        downvotes: arrayRemove(userId) // Always remove from downvotes if upvoting
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `forum_posts/${postId}/comments/${commentId}`);
    }
  },

  toggleCommentDownvote: async (postId: string, commentId: string, userId: string, isDownvoted: boolean) => {
    try {
      const docRef = doc(db, 'forum_posts', postId, 'comments', commentId);
      await updateDoc(docRef, {
        downvotes: isDownvoted ? arrayRemove(userId) : arrayUnion(userId),
        upvotes: arrayRemove(userId) // Always remove from upvotes if downvoting
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `forum_posts/${postId}/comments/${commentId}`);
    }
  },

  deleteComment: async (postId: string, commentId: string) => {
    try {
      const postRef = doc(db, 'forum_posts', postId);
      const commentRef = doc(db, 'forum_posts', postId, 'comments', commentId);
      await deleteDoc(commentRef);
      await updateDoc(postRef, {
        commentCount: increment(-1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `forum_posts/${postId}/comments/${commentId}`);
    }
  }
};
