package com.pstech.algomentor.profiles;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

/** Reads a public GitHub user and their 100 most recently pushed repositories through the REST API. */
public class GitHubProfileClient {

	private static final String SITE = "GitHub";

	private final RestClient http;

	private final String baseUrl;

	private final String token;

	public GitHubProfileClient(RestClient http, String baseUrl, String token) {
		this.http = http;
		this.baseUrl = baseUrl;
		this.token = token == null ? "" : token.strip();
	}

	public Profiles.GitHubProfile fetch(String user) {
		return ProfileFetch.call(SITE, user, () -> {
			JsonNode u = get(baseUrl + "/users/" + user);
			int publicRepos = ProfileFetch.require(u, "public_repos").asInt();
			int followers = ProfileFetch.require(u, "followers").asInt();
			String login = ProfileFetch.require(u, "login").asString();
			JsonNode repos = get(baseUrl + "/users/" + user + "/repos?per_page=100&sort=pushed");
			int stars = 0;
			Long lastPush = null;
			Map<String, Integer> languages = new TreeMap<>();
			for (JsonNode r : repos) {
				String pushed = r.path("pushed_at").asString("");
				if (!pushed.isEmpty()) {
					long at = Instant.parse(pushed).getEpochSecond();
					lastPush = lastPush == null ? at : Math.max(lastPush, at);
				}
				if (r.path("fork").asBoolean(false)) {
					continue;
				}
				stars += r.path("stargazers_count").asInt(0);
				String lang = r.path("language").asString("");
				if (!lang.isEmpty()) {
					languages.merge(lang, 1, Integer::sum);
				}
			}
			List<String> top = new ArrayList<>(languages.keySet());
			// Most used first; the TreeMap already orders ties by name.
			top.sort(Comparator.comparingInt((String l) -> -languages.get(l)));
			return new Profiles.GitHubProfile(login, publicRepos, followers, stars, top.subList(0, Math.min(5, top.size())), lastPush);
		});
	}

	private JsonNode get(String url) {
		String body = http.get().uri(url).headers((h) -> {
			h.set("Accept", "application/vnd.github+json");
			h.set("X-GitHub-Api-Version", "2022-11-28");
			if (!token.isEmpty()) {
				h.setBearerAuth(token);
			}
		}).retrieve().body(String.class);
		return ProfileFetch.json(body);
	}

}
