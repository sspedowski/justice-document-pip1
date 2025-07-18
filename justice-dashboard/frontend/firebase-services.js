// frontend/firebase-services.js
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from './firebase.js';

// Document Analysis Services
export class DocumentService {
  // Upload document to Firebase Storage
  static async uploadDocument(file, metadata = {}) {
    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

    try {
      const fileName = `documents/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      // Upload file with metadata
      const uploadResult = await uploadBytes(storageRef, file, {
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      });

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);

      return {
        fileName,
        downloadURL,
        fullPath: uploadResult.ref.fullPath,
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  // Save document analysis to Firestore
  static async saveDocumentAnalysis(documentData) {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const docRef = await addDoc(collection(db, 'document_analysis'), {
        ...documentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error saving document analysis:', error);
      throw error;
    }
  }

  // Get all document analyses
  static async getDocumentAnalyses(options = {}) {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      let q = collection(db, 'document_analysis');

      // Apply filters
      if (options.category) {
        q = query(q, where('category', '==', options.category));
      }

      if (options.child) {
        q = query(q, where('child', '==', options.child));
      }

      // Apply ordering
      q = query(q, orderBy('createdAt', 'desc'));

      // Apply limit
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting document analyses:', error);
      throw error;
    }
  }

  // Update document analysis
  static async updateDocumentAnalysis(docId, updates) {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const docRef = doc(db, 'document_analysis', docId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });

      return docId;
    } catch (error) {
      console.error('Error updating document analysis:', error);
      throw error;
    }
  }

  // Delete document analysis
  static async deleteDocumentAnalysis(docId) {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      await deleteDoc(doc(db, 'document_analysis', docId));
      return true;
    } catch (error) {
      console.error('Error deleting document analysis:', error);
      throw error;
    }
  }

  // Real-time listener for document analyses
  static onDocumentAnalysesChange(callback, options = {}) {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    let q = collection(db, 'document_analysis');

    // Apply filters
    if (options.category) {
      q = query(q, where('category', '==', options.category));
    }

    // Apply ordering
    q = query(q, orderBy('createdAt', 'desc'));

    return onSnapshot(q, querySnapshot => {
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(documents);
    });
  }
}

// Cloud Functions Services
export class CloudFunctionService {
  // Analyze document using Cloud Function
  static async analyzeDocument(documentUrl, options = {}) {
    if (!functions) {
      throw new Error('Firebase Functions not initialized');
    }

    try {
      const analyzeDoc = httpsCallable(functions, 'analyzeDocument');
      const result = await analyzeDoc({
        documentUrl,
        options,
      });

      return result.data;
    } catch (error) {
      console.error('Error calling analyzeDocument function:', error);
      throw error;
    }
  }

  // Extract legal statutes using Cloud Function
  static async extractLegalStatutes(text) {
    if (!functions) {
      throw new Error('Firebase Functions not initialized');
    }

    try {
      const extractStatutes = httpsCallable(functions, 'extractLegalStatutes');
      const result = await extractStatutes({ text });

      return result.data;
    } catch (error) {
      console.error('Error calling extractLegalStatutes function:', error);
      throw error;
    }
  }

  // Generate summary using Cloud Function
  static async generateSummary(text, documentType = 'legal') {
    if (!functions) {
      throw new Error('Firebase Functions not initialized');
    }

    try {
      const generateSummary = httpsCallable(functions, 'generateSummary');
      const result = await generateSummary({
        text,
        documentType,
      });

      return result.data;
    } catch (error) {
      console.error('Error calling generateSummary function:', error);
      throw error;
    }
  }
}

// Export for convenience
export { DocumentService as Documents, CloudFunctionService as CloudFunctions };
