# StudyMate AI — Study Companion from Real Notes

**Hacktoberfest Hackday 2026 — Track 1: Best Use of Gemma 4**  
**Problem Statement PS 01: Adaptive Learning and Knowledge Support**

---

## 1. Project Overview

**StudyMate AI** is an evidence-grounded academic learning assistant and study companion designed to help students master their own course material. Unlike generic chat interfaces that hallucinate plausible-sounding falsehoods, StudyMate AI is strictly bound by a core principle:

> **Core Principle:** Answer exclusively from the student's supplied study material, show verified supporting evidence with exact citations and excerpts, identify missing information honestly with clear limitation notices, and help students learn through adaptive practice quizzes and personalized, supportive feedback.

---

## 2. Key Features

- **Document Ingestion & Parsing:** Upload PDF, TXT, and Markdown files or directly paste lecture notes. Automatically detects scanned/image-only PDFs and flags OCR advisories.
- **Evidence-Grounded Question Answering:** Powered by **Gemma 4** with strict anti-hallucination guardrails. If notes do not contain sufficient evidence, it responds honestly:  
  `"I couldn't find sufficient evidence in your supplied notes to answer this question confidently."`
- **Evidence Inspector:** View direct quotes, source filenames, page numbers, and real-time concept coverage meters calculated from actual retrieved token density.
- **Adaptive AI Tutor Modes:**
  - **Languages:** English and Hindi/Hinglish explanation options.
  - **Depth Control:** Short (definitions), Detailed (comprehensive), and Step-by-Step breakdowns.
  - **Academic Levels:** Beginner (intuition & building blocks), Intermediate (undergraduate depth), and Advanced (rigorous terminology).
- **Practice Quiz Generator & Evaluator:**
  - Multiple Choice (MCQ), True/False, and Short Answer questions synthesized exclusively from factual notes.
  - One question at a time with progressive guidance.
  - Interactive "Hint" button providing clues without prematurely revealing answers.
  - "Explain Answer" reveals full explanations and exact source citations.
  - Supportive feedback that never shames students.
- **Learning Progress & Dashboard:**
  - Recharts topic mastery bar charts.
  - Real-time tracking of mastered concepts vs. concepts recommended for revision.
  - Session activity history and study analytics.
- **Study Session Management:**
  - Multi-session workspace to organize notes by academic subject.
  - Reset and delete options with confirmation safeguards.
  - Transparent local data privacy policies.

---

## 3. Technology Stack

- **Frontend:** React 19, JavaScript (JSX), Vite, Tailwind CSS v4, Lucide React, Recharts, Canvas-Confetti
- **Backend:** Node.js v18+, Express, Multer, pdf-parse, Dotenv, UUID
- **AI / LLM:** Google Gemma 4 via pluggable inference adapters (Hugging Face Inference API, Groq Cloud LPUs, OpenRouter, Ollama local instance) with a built-in Grounded Demo Mode simulator.
- **Testing:** Node.js native test runner + Supertest (backend test suite) and Vitest + Testing Library (frontend test suite).

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      STUDYMATE AI FRONTEND                      │
│             (React + JavaScript + Vite + Tailwind CSS)          │
└───────────────┬─────────────────────────────────▲───────────────┘
                │ HTTP Requests / JSON             │ JSON Responses
                ▼                                 │
