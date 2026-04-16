# MyUniPal — University AI Assistant (UoV)
MyUniPal Description
MyUniPal is an AI-powered mobile application that centralizes key university services (handbook Q&A, GPA tools, feedback + analytics) into one platform. It reduces student confusion caused by scattered systems and helps administrators generate insights from feedback automatically.

Key Features
Student / Community
Authentication & role-based access (community/admin)
Profile setup (internal student/external prospecting student selection, basic user details)
Community dashboard
GPA calculator + AI GPA advisor
Voice-to-text (audio transcription)
Faculty handbook chatbot (RAG search + AI answer)
Send feedbacks
Admin
Admin dashboard
Feedback management
AI-generated feedback reports + pdf reports can be downloaded
Category-based analytics
Target Users
Internal users (students): academic info, GPA calculation & AI based GPA Advisor, feedback
External users:(prospecting students) course/admission info via chatbot,GPA calculation & AI based GPA Advisor, feedback
Administrators: feedback collection, AI reports & analytics
Tech Stack
Frontend: React Native
Backend: Firebase Cloud Functions (Node.js / TypeScript)
Database: Firebase Firestore
Storage: Firebase Storage (PDFs, profile pictures)
Auth: Firebase Authentication
AI:
Groq API(chat completions via lama-3.1-8b-instant model, transcription via whisper-large-v3-turbo model)
Pinecone (handbook vector search, indexing and embedding via llama-text-embed-v2 model)
Version Control: Git + GitHub
Prerequisites
Install:

Node.js (LTS recommended)
Firebase CLI
Git
Optional (recommended):

Android Studio (Android emulator) / Xcode (iOS simulator)
Firebase CLI login:

npm i -g firebase-tools
firebase login
firebase use <your-firebase-project-id>
Setup & Installation
1) Clone the repository
git clone <your-repo-url>
cd MyUniPal
2) Install frontend dependencies
If your React Native app is inside app/:

cd app
npm install
3) Install Cloud Functions dependencies
cd ../functions
npm install
Firebase & Secrets Configuration
Your Cloud Functions use secrets like:

GROQ_API_KEY
PINECONE_API_KEY
PINECONE_INDEX
Set them via Firebase secrets:

firebase functions:secrets:set GROQ_API_KEY
firebase functions:secrets:set PINECONE_API_KEY
firebase functions:secrets:set PINECONE_INDEX
Then deploy functions (from repo root):

cd ..
firebase deploy --only functions
Tip: In Firebase projects, deploy from the repo root (where firebase.json is). That avoids path/config issues.

Running Locally
Option A: Run the mobile app
Expo (if you used Expo)
cd app
npx expo start
React Native CLI (if not Expo)
cd app
npm run android
# or
npm run ios
Option B: Run Firebase emulators (recommended for development)
From repo root:

firebase emulators:start
If you only want functions:

firebase emulators:start --only functions,firestore,auth
If your app connects to emulators, make sure you set emulator hosts in the app (Firestore/Auth/Functions) during development.

Firestore Indexes (Important)
Some queries require composite indexes (example: filtering by category and ordering by createdAt). If Firestore tells you “index required”, click the link in logs and create it.

After creating an index:

It may take a few minutes to finish building.
Retry the function once it shows as Enabled.
Storage PDF + Signed URL Notes (Admin Reports)
Your reports feature generates PDFs and uploads to Firebase Storage, then creates a signed URL.

If you see a permission error like:

iam.serviceAccounts.signBlob denied
You must grant the Cloud Functions runtime service account permission to sign URLs.

Quick approach (Console)
Open Google Cloud Console → IAM & Admin → IAM

Find the Cloud Functions / Compute runtime service account (often like):

PROJECT_NUMBER-compute@developer.gserviceaccount.com
Grant role:

Service Account Token Creator (roles/iam.serviceAccountTokenCreator)
This is the same effect as the gcloud ... add-iam-policy-binding ... command, just done via the UI.

Deploying (Production)
From repo root:

firebase deploy
Or only functions:

firebase deploy --only functions
Or only hosting (if any):

firebase deploy --only hosting
Common Troubleshooting
“Request has invalid method. GET” in function logs
This happens if you open a callable function URL in a browser (GET request). Callable functions should be invoked via the Firebase SDK (httpsCallable) from your app.

“Missing or insufficient permissions”
This is Firestore Security Rules blocking reads/writes from the client. Fix by ensuring rules allow the intended access (or keep admin-only collections restricted and fetch via Cloud Functions).

“The query requires an index”
Create the composite index from the provided Firebase Console link, wait until it’s built, retry.

License
Private.

Team
B.H.Dinithi Wijayasinghe - Team Lead, ML Engineer(handbook-based chatbot, GPA Advisor, AI-based Feedback report generation), Frontend(Home,SignUp,Login, Feedback report page), Database(Firebase, Firestore, Authentication, Pincecone), Testing and Integration
R.Yeheni Wijesinghe - Frontend (GPA Calculator), ML Research, Documentation & reports
V.Manimegalai - Backend
K.Sathursika - Database documentation(ER,UseCase etc)
S.B.Salman - Frontend (Admin Dashboard)
M.L.F.Ishqa - Frontend (Community Dashboard)
