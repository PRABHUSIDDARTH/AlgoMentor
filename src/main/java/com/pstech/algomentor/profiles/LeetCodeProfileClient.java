package com.pstech.algomentor.profiles;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import static com.pstech.algomentor.profiles.ProfileFetch.require;

/** Reads a public LeetCode profile through LeetCode's GraphQL endpoint (no login). */
public class LeetCodeProfileClient {

	private static final String SITE = "LeetCode";

	private static final String QUERY = """
			query profile($u: String!) {
			  matchedUser(username: $u) {
			    username
			    profile { ranking }
			    submitStatsGlobal { acSubmissionNum { difficulty count } }
			    tagProblemCounts {
			      advanced { tagName problemsSolved }
			      intermediate { tagName problemsSolved }
			      fundamental { tagName problemsSolved }
			    }
			  }
			  recentAcSubmissionList(username: $u, limit: 20) { title titleSlug timestamp }
			}""";

	private final RestClient http;

	private final String baseUrl;

	public LeetCodeProfileClient(RestClient http, String baseUrl) {
		this.http = http;
		this.baseUrl = baseUrl;
	}

	public Profiles.LeetCodeProfile fetch(String user) {
		return ProfileFetch.call(SITE, user, () -> {
			String body = http.post()
				.uri(baseUrl + "/graphql")
				.header("Referer", baseUrl + "/u/" + user + "/")
				.body(Map.of("query", QUERY, "variables", Map.of("u", user)))
				.retrieve()
				.body(String.class);
			JsonNode data = require(ProfileFetch.json(body), "data");
			JsonNode u = data.get("matchedUser");
			if (u == null || u.isNull()) {
				throw ProfileFetch.notFound(SITE, user);
			}
			return new Profiles.LeetCodeProfile(require(u, "username").asString(),
					u.path("profile").path("ranking").isNumber() ? u.path("profile").path("ranking").asInt() : null,
					solved(require(require(u, "submitStatsGlobal"), "acSubmissionNum")), topics(require(u, "tagProblemCounts")),
					recent(data.get("recentAcSubmissionList")));
		});
	}

	private static Profiles.Solved solved(JsonNode counts) {
		int easy = 0, medium = 0, hard = 0, total = 0;
		for (JsonNode c : counts) {
			int n = require(c, "count").asInt();
			switch (require(c, "difficulty").asString()) {
				case "Easy" -> easy = n;
				case "Medium" -> medium = n;
				case "Hard" -> hard = n;
				case "All" -> total = n;
				default -> {
				}
			}
		}
		return new Profiles.Solved(easy, medium, hard, total);
	}

	private static List<Profiles.TopicCount> topics(JsonNode tiers) {
		List<Profiles.TopicCount> topics = new ArrayList<>();
		for (String tier : List.of("fundamental", "intermediate", "advanced")) {
			for (JsonNode t : tiers.path(tier)) {
				topics.add(new Profiles.TopicCount(require(t, "tagName").asString(), require(t, "problemsSolved").asInt()));
			}
		}
		topics.sort(Comparator.comparingInt(Profiles.TopicCount::solved).reversed());
		return List.copyOf(topics);
	}

	private static List<Profiles.RecentSolve> recent(JsonNode list) {
		List<Profiles.RecentSolve> recent = new ArrayList<>();
		if (list != null && list.isArray()) {
			for (JsonNode r : list) {
				recent.add(new Profiles.RecentSolve(require(r, "titleSlug").asString(), require(r, "title").asString(),
						Long.parseLong(require(r, "timestamp").asString())));
			}
		}
		return List.copyOf(recent);
	}

}
