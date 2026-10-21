package com.pstech.algomentor.leetcode;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.pstech.algomentor.web.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * Looks up LeetCode problems through LeetCode's public (unofficial) endpoints:
 * {@code /api/problems/all/} maps problem numbers to slugs, and {@code /graphql} returns the
 * statement. Both are cached so repeated lookups don't hit LeetCode.
 */
public class LeetCodeClient {

	private static final Logger log = LoggerFactory.getLogger(LeetCodeClient.class);

	private static final Duration SLUG_MAP_TTL = Duration.ofDays(1);

	private static final String QUESTION_QUERY = """
			query question($titleSlug: String!) {
			  question(titleSlug: $titleSlug) {
			    questionFrontendId title titleSlug difficulty isPaidOnly content topicTags { name }
			  }
			}""";

	private static final String UNAVAILABLE = "Couldn't reach LeetCode right now. Paste the problem statement instead.";

	private final RestClient http;

	private final String baseUrl;

	private final Cache<String, Problem> problems = Caffeine.newBuilder()
		.expireAfterWrite(Duration.ofDays(1))
		.maximumSize(5_000)
		.build();

	private Map<Integer, String> slugsByNumber = Map.of();

	private Instant slugsLoadedAt = Instant.EPOCH;

	public LeetCodeClient(RestClient http, String baseUrl) {
		this.http = http;
		this.baseUrl = baseUrl;
	}

	public record Problem(String number, String title, String slug, String difficulty, List<String> tags,
			String url, String statement) {
	}

	public Problem fetch(ProblemRef ref) {
		String slug = ref.slug() != null ? ref.slug() : slugFor(ref.number());
		Problem cached = problems.getIfPresent(slug);
		if (cached != null) {
			return cached;
		}
		Problem problem = fetchBySlug(slug, ref);
		problems.put(slug, problem);
		return problem;
	}

	private Problem fetchBySlug(String slug, ProblemRef ref) {
		GraphQlResponse response;
		try {
			String body = http.post()
				.uri("/graphql")
				.header("Referer", baseUrl + "/problems/" + slug + "/")
				.body(Map.of("query", QUESTION_QUERY, "variables", Map.of("titleSlug", slug)))
				.retrieve()
				.body(String.class);
			response = readJson(body, GraphQlResponse.class);
		}
		catch (RestClientException ex) {
			log.warn("LeetCode question lookup failed for {}", slug, ex);
			throw new ApiException(HttpStatus.BAD_GATEWAY, UNAVAILABLE);
		}

		Question q = response == null || response.data() == null ? null : response.data().question();
		if (q == null) {
			throw notFound(ref);
		}
		if (q.content() == null || q.content().isBlank()) {
			String message = q.isPaidOnly()
					? "LeetCode %s. %s is a Premium problem, so its statement isn't public. Paste it instead."
						.formatted(q.questionFrontendId(), q.title())
					: "LeetCode didn't return a statement for this problem. Paste it instead.";
			throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, message);
		}
		List<String> tags = q.topicTags() == null ? List.of() : q.topicTags().stream().map(Tag::name).toList();
		return new Problem(q.questionFrontendId(), q.title(), q.titleSlug(), q.difficulty(), tags,
				baseUrl + "/problems/" + q.titleSlug() + "/", HtmlToMarkdown.convert(q.content()));
	}

	private synchronized String slugFor(int number) {
		if (Instant.now().isAfter(slugsLoadedAt.plus(SLUG_MAP_TTL))) {
			try {
				slugsByNumber = loadSlugs();
				slugsLoadedAt = Instant.now();
			}
			catch (RestClientException ex) {
				// Keep using a stale map if we have one; it only changes when LeetCode adds problems.
				log.warn("Couldn't load LeetCode problem list", ex);
				if (slugsByNumber.isEmpty()) {
					throw new ApiException(HttpStatus.BAD_GATEWAY, UNAVAILABLE);
				}
			}
		}
		String slug = slugsByNumber.get(number);
		if (slug == null) {
			throw notFound(new ProblemRef(number, null));
		}
		return slug;
	}

	private Map<Integer, String> loadSlugs() {
		ProblemList list = readJson(http.get().uri("/api/problems/all/").retrieve().body(String.class),
				ProblemList.class);
		Map<Integer, String> slugs = new HashMap<>();
		if (list != null && list.pairs() != null) {
			for (ProblemList.Pair pair : list.pairs()) {
				if (pair.stat() != null && pair.stat().slug() != null) {
					slugs.put(pair.stat().number(), pair.stat().slug());
				}
			}
		}
		if (slugs.isEmpty()) {
			throw new RestClientException("LeetCode returned an empty problem list");
		}
		return Map.copyOf(slugs);
	}

	// LeetCode labels its JSON as text/html, so Spring won't convert it; parse it ourselves.
	private static <T> T readJson(String body, Class<T> type) {
		if (body == null || body.isBlank()) {
			return null;
		}
		try {
			return JsonMapper.shared().readValue(body, type);
		}
		catch (JacksonException ex) {
			throw new RestClientException("LeetCode returned invalid JSON", ex);
		}
	}

	private static ApiException notFound(ProblemRef ref) {
		return new ApiException(HttpStatus.NOT_FOUND, "Couldn't find LeetCode problem %s.".formatted(ref));
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record ProblemList(@JsonProperty("stat_status_pairs") List<Pair> pairs) {

		@JsonIgnoreProperties(ignoreUnknown = true)
		record Pair(Stat stat) {
		}

		@JsonIgnoreProperties(ignoreUnknown = true)
		record Stat(@JsonProperty("frontend_question_id") int number,
				@JsonProperty("question__title_slug") String slug) {
		}

	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record GraphQlResponse(Data data) {

		@JsonIgnoreProperties(ignoreUnknown = true)
		record Data(Question question) {
		}

	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Question(String questionFrontendId, String title, String titleSlug, String difficulty, boolean isPaidOnly,
			String content, List<Tag> topicTags) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Tag(String name) {
	}

}
