from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

import app as app_module


@pytest.fixture
def client(monkeypatch):
    app_module.app.config["TESTING"] = True
    app_module.limiter.reset()
    fake = MagicMock()
    fake.models.generate_content.return_value = SimpleNamespace(text="**Two pointers**")
    monkeypatch.setattr(app_module, "_client", fake)
    with app_module.app.test_client() as c:
        c.fake_genai = fake
        yield c


def test_index(client):
    res = client.get("/")
    assert res.status_code == 200
    assert b"AlgoMentor" in res.data


def test_ask_returns_result(client):
    res = client.post("/ask", json={"problem": "Two Sum", "mode": "hint"})
    assert res.status_code == 200
    assert res.get_json() == {"result": "**Two pointers**"}
    prompt = client.fake_genai.models.generate_content.call_args.kwargs["contents"]
    assert "hints" in prompt and "Two Sum" in prompt


def test_ask_rejects_empty_problem(client):
    res = client.post("/ask", json={"problem": "   "})
    assert res.status_code == 400
    assert "error" in res.get_json()


def test_ask_rejects_long_problem(client):
    res = client.post("/ask", json={"problem": "x" * (app_module.MAX_PROBLEM_CHARS + 1)})
    assert res.status_code == 400


def test_ask_rejects_non_json(client):
    res = client.post("/ask", data="not json")
    assert res.status_code == 400


def test_ask_handles_gemini_failure(client):
    client.fake_genai.models.generate_content.side_effect = RuntimeError("quota")
    res = client.post("/ask", json={"problem": "Two Sum"})
    assert res.status_code == 502
    assert "error" in res.get_json()


def test_missing_api_key_returns_error(client, monkeypatch):
    monkeypatch.setattr(app_module, "_client", None)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    res = client.post("/ask", json={"problem": "Two Sum"})
    assert res.status_code == 502


def test_rate_limit(client):
    for _ in range(10):
        assert client.post("/ask", json={"problem": "Two Sum"}).status_code == 200
    res = client.post("/ask", json={"problem": "Two Sum"})
    assert res.status_code == 429
    assert "error" in res.get_json()
