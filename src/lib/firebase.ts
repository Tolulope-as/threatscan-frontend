
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, browserLocalPersistence, setPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, User } from 'firebase/auth'
import { getFirestore, doc, setDoc, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAh2dCmNDoEDWdiWRU2UvMklQ2N5IayE9U",
  authDomain: "threatscan-3ea18.firebaseapp.com",
  projectId: "threatscan-3ea18",
  storageBucket: "threatscan-3ea18.firebasestorage.app",
  messagingSenderId: "520727920083",
  appId: "1:520727920083:web:433227320f7e47c5b84326"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const db = getFirestore(app)

setPersistence(auth, browserLocalPersistence)

// AUTH FUNCTIONS
export const registerUser = async (fullName: string, email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user
  await updateProfile(user, { displayName: fullName })
  await setDoc(doc(db, 'users', user.uid), {
    fullName,
    firstName: fullName.split(' ')[0],
    email,
    createdAt: serverTimestamp()
  })
  return user
}

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export const logoutUser = async () => {
  await signOut(auth)
}

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

// FIRESTORE FUNCTIONS
export const saveScanResult = async (
  userId: string,
  input: string,
  type: 'URL' | 'FILE',
  verdict: 'SAFE' | 'MALICIOUS',
  details: object
) => {
  await addDoc(collection(db, 'scans'), {
    userId,
    input,
    type,
    verdict,
    details,
    createdAt: serverTimestamp()
  })
}

export const getUserScans = async (userId: string) => {
  const q = query(
    collection(db, 'scans'),
    where('userId', '==', userId)
  )
  const snapshot = await getDocs(q)
  const docs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  
  // Sort by createdAt descending in JavaScript instead of Firestore
  docs.sort((a: any, b: any) => {
    const aTime = a.createdAt?.seconds ?? 0
    const bTime = b.createdAt?.seconds ?? 0
    return bTime - aTime
  })
  
  return docs
}