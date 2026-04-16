import { Pinecone } from "@pinecone-database/pinecone";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import Groq from "groq-sdk";
import PDFDocument = require("pdfkit");

admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

//Store Groq key as a Firebase secret (NOT in app)
const GROQ_API_KEY = defineSecret("GROQ_API_KEY");
const PINECONE_API_KEY = defineSecret("PINECONE_API_KEY");
const PINECONE_INDEX = defineSecret("PINECONE_INDEX");

type Subject = { name?: string; grade?: string; credits?: number | string };
type Source = { faculty: string; doc: string; chunkIndex: number; text: string };

type GpaInsightsRequest = {
  semester?: string;
  sgpa?: number | string;
  totalCredits?: number | string;
  subjects?: Subject[];
};

type FeedbackDoc = {
  uid?: string;
  role?: string;
  userType?: string;
  category?: string;
  emoji?: string;
  feedback?: string;
  createdAt?: admin.firestore.Timestamp;
};
function normalizeCategory(cat: string) {
  const allowed = ["Academic", "MyUniPal", "Library", "Hostel", "Others"];
  return allowed.includes(cat) ? cat : "Others";
}

export const getGpaInsights = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [GROQ_API_KEY],
    cors: true,
  },
  async (request): Promise<{ insight: string }> => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Please login first.");

    const data = request.data as GpaInsightsRequest;

    const semester = String(data.semester ?? "Unknown semester");
    const sgpa = Number(data.sgpa ?? 0);
    const totalCredits = Number(data.totalCredits ?? 0);
    
const subjects = (data.subjects || []).filter(
  (s: any) =>
    s?.name &&
    s?.grade &&
    typeof s?.credits === "number" &&
    s.credits > 0
);

    if (!Number.isFinite(sgpa) || sgpa <= 0) {
      throw new HttpsError("invalid-argument", "Invalid SGPA.");
    }

    const apiKey = GROQ_API_KEY.value();
    if (!apiKey) throw new HttpsError("failed-precondition", "Missing GROQ_API_KEY secret.");

    const subjectSummary = subjects
      .slice(0, 12)
      .map((s) => ({
        name: (s.name ?? "").trim().slice(0, 40),
        grade: (s.grade ?? "").trim().slice(0, 3),
        credits: Number(s.credits ?? 0) || 0,
      }));
      

    const system = [
      "You are MyUniPal, a helpful academic advisor for university students.",
      "Give concise, practical advice.",
      "Output MUST be plain text (no markdown), max 120 words.",
      "Include: 1) one-sentence summary 2) 3 actionable tips 3) one prediction if they follow tips.",
      "Do NOT mention policies or being an AI.",
    ].join(" ");

    const user = {
      semester,
      sgpa: Number(sgpa.toFixed(2)),
      totalCredits,
      subjects: subjectSummary,
    };

    logger.info("Groq insights request", { uid, semester, sgpa, totalCredits });

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", 
        temperature: 0.4,
        max_tokens: 220,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Student data: ${JSON.stringify(user)}` },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      logger.error("Groq API error", { status: resp.status, text });
      throw new HttpsError("internal", "Failed to generate insights.");
    }

    const json = (await resp.json()) as any;
    const insight = String(json?.choices?.[0]?.message?.content ?? "").trim();

    if (!insight) throw new HttpsError("internal", "Empty insights from model.");

    return { insight };
  }
);

export const chatHandbook = onCall(
  {
    region: "us-central1",
    secrets: [GROQ_API_KEY, PINECONE_API_KEY, PINECONE_INDEX],
  },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Login required.");

    const { message } = req.data as { message?: string };
    if (!message || typeof message !== "string" || message.trim().length < 2) {
      throw new HttpsError("invalid-argument", "message is required.");
    }

    const userQuestion = message.trim();

    const pc = new Pinecone({ apiKey: PINECONE_API_KEY.value() });
    const index = pc.index(PINECONE_INDEX.value());

    const namespaces = ["FAS", "FBS", "FTS"];
    const topKPerNs = 4;

    const results: Source[] = [];
    for (const ns of namespaces) {
      const r = await index.namespace(ns).searchRecords({
        query: {
          topK: topKPerNs,
          inputs: { text: userQuestion },
        },
        fields: ["text", "faculty", "doc", "chunkIndex"],
      });

      for (const m of r.result.hits ?? []) {
        const f = (m.fields ?? {}) as any;
        if (typeof f.text === "string") {
          results.push({
            faculty: String(f.faculty ?? ns),
            doc: String(f.doc ?? ""),
            chunkIndex: Number(f.chunkIndex ?? -1),
            text: f.text,
          });
        }
      }
    }
    const contextChunks = results.slice(0, 10);

    if (contextChunks.length === 0) {
      return {
        answer:
          "Please rephrase or ask something directly related to handbook rules, modules, exams, or academic procedures.",
        sources: [],
      };
    }

    const contextText = contextChunks
      .map(
        (c, i) =>
          `[S${i + 1}] (${c.faculty} | ${c.doc} | chunk ${c.chunkIndex})\n${c.text}`
      )
      .join("\n\n---\n\n");
      const system = `
