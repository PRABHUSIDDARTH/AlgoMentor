# ⚡ AlgoMentor — AI-Powered DSA Assistant

An AI assistant that explains DSA problems, gives hints, and provides optimal solutions — powered by Google Gemini.

## 🚀 Live Demo
[AlgoMentor app](https://algomentor-14455603516.asia-south1.run.app)

## 🛠️ Tech Stack
- **Backend:** Java 21 + Spring Boot 4, Google Gemini API (gemini-2.5-flash)
- **Frontend:** React 19 + TypeScript (Vite), Tailwind CSS v4, shadcn/ui, React Bits, Motion
- **Tests:** JUnit 5, Vitest + Testing Library, Playwright + axe
- **Deploy:** Docker + Google Cloud Run (the React build is bundled into the Spring Boot jar)

## ✨ Features
- 💡 Explain any DSA problem with intuition
- 🔍 Step-by-step hints: one at a time, each more specific (up to 4), without spoilers
- ✅ View optimal solution with time/space complexity
- 📥 Type just a LeetCode number (`1`, `LC 146`) or paste a problem link to fetch the statement automatically
- ⚡ Answers stream in as they're generated
- 🧭 Named hint steps (Nudge → Direction → Approach → Technique → Solution), and revealing early asks you to confirm
- 💬 Follow-up questions about the current problem, without giving the solution away
- ☕ Solutions in Python, Java or C++, with a time/space complexity panel
- 🕘 Recent problems saved in your browser, plus Ctrl K to jump to any problem
- 🌗 Light and dark themes (follows your system by default)

## 🔌 API
| Endpoint | Description |
| --- | --- |
| `POST /ask` | `{"problem", "mode": "explain\|hint\|solution\|followup", "previousHints": [...], "language": "python\|java\|cpp", "conversation": [...], "question", "solutionRevealed"}` → `{"result"}` |
| `POST /ask/stream` | Same body; Server-Sent Events: `chunk` `{"text"}` … then `done`, or `error` `{"error"}` |
| `GET /problem?ref=1` | Fetches a LeetCode problem by number or URL → `{number, title, difficulty, tags, url, statement}` |

Errors are always `{"error": "..."}`. LeetCode lookups use LeetCode's public but unofficial endpoints, so Premium problems can't be fetched.

## 🏗️ Run Locally
Requires Java 21. Maven (via the wrapper) downloads its own Node for the frontend build.
```bash
git clone https://github.com/PRABHUSIDDARTH/AlgoMentor.git
cd AlgoMentor
export GEMINI_API_KEY=your_key_here      # Windows: set GEMINI_API_KEY=your_key_here
./mvnw spring-boot:run                  # builds the frontend too; open http://localhost:8080
```

Working on the frontend (needs Node 26): run the backend as above, then in another terminal
```bash
cd frontend
npm install
npm run dev                             # http://localhost:5173, API calls are proxied to :8080
```

Tests (no API key needed: Gemini is mocked or stubbed):
```bash
./mvnw verify                           # backend tests + frontend unit tests
./mvnw package -DskipTests && cd frontend && npx playwright install chromium && npm run e2e
```
The end-to-end tests start the jar with the `e2e` profile, which swaps Gemini and LeetCode for deterministic stubs.

Build and run with Docker:
```bash
docker build -t algomentor .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key_here algomentor
```

Optional environment variables: `GEMINI_MODEL` (default `gemini-2.5-flash`) and `PORT` (default `8080`). Rate limits and size caps live in `src/main/resources/application.properties`. A health check is served at `/actuator/health`.

## 🌐 Deployment
Deployed on Google Cloud Run via Docker.

## 👨‍💻 Built by
[PrabhuSiddarth](https://github.com/PRABHUSIDDARTH) — psTech
