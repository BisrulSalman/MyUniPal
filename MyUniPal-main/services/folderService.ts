import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../database/config";

export type FolderDoc = {
  name: string;
  description?: string;
  color: string;
  icon?: string | null;
  createdAt?: any;
};

export type SessionDoc = {
  title: string;
  color: string;
  icon?: string | null;
  createdAt?: any;
};

const foldersCol = (uid: string) => collection(db, "users", uid, "folders");
const folderRef = (uid: string, folderId: string) => doc(db, "users", uid, "folders", folderId);
const sessionsCol = (uid: string, folderId: string) =>
  collection(db, "users", uid, "folders", folderId, "sessions");

export async function listFolders(uid: string) {
  const q = query(foldersCol(uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as FolderDoc) }));
}

export async function createFolder(uid: string, data: Omit<FolderDoc, "createdAt">) {
  const ref = await addDoc(foldersCol(uid), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteFolder(uid: string, folderId: string) {
  await deleteDoc(folderRef(uid, folderId));
}

export async function getFolder(uid: string, folderId: string) {
  const snap = await getDoc(folderRef(uid, folderId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as FolderDoc) };
}

export async function listSessions(uid: string, folderId: string) {
  const q = query(sessionsCol(uid, folderId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SessionDoc) }));
}

export async function createSession(uid: string, folderId: string, data: Omit<SessionDoc, "createdAt">) {
  // enforce max 5 sessions
  const count = await getDocs(query(sessionsCol(uid, folderId), limit(6)));
  if (count.size >= 5) throw new Error("You can only create 5 sessions per project.");

  const ref = await addDoc(sessionsCol(uid, folderId), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteSession(uid: string, folderId: string, sessionId: string) {
  await deleteDoc(doc(db, "users", uid, "folders", folderId, "sessions", sessionId));
}
