import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from '../database/config';

export async function setUserRoleAndFaculty(uid: string, role: 'community' | 'admin', faculty?: string) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    role,
    ...(faculty ? { faculty } : {}),
  });
}

export async function getUserRole(uid: string): Promise<'community' | 'admin' | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;

  const role = snap.data().role;
  if (role === 'community' || role === 'admin') return role;

  return null;
}

export type UserProfile = {
  username?: string;
  userType?: "Internal" | "External";
  photoURL?: string | null;
  email?: string | null;
};

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.exists() ? snap.data() : {};

  return {
    username: (data.username as string) ?? "",
    userType: (data.userType as "Internal" | "External" | undefined) ?? undefined,
    photoURL: (data.photoURL as string | null | undefined) ?? null,
    email: auth.currentUser?.email ?? null,
  };
}

export async function updateUserProfile(
  uid: string,
  updates: { username?: string; userType?: "Internal" | "External"; photoURL?: string | null }
) {
  const refDoc = doc(db, "users", uid);

  await setDoc(refDoc, updates, { merge: true });
}

export async function uploadUserAvatar(uid: string, localUri: string) {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const storageRef = ref(storage, `avatars/${uid}.jpg`);
  await uploadBytes(storageRef, blob);

  const url = await getDownloadURL(storageRef);

  await updateUserProfile(uid, { photoURL: url });

  return url;
}
