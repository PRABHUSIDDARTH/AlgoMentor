import os
from flask import Flask, render_template, request, jsonify
from google import genai

app = Flask(__name__)

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    problem = data.get("problem", "")
    mode = data.get("mode", "explain")

    prompts = {
        "explain": f"Explain this DSA problem clearly with approach and intuition:\n\n{problem}",
        "hint":    f"Give 2-3 progressive hints (no full solution) for this DSA problem:\n\n{problem}",
        "solution": f"Give the optimal solution with code (Python/Java) and time/space complexity for:\n\n{problem}"
    }

    prompt = prompts.get(mode, prompts["explain"])
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return jsonify({"result": response.text})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))