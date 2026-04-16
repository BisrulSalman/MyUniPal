import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, db } from "../database/config";

export async function sendChatMessage(params: {
  uid: string;
  folderId: string;
  sessionId: string;
  text: string;
}) {
  const { uid, folderId, sessionId, text } = params;

  const messagesCol = collection(db, "users", uid, "folders", folderId, "sessions", sessionId, "messages");

  // save user msg
  await addDoc(messagesCol, {
    role: "user",
    text,
    createdAt: serverTimestamp(),
  });

  // call function (Groq+Pinecone)
  const fn = httpsCallable(getFunctions(app, "us-central1"), "chatHandbook");
  const res = await fn({ message: text });

  const data = res.data as { answer: string; sources?: any[] };

  // save assistant msg
  await addDoc(messagesCol, {
    role: "myunipal",
    text: data.answer ?? "No answer.",
    sources: Array.isArray(data.sources) ? data.sources : [],
    createdAt: serverTimestamp(),
  });

  return data;
}
