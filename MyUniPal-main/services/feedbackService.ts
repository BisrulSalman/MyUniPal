import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../database/config";

export type FeedbackDoc = {
  id: string;
  uid: string;
  role?: "community" | "admin" | null;
  userType: string;
  category: string;
  emoji: string;
  feedback: string;
  createdAt?: any;
};

export async function addFeedback(input: {
  uid: string;
  role?: "community" | "admin" | null;
  userType: string;
  category: string;
  emoji: string;
  feedback: string;
}) {
  await addDoc(collection(db, "feedbacks"), {
    uid: input.uid,
    role: input.role ?? null,
    userType: input.userType,
    category: input.category,
    emoji: input.emoji,
    feedback: input.feedback,
    createdAt: serverTimestamp(),
  });
}

export async function listRecentFeedbacks(max: number = 30): Promise<FeedbackDoc[]> {
  const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"), limit(max));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<FeedbackDoc, "id">),
  }));
}
