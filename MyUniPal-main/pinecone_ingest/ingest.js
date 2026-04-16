import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";
import fs from "fs";
import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse"); // pdf-parse@1.1.1 (CommonJS)

const INDEX_NAME = process.env.PINECONE_INDEX;
if (!process.env.PINECONE_API_KEY) throw new Error("Missing PINECONE_API_KEY in .env");
if (!INDEX_NAME) throw new Error("Missing PINECONE_INDEX in .env");

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// ✅ IMPORTANT: index name must be a STRING
const baseIndex = pc.index(INDEX_NAME);

function chunkText(text, chunkSize = 1200, overlap = 200) {
  const clean = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const chunks = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + chunkSize, clean.length);
    const chunk = clean.slice(i, end).trim();
    if (chunk.length > 120) chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

async function ingestOnePdf({ faculty, filePath }) {
  const buf = fs.readFileSync(filePath);
  const parsed = await pdfParse(buf);

  const docName = path.basename(filePath);
  const chunks = chunkText(parsed.text, 1200, 200);

  console.log(`\n📄 ${docName} (${faculty}) -> ${chunks.length} chunks`);

  const ns = baseIndex.namespace(faculty);
  const BATCH = 50;

  for (let start = 0; start < chunks.length; start += BATCH) {
    const batch = chunks.slice(start, start + BATCH);

    // ✅ Integrated Embedding:
    // - `text` must be top-level because you mapped field "text" to embed
    // - extra info can go in metadata
    const records = batch.map((t, i) => {
      const chunkIndex = start + i;
      return {
        id: `${faculty}:${docName}:chunk-${String(chunkIndex).padStart(5, "0")}`,
        text: t, // <-- embedded field (field map: text)
        faculty: faculty,       // stored
        doc: docName,           // stored
        chunkIndex: chunkIndex,
      };
    });

    await ns.upsertRecords(records);
    console.log(`✅ upserted ${start}..${start + batch.length - 1}`);
  }
}

async function main() {
  const jobs = [
    { faculty: "FAS", files: ["../pdfs/HB-Applied.pdf"] },
    {
      faculty: "FBS",
      files: ["../pdfs/HB-BAI.pdf", "../pdfs/HB-BBM.pdf", "../pdfs/HB-PM.pdf"],
    },
    { faculty: "FTS", files: ["../pdfs/HB-Tech.pdf"] },
  ];

  for (const job of jobs) {
    for (const filePath of job.files) {
      console.log(`➡️ Processing ${filePath} (${job.faculty})`);
      await ingestOnePdf({ faculty: job.faculty, filePath });
    }
  }

  console.log("\n🎉 All done! PDFs ingested successfully.");
}

main().catch((e) => {
  console.error("\n❌ Ingest failed:", e);
  process.exit(1);
});
