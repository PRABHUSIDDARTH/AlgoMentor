package com.pstech.algomentor.github;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/** A scripted GitHub REST API: each exact path answers with trimmed JSON shaped like the real responses. */
class FakeGitHub {

	static final String BASE = "https://api.gh.test";

	final RestClient.Builder builder = RestClient.builder();

	final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).ignoreExpectOrder(true).build();

	final String repoPath;

	FakeGitHub(String owner, String repo) {
		this.repoPath = "/repos/" + owner + "/" + repo;
	}

	GitHubClient client() {
		return client("");
	}

	GitHubClient client(String token) {
		return new GitHubClient(builder.build(), BASE, token);
	}

	/** Answers {@code GET /repos/owner/repo<path>} any number of times. */
	FakeGitHub on(String path, String json) {
		server.expect(ExpectedCount.manyTimes(), requestTo(BASE + repoPath + path)).andRespond(withSuccess(json, MediaType.APPLICATION_JSON));
		return this;
	}

	FakeGitHub missing(String path) {
		server.expect(ExpectedCount.manyTimes(), requestTo(BASE + repoPath + path)).andRespond(withStatus(HttpStatus.NOT_FOUND)
			.contentType(MediaType.APPLICATION_JSON).body("{\"message\":\"Not Found\"}"));
		return this;
	}

	/** GitHub answers 409 "Git Repository is empty." for commits and trees of an empty repository. */
	FakeGitHub conflict(String path) {
		server.expect(ExpectedCount.manyTimes(), requestTo(BASE + repoPath + path)).andRespond(withStatus(HttpStatus.CONFLICT)
			.contentType(MediaType.APPLICATION_JSON).body("{\"message\":\"Git Repository is empty.\"}"));
		return this;
	}

	FakeGitHub repo(String defaultBranch) {
		return on("", repoJson(defaultBranch, "null", "[]", "null"));
	}

	static String repoJson(String defaultBranch, String license, String topics, String homepage) {
		return """
				{"name":"library","owner":{"login":"ana"},"private":false,"default_branch":"%s",
				 "license":%s,"topics":%s,"homepage":%s}""".formatted(defaultBranch, license, topics, homepage);
	}

	static String commit(String sha, String message, String login, String... parents) {
		StringBuilder p = new StringBuilder();
		for (String parent : parents) {
			p.append(p.isEmpty() ? "" : ",").append("{\"sha\":\"").append(parent).append("\"}");
		}
		String author = login == null ? "null" : "{\"login\":\"" + login + "\"}";
		return """
				{"sha":"%s","commit":{"message":%s,"author":{"name":"x"}},"author":%s,"parents":[%s]}"""
			.formatted(sha, quote(message), author, p);
	}

	static String list(String... items) {
		return "[" + String.join(",", items) + "]";
	}

	static String file(String content) {
		String b64 = Base64.getMimeEncoder().encodeToString(content.getBytes(StandardCharsets.UTF_8));
		return "{\"type\":\"file\",\"encoding\":\"base64\",\"content\":" + quote(b64) + "}";
	}

	static String commitDetail(String sha, String message, String filename, String patch) {
		return """
				{"sha":"%s","commit":{"message":%s},"files":[{"filename":"%s","patch":%s}]}"""
			.formatted(sha, quote(message), filename, quote(patch));
	}

	static String quote(String s) {
		return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\r", "\\r").replace("\n", "\\n") + "\"";
	}

	static HttpHeaders rateLimited() {
		HttpHeaders h = new HttpHeaders();
		h.add("x-ratelimit-remaining", "0");
		return h;
	}

}