You are MyUniPal Handbook Assistant.
You MUST answer using ONLY the provided CONTEXT.
If the answer is not explicitly supported by the CONTEXT, say: "Please rephrase or ask something directly related to handbook rules, modules, exams, or academic procedures."
Do not invent policies, dates, or rules.
Do NOT include [S1]/[S2] in the answer.
Keep it short and practical.
Sometimes students will use short form words, correctly understand and answer
`;

    const groq = new Groq({ apiKey: GROQ_API_KEY.value() });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `CONTEXT:\n${contextText}\n\nQUESTION:\n${userQuestion}` },
      ],
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() ?? "No answer.";
    
    const sources = contextChunks.map(({ faculty, doc, chunkIndex }) => ({
      faculty,
      doc,
      chunkIndex,
    }));

    return { answer, sources };
  }
);


export const transcribeAudio = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [GROQ_API_KEY],
    cors: true,
  },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Login required.");

    const { audioBase64, mimeType, language } = req.data as {
      audioBase64?: string;
      mimeType?: string; 
      language?: string; 
    };
if (!audioBase64 || typeof audioBase64 !== "string") {
      throw new HttpsError("invalid-argument", "audioBase64 is required.");
    }

    const safeMime = typeof mimeType === "string" && mimeType.includes("/") ? mimeType : "audio/m4a";
    const bytes = Buffer.from(audioBase64, "base64");

    if (bytes.length > 20 * 1024 * 1024) {
      throw new HttpsError("invalid-argument", "Audio too large. Please record a shorter clip.");
    }

    const groq = new Groq({ apiKey: GROQ_API_KEY.value() });

    const blob = new Blob([bytes], { type: safeMime });
    const file = new File([blob], `voice.${safeMime.split("/")[1] || "m4a"}`, { type: safeMime });

    logger.info("STT request", { sizeBytes: bytes.length, mime: safeMime });
const result = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      temperature: 0,
      response_format: "json",
      language: typeof language === "string" ? language : undefined,
    });

    const text = (result as any)?.text?.trim?.() ?? "";
    if (!text) return { text: "" };

    return { text };
  }
);

export const onFeedbackCreated = onDocumentCreated("feedbacks/{id}", async (event) => {
  const data = event.data?.data() as FeedbackDoc | undefined;
  if (!data) return;

  const category = normalizeCategory(String(data.category || "Others"));
  const reportRef = db.doc(`categoryReports/${category}`);

  await reportRef.set(
    {
      category,
      needsRegen: true,
      lastFeedbackAt: admin.firestore.FieldValue.serverTimestamp(),
      feedbackCount: admin.firestore.FieldValue.increment(1),
    },
    { merge: true }
  );
});

async function generateGroqReport(category: string, feedbacks: FeedbackDoc[]) {
  const groq = new Groq({ apiKey: GROQ_API_KEY.value() });

  const compact = feedbacks.slice(0, 200).map((f) => ({
    emoji: f.emoji ?? "",
    userType: f.userType ?? "",
    text: (f.feedback ?? "").slice(0, 400),
    createdAt: f.createdAt?.toDate?.().toISOString?.() ?? "",
  }));

  const system = `
You are an admin analyst for a university app.
You will receive student feedback for a single category.

Return a STRICT plain-text report with EXACT sections:
TITLE: <Category>
SUMMARY: <2-3 lines>
SENTIMENT: <Positive/Neutral/Negative + 1 line reason>
TOP_ISSUES:
- <issue 1>
- <issue 2>
- <issue 3>
- <issue 4>
- <issue 5>
COMMON_KEYWORDS: <comma-separated top 10>
ACTION_PLAN:
1) <action>
2) <action>
3) <action>
4) <action>
5) <action>
URGENT_ITEMS:
- <urgent item or "None">
METRICS: <count, date range>
NOTES: <any admin notes>

Rules:
- Use only the provided feedback.
- No markdown.
- Keep it practical.
`.trim();

  const user = `CATEGORY: ${category}\nFEEDBACKS_JSON: ${JSON.stringify(compact)}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.2,
    max_tokens: 900,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return completion.choices?.[0]?.message?.content?.trim() || "";
}

async function buildPdfBuffer(title: string, reportText: string) {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (c) => chunks.push(Buffer.from(c)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(`MyUniPal - ${title} Report`, { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#444").text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fillColor("#000").fontSize(11).text(reportText, {
      align: "left",
      lineGap: 4,
    });

    doc.end();
  });
  }

export const getCategoryReport = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 120,
    memory: "512MiB",
    secrets: [GROQ_API_KEY],
    cors: true,
  },
  async (req) => {
    try {
      if (!req.auth) throw new HttpsError("unauthenticated", "Login required.");

      const { category, force } = req.data as { category?: string; force?: boolean };
      const safeCategory = normalizeCategory(String(category || "Others"));

      const reportRef = db.doc(`categoryReports/${safeCategory}`);
      const reportSnap = await reportRef.get();
      const reportData = reportSnap.exists ? (reportSnap.data() as any) : null;

      const needsRegen = Boolean(reportData?.needsRegen);
      const hasCached =
        typeof reportData?.reportText === "string" && reportData.reportText.length > 10;

      if (!force && hasCached && !needsRegen) {
        return {
          category: safeCategory,
          reportText: reportData.reportText,
          pdfUrl: reportData.pdfUrl ?? "",
          lastGeneratedAt: reportData.lastGeneratedAt ?? null,
          needsRegen: false,
        };
      }

      const snap = await db
        .collection("feedbacks")
        .where("category", "==", safeCategory)
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();

      const feedbacks = snap.docs.map((d) => d.data() as FeedbackDoc);

      if (feedbacks.length === 0) {
        const emptyText =
          `TITLE: ${safeCategory}\n` +
          `SUMMARY: No feedback yet for this category.\n` +
          `SENTIMENT: Neutral - no data.\n` +
          `TOP_ISSUES:\n- None\n` +
          `COMMON_KEYWORDS: \n` +
          `ACTION_PLAN:\n1) Encourage users to submit feedback.\n` +
          `URGENT_ITEMS:\n- None\n` +
          `METRICS: count=0\n` +
          `NOTES: \n`;

        await reportRef.set(
          {
            category: safeCategory,
            reportText: emptyText,
            needsRegen: false,
            lastGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
            feedbackCount: 0,
            pdfUrl: "",
          },
          { merge: true }
        );

        return {
          category: safeCategory,
          reportText: emptyText,
          pdfUrl: "",
          needsRegen: false,
        };
      }

      logger.info("Generating category report", { category: safeCategory, count: feedbacks.length });

      const reportText = await generateGroqReport(safeCategory, feedbacks);
      if (!reportText) throw new HttpsError("internal", "Groq returned empty report.");

      const pdfBuffer = await buildPdfBuffer(safeCategory, reportText);

      const ts = new Date();
      const y = ts.getFullYear();
      const m = String(ts.getMonth() + 1).padStart(2, "0");
      const d = String(ts.getDate()).padStart(2, "0");
      const hh = String(ts.getHours()).padStart(2, "0");
      const mm = String(ts.getMinutes()).padStart(2, "0");

      const objectPath = `reports/${safeCategory}/report-${y}${m}${d}-${hh}${mm}.pdf`;
      const file = bucket.file(objectPath);

      await file.save(pdfBuffer, {
        contentType: "application/pdf",
        resumable: false,
        metadata: { cacheControl: "public, max-age=3600" },
      });

      const [pdfUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      });

      const newestAt = feedbacks[0]?.createdAt ?? null;

      await reportRef.set(
        {
          category: safeCategory,
          reportText,
          pdfUrl,
          pdfPath: objectPath,
          needsRegen: false,
          lastGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
          feedbackCount: feedbacks.length,
          lastFeedbackAt: newestAt ?? admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { category: safeCategory, reportText, pdfUrl, needsRegen: false };
    } catch (err: any) {
      logger.error("getCategoryReport failed", {
        err: String(err?.message ?? err),
        stack: err?.stack,
      });
      throw new HttpsError("internal", "Failed to generate report. Check function logs.");
    }
  }
);
