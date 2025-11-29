import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from "firebase/firestore";
import { SavedItem, StudyNote, ExamPaper } from "../types";

// --- CONFIGURATION ---
// Replace with your ACTUAL Firebase Config if you want real cloud sync
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
  authDomain: "replace-with-your-app.firebaseapp.com",
  projectId: "replace-with-your-app",
  storageBucket: "replace-with-your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// --- INITIALIZATION ---
let app, auth: any, db: any, googleProvider: any;

// Helper to check if we are in "Local Mode" or "Cloud Mode"
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_FIREBASE_API_KEY";
};

try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } else {
    console.log("EduGen running in Local/Demo Mode (LocalStorage)");
  }
} catch (e) {
  console.error("Firebase init failed:", e);
}

// --- MOCK USER FOR LOCAL MODE ---
const MOCK_USER: User = {
  uid: "local-guest-user",
  displayName: "Guest Student",
  email: "student@edugen.local",
  photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=EduGen",
  emailVerified: true,
  isAnonymous: false,
  metadata: {} as any,
  providerData: [],
  refreshToken: "",
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => "mock-token",
  getIdTokenResult: async () => ({} as any),
  reload: async () => {},
  toJSON: () => ({}),
  phoneNumber: null,
  providerId: 'google.com'
};

// Event mechanism for Local Mode
const localAuthListeners: ((user: User | null) => void)[] = [];

const notifyLocalListeners = (user: User | null) => {
  localAuthListeners.forEach(listener => listener(user));
}

const getLocalUser = (): User => {
  const storedData = localStorage.getItem("edugen_local_user_data");
  const userData = storedData ? JSON.parse(storedData) : {};
  return { ...MOCK_USER, ...userData };
};

// --- AUTHENTICATION ---

export const loginWithGoogle = async () => {
  if (isFirebaseConfigured() && auth) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  } else {
    // Local Mode Login
    localStorage.setItem("edugen_user_session", "active");
    const user = getLocalUser();
    notifyLocalListeners(user);
    return user;
  }
};

export const logoutUser = async () => {
  if (isFirebaseConfigured() && auth) {
    await signOut(auth);
  } else {
    // Local Mode Logout
    localStorage.removeItem("edugen_user_session");
    notifyLocalListeners(null);
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (isFirebaseConfigured() && auth) {
    return onAuthStateChanged(auth, callback);
  } else {
    // Local Mode Auth Listener registration
    localAuthListeners.push(callback);
    
    // Initial check
    const isActive = localStorage.getItem("edugen_user_session") === "active";
    if (isActive) {
      callback(getLocalUser());
    } else {
      callback(null);
    }

    return () => {
      const index = localAuthListeners.indexOf(callback);
      if (index > -1) localAuthListeners.splice(index, 1);
    };
  }
};

export const updateUserProfile = async (user: User, updates: { displayName?: string, photoURL?: string }) => {
  if (isFirebaseConfigured() && auth) {
    await updateProfile(user, updates);
    // Force refresh might be needed in UI depending on Firebase's internal state triggering
  } else {
    // Local Mode Update
    const currentStored = localStorage.getItem("edugen_local_user_data");
    const currentObj = currentStored ? JSON.parse(currentStored) : {};
    const newObj = { ...currentObj, ...updates };
    localStorage.setItem("edugen_local_user_data", JSON.stringify(newObj));
    
    const updatedUser = { ...user, ...updates } as User;
    notifyLocalListeners(updatedUser); // Update all components subscribed to auth
  }
};

// --- USER PREFERENCES ---

export const saveUserClassLevel = async (uid: string, classLevel: string) => {
  if (isFirebaseConfigured() && db) {
    try {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, { classLevel }, { merge: true });
    } catch (e) {
      console.error("Error saving class preference", e);
    }
  } else {
    localStorage.setItem(`edugen_pref_class_${uid}`, classLevel);
  }
};

export const getUserClassLevel = async (uid: string): Promise<string | null> => {
  if (isFirebaseConfigured() && db) {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data().classLevel || null;
      }
    } catch (e) {
      console.error("Error fetching class preference", e);
    }
    return null;
  } else {
    return localStorage.getItem(`edugen_pref_class_${uid}`);
  }
};

// --- SAVED ITEMS (Notes & Exams) ---

export const saveGeneratedItem = async (
  userId: string, 
  type: 'note' | 'exam', 
  title: string, 
  subject: string,
  data: StudyNote | ExamPaper
) => {
  if (isFirebaseConfigured() && db) {
    try {
      await addDoc(collection(db, "users", userId, "savedItems"), {
        userId,
        type,
        title,
        subject,
        data,
        createdAt: Date.now()
      });
    } catch (e) {
      console.error("Error saving item", e);
      throw e;
    }
  } else {
    // Local Mode Save
    const key = `edugen_saved_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const newItem: SavedItem = {
      id: `local-${Date.now()}`,
      userId,
      type,
      title,
      subject,
      data,
      createdAt: Date.now()
    };
    localStorage.setItem(key, JSON.stringify([newItem, ...existing]));
  }
};

export const getSavedItems = async (userId: string, type: 'note' | 'exam'): Promise<SavedItem[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, "users", userId, "savedItems"),
        where("type", "==", type),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const items: SavedItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as SavedItem);
      });
      return items;
    } catch (e) {
      console.error("Error fetching saved items", e);
      return [];
    }
  } else {
    // Local Mode Fetch
    const key = `edugen_saved_${userId}`;
    const allItems = JSON.parse(localStorage.getItem(key) || "[]") as SavedItem[];
    return allItems.filter(item => item.type === type);
  }
};