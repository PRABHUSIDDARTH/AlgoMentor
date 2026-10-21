# ⚡ AlgoMentor — AI-Powered DSA Assistant

An AI assistant that explains DSA problems, gives hints, and provides optimal solutions — powered by Google Gemini.

## 🚀 Live Demo
[AlgoMentor app](https://algomentor-14455603516.asia-south1.run.app)

## 🛠️ Tech Stack
- Java 21 + Spring Boot 4
- Google Gemini API (gemini-2.5-flash)
- Docker + Google Cloud Run

## ✨ Features
- 💡 Explain any DSA problem with intuition
- 🔍 Get progressive hints without spoilers
- ✅ View optimal solution with time/space complexity

## 🏗️ Run Locally
Requires Java 21 (Maven is downloaded by the wrapper).
```bash
git clone https://github.com/PRABHUSIDDARTH/AlgoMentor.git
cd AlgoMentor
export GEMINI_API_KEY=your_key_here      # Windows: set GEMINI_API_KEY=your_key_here
./mvnw spring-boot:run                  # Windows: mvnw.cmd spring-boot:run
```
Open http://localhost:8080.

Run the tests (no API key needed — Gemini is mocked):
```bash
./mvnw verify
```

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
