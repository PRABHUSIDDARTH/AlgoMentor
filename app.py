import logging
import os
from flask import Flask, render_template, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from google import genai

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024  # reject oversized request bodies

MAX_PROBLEM_CHARS = 8000
MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

limiter = Limiter(
    get_remote_address,
    app=app,
    storage_uri=os.environ.get("RATELIMIT_STORAGE_URI", "memory://"),
)

PROMPTS = {
    "explain": "Explain this DSA problem clearly with approach and intuition:\n\n{problem}",
    "hint": "Give 2-3 progressive hints (no full solution) for this DSA problem:\n\n{problem}",
    "solution": "Give the optimal solution with code (Python/Java) and time/space complexity for:\n\n{problem}",
}

_client = None


def get_client():
    # Created lazily so the app (and tests) can start without GEMINI_API_KEY set.
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(api_key=api_key)
    return _client


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/ask", methods=["POST"])
@limiter.limit("10 per minute;100 per day")
def ask():
    data = request.get_json(silent=True) or {}
    problem = str(data.get("problem", "")).strip()
    mode = data.get("mode", "explain")

    if not problem:
        return jsonify({"error": "Please paste a problem first."}), 400
    if len(problem) > MAX_PROBLEM_CHARS:
        return jsonify({"error": f"Problem is too long (max {MAX_PROBLEM_CHARS} characters)."}), 400

    prompt = PROMPTS.get(mode, PROMPTS["explain"]).format(problem=problem)
    try:
        response = get_client().models.generate_content(model=MODEL, contents=prompt)
    except Exception:
        logging.exception("Gemini request failed")
        return jsonify({"error": "AlgoMentor couldn't get an answer right now. Please try again shortly."}), 502

    if not response.text:
        return jsonify({"error": "The model returned an empty answer. Try rephrasing the problem."}), 502
    return jsonify({"result": response.text})


@app.errorhandler(429)
def rate_limited(e):
    return jsonify({"error": "Too many requests. Please wait a minute and try again."}), 429


@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "Request is too large."}), 413


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