┌─────────────────────────────────────────────────┴───────────────┐
│                 NODE.JS & EXPRESS BACKEND SERVICE               │
│                                                                 │
│  ┌───────────────────────┐         ┌─────────────────────────┐  │
│  │  Document Processor   │         │    Session & Progress   │  │
│  │(pdf-parse/TXT Chunking│         │      State Store        │  │
│  └───────────┬───────────┘         └────────────▲────────────┘  │
│              │ Chunks                           │ Stats         │
│              ▼                                  │               │
│  ┌───────────────────────┐         ┌────────────┴────────────┐  │
│  │   Passage Retriever   │         │       Quiz Engine       │  │
│  │ (Token Overlap & BM25)│         │(Grounded MCQs & Scoring)│  │
│  └───────────┬───────────┘         └────────────▲────────────┘  │
│              │ Verified Evidence Passages       │               │
│              ▼                                  │               │
│  ┌──────────────────────────────────────────────┴────────────┐  │
│  │                     Gemma 4 Service Layer                 │  │
│  │         (Anti-Hallucination Guardrails & Adapters)        │  │
│  └───────────────────────────────┬───────────────────────────┘  │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │  Configured Gemma 4 Engine  │
                    ├─────────────────────────────┤
                    │ • Hugging Face API          │
                    │ • Groq Cloud LPUs           │
                    │ • OpenRouter API            │
                    │ • Local Ollama Instance     │
                    │ • Grounded Demo Simulator   │
                    └─────────────────────────────┘
```

---

## 5. Gemma 4 Integration & Anti-Hallucination Guardrails

StudyMate AI uses Gemma 4 as its central intelligence engine under strict system-level constraints:

1. **Grounded Source Priority:** Gemma 4 is instructed to evaluate only the supplied excerpts for the active academic topic.
2. **Strict Refusal On Missing Information:** If the question touches concepts absent from the notes, Gemma 4 is mandated to trigger the exact refusal statement:  
   `"I couldn't find sufficient evidence in your supplied notes to answer this question confidently."`
3. **No Hallucinated Citations:** The model never fabricates page numbers, file names, or quote fragments.
4. **Prompt Injection Hardening:** All user-supplied note content is treated as untrusted study data, preventing embedded instructions from overriding tutor rules.
5. **Backend Secret Isolation:** API keys are stored in backend environment variables and never leaked to the browser client.

---

## 6. Getting Started & Installation

### Prerequisites
- Node.js (v18+) and npm

### 1. Set Up Backend (Node.js & Express)

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### 2. Configure Environment Variables (`backend/.env`)

```env
# Choose provider: huggingface, groq, openrouter, ollama, or demo_offline
GEMMA_PROVIDER=huggingface
GEMMA_MODEL_ID=google/gemma-4-it
GEMMA_API_URL=https://api-inference.huggingface.co/models/google/gemma-4-it

# Enter your API key (leave blank to run in Grounded Demo Mode)
GEMMA_API_KEY=your_gemma_api_key_here

MAX_UPLOAD_SIZE_MB=15
CONFIDENCE_THRESHOLD=0.28
PORT=8001
HOST=0.0.0.0
```

### 3. Run Backend Server

```bash
# In backend directory
npm start
# Or for development auto-reload:
npm run dev
```
The Node.js Express backend will start at `http://localhost:8001`. Health check endpoint: `http://localhost:8001/api/health`.

### 4. Set Up & Run Frontend (React JavaScript)

```bash
cd ../frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 7. Automated Testing Suite

The project includes comprehensive automated test suites covering all hackathon verification criteria:

### Running Backend Tests (Node.js Test Runner)
```bash
cd backend
npm test
```
Tests verify:
- Document processing, chunking, and upload validation
- Grounded Q&A with direct evidence from notes
- Honest refusal of questions absent from notes (`"I couldn't find sufficient evidence in your supplied notes to answer this question confidently."`)
- Grounded practice quiz generation and supportive evaluation with hints
- Protection against secret API key leakage in public endpoints
- Session lifecycle and learning progress persistence

### Running Frontend Tests (Vitest)
```bash
cd frontend
npm run test
```
Tests verify:
- Landing hero headline, subheading, and primary CTA
- Accessible sidebar navigation and view routing
- Main application dashboard and session loading

---

## 8. Hackathon Live Demonstration Script

To demonstrate the application live:

1. **Launch App:** Open `http://localhost:5173`.
2. **Load Verified Demo Notes:** Click the `"Load Biology Sample Notes"` button on the Dashboard. This preloads structured notes on *Plant Physiology & Cellular Respiration*.
3. **Test Grounded Answer with Supporting Evidence:**
   - Go to the **AI Tutor** tab.
   - Click the quick test button: `"What reaction does the Oxygen-Evolving Complex catalyze in Photosystem II?"`
   - Observe Gemma 4's grounded explanation and expand the **Supporting Evidence** card to see the direct citation (`photosynthesis_notes.txt`, Page 1).
4. **Test Anti-Hallucination & Honest Missing Information:**
   - In **AI Tutor**, click the test button: `"What is Quantum Chromodynamics and the strong nuclear force coupling constant?"`
   - Observe the immediate honest response:  
     `"I couldn't find sufficient evidence in your supplied notes to answer this question confidently."`
5. **Test Hindi/Hinglish & Adaptive Depth:**
   - Toggle language to **Hinglish (हिंदी)** and Depth to **Step-by-step**.
   - Ask: `"Where do light-dependent reactions occur?"`
6. **Inspect Evidence Deeply:**
   - Navigate to the **Evidence Inspector** tab.
   - Inspect the genuine concept coverage gauge (100%) and review verified quotations.
7. **Generate Practice Quiz:**
   - Navigate to **Practice Quiz**.
   - Click `"Generate Practice Quiz"`.
   - Submit an intentionally incorrect answer. Notice the supportive explanation, helpful hint, and revision recommendation.
   - Submit correct answers to view final score, review summary, and celebration confetti.
8. **Review Learning Progress:**
   - Navigate to **Learning Progress** to review the Recharts concept mastery bar chart and the concept revision list.

---

## 9. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend service health and Gemma model target |
| `GET` | `/api/ai/status` | Current Gemma 4 inference provider status and mode |
| `POST` | `/api/documents` | Upload and chunk PDF, TXT, or MD study notes |
| `POST` | `/api/notes` | Save pasted notes to the active study session |
| `GET` | `/api/documents` | List documents for a given study session |
| `DELETE` | `/api/documents/{id}` | Remove a document and its indexed chunks |
| `POST` | `/api/documents/load-sample` | Preload bundled biology or networks notes |
| `POST` | `/api/ask` | Ask an evidence-grounded question to Gemma 4 |
| `POST` | `/api/quiz/generate` | Generate grounded MCQs, True/False, and Short Answer questions |
| `POST` | `/api/quiz/evaluate` | Evaluate student responses and generate supportive feedback |
| `GET` | `/api/sessions` | List all study sessions |
| `POST` | `/api/sessions` | Create a new study session |
| `PUT` | `/api/sessions/{id}` | Rename session or update study topic |
| `DELETE` | `/api/sessions/{id}` | Delete a session and associated data |
| `POST` | `/api/sessions/{id}/reset` | Clear session documents and history |
| `GET` | `/api/progress` | Retrieve session analytics and revision list |

---

## 10. Deployment Guidelines

### 1-Click Render Blueprint Deployment
A configured `render.yaml` blueprint is included in the root directory. To deploy both the Node.js Express backend and the React JavaScript frontend:
👉 **[Deploy on Render](https://render.com/deploy?repo=https://github.com/royanurag959-tech/studymate-ai)**

---

## 11. License & Hackathon Attribution

Built for **Hacktoberfest Hackday 2026** under **Track 1: Best Use of Gemma 4** (Problem Statement PS 01: Adaptive Learning and Knowledge Support).
