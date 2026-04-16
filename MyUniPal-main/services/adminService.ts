import { doc, getDoc } from "firebase/firestore";
import { db } from "../database/config";

export async function validateAdminCode(input: string) {
  const code = input.trim();

  // doc id = code
  const ref = doc(db, "admin_codes", code);
  const snap = await getDoc(ref);

  if (!snap.exists()) return { ok: false as const };

  const data = snap.data() as { enabled?: boolean; faculty?: string };

  if (!data.enabled) return { ok: false as const };
  if (!data.faculty) return { ok: false as const };

  return { ok: true as const, faculty: data.faculty };
}
