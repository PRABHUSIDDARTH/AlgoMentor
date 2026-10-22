package com.pstech.algomentor.github;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

import com.pstech.algomentor.web.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriUtils;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Read-only GitHub REST calls for public repositories. A missing repository (or a private one, which
 * GitHub reports the same way) is a 404 with a fix-it message; rate limiting is a 503.
 */
public class GitHubClient {

	static final String NOT_PUBLIC = "Make the repository public to verify it.";

	static final String BUSY = "GitHub checks are busy, try again in a few minutes.";

	private static final Logger log = LoggerFactory.getLogger(GitHubClient.class);

	private final RestClient http;

	private final String baseUrl;

	private final String token;

	public GitHubClient(RestClient http, String baseUrl, String token) {
		this.http = http;
		this.baseUrl = baseUrl;
		this.token = token == null ? "" : token.strip();
	}

	public JsonNode repo(String owner, String repo) {
		return get(owner, repo, "");
	}

	public JsonNode commits(String owner, String repo, String branch) {
		return get(owner, repo, "/commits?sha=" + q(branch) + "&per_page=100");
	}

	/** Commits reachable from {@code branch} that changed {@code path}. */
	public JsonNode commitsTouching(String owner, String repo, String branch, String path) {
		return get(owner, repo, "/commits?sha=" + q(branch) + "&path=" + q(path) + "&per_page=100");
	}

	public Optional<JsonNode> commit(String owner, String repo, String sha) {
		return find(owner, repo, "/commits/" + p(sha));
	}

	public JsonNode closedPulls(String owner, String repo) {
		return get(owner, repo, "/pulls?state=closed&per_page=100");
	}

	public JsonNode tags(String owner, String repo) {
		return get(owner, repo, "/tags?per_page=100");
	}

	public JsonNode releases(String owner, String repo) {
		return get(owner, repo, "/releases?per_page=100");
	}

	public JsonNode branches(String owner, String repo) {
		return get(owner, repo, "/branches?per_page=100");
	}

	/** The ref for a tag: its object type is "tag" for an annotated tag and "commit" for a lightweight one. */
	public Optional<JsonNode> tagRef(String owner, String repo, String tag) {
		return find(owner, repo, "/git/ref/tags/" + p(tag));
	}

	public JsonNode tree(String owner, String repo, String ref) {
		return get(owner, repo, "/git/trees/" + p(ref) + "?recursive=1");
	}

	/** Empty when either side doesn't exist on GitHub. */
	public Optional<JsonNode> compare(String owner, String repo, String base, String head) {
		return find(owner, repo, "/compare/" + p(base) + "..." + p(head));
	}

	/** A text file's contents at {@code ref}, or empty when it isn't there. */
	public Optional<String> text(String owner, String repo, String path, String ref) {
		return find(owner, repo, "/contents/" + p(path) + "?ref=" + q(ref)).map(GitHubClient::decode);
	}

	public Optional<String> readme(String owner, String repo) {
		return find(owner, repo, "/readme").map(GitHubClient::decode);
	}

	private static String decode(JsonNode file) {
		String b64 = file.path("content").asString("").replaceAll("\\s", "");
		return new String(Base64.getDecoder().decode(b64), StandardCharsets.UTF_8);
	}

	private static String p(String segment) {
		return UriUtils.encodePath(segment, StandardCharsets.UTF_8);
	}

	private static String q(String value) {
		return UriUtils.encodeQueryParam(value, StandardCharsets.UTF_8);
	}

	private JsonNode get(String owner, String repo, String path) {
		return find(owner, repo, path).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, NOT_PUBLIC));
	}

	private Optional<JsonNode> find(String owner, String repo, String path) {
		URI uri = URI.create(baseUrl + "/repos/" + p(owner) + "/" + p(repo) + path);
		try {
			return http.get().uri(uri).headers((h) -> {
				h.set("Accept", "application/vnd.github+json");
				h.set("X-GitHub-Api-Version", "2022-11-28");
				if (!token.isEmpty()) {
					h.setBearerAuth(token);
				}
			}).exchange((request, response) -> {
				int status = response.getStatusCode().value();
				if (status == 404 || status == 409) { // 409: an empty repository has no commits or contents
					return Optional.empty();
				}
				boolean exhausted = "0".equals(response.getHeaders().getFirst("x-ratelimit-remaining"));
				if (status == 429 || (status == 403 && exhausted)) {
					throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, BUSY);
				}
				if (status != 200) {
					throw new IllegalStateException("GitHub answered " + status + " for " + uri.getPath());
				}
				return Optional.of(parse(response.getBody().readAllBytes()));
			});
		}
		catch (ApiException ex) {
			throw ex;
		}
		catch (RuntimeException ex) {
			log.warn("GitHub read failed for {}/{}{}", owner, repo, path, ex);
			throw new ApiException(HttpStatus.BAD_GATEWAY, "Couldn't read the repository from GitHub right now.");
		}
	}

	private static JsonNode parse(byte[] body) throws IOException {
		String text = new String(body, StandardCharsets.UTF_8);
		if (text.isBlank() || text.stripLeading().startsWith("<")) {
			throw new IOException("Expected JSON from GitHub");
		}
		return JsonMapper.shared().readTree(text);
	}

}
