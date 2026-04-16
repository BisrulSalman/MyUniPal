import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../database/config';

export async function signUp(email: string, password: string) {
  const res = await createUserWithEmailAndPassword(auth, email, password);

  const userRef = doc(db, 'users', res.user.uid);
  const snap = await getDoc(userRef);

  // Create Firestore doc only once
  if (!snap.exists()) {
    await setDoc(userRef, {
      email,
      createdAt: new Date(),
    });
  }

  return res.user;
}

export async function signIn(email: string, password: string) {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
}
