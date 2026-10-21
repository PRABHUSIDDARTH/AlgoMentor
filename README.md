# ⚡ AlgoMentor — AI-Powered DSA Assistant

An AI assistant that explains DSA problems, gives hints, and provides optimal solutions — powered by Google Gemini.

## 🚀 Live Demo
[AlgoMentor app](https://algomentor-14455603516.asia-south1.run.app)

## 🛠️ Tech Stack
- Python Flask
- Google Gemini API (gemini-2.5-flash)
- Docker + Google Cloud Run

## ✨ Features
- 💡 Explain any DSA problem with intuition
- 🔍 Get progressive hints without spoilers
- ✅ View optimal solution with time/space complexity

## 🏗️ Run Locally
```bash
git clone https://github.com/PRABHUSIDDARTH/AlgoMentor.git
cd AlgoMentor
pip install -r requirements.txt
set GEMINI_API_KEY=your_key_here
python app.py
```

Run the tests (no API key needed — Gemini is mocked):
```bash
pip install pytest
pytest
```

Build and run with Docker:
```bash
docker build -t algomentor .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key_here algomentor
```

Optional environment variables: `GEMINI_MODEL` (default `gemini-2.5-flash`) and `RATELIMIT_STORAGE_URI` (default in-memory; e.g. `redis://...` to share limits across instances).

## 🌐 Deployment
Deployed on Google Cloud Run via Docker.

## 👨‍💻 Built by
[PrabhuSiddarth](https://github.com/PRABHUSIDDARTH) — psTech
