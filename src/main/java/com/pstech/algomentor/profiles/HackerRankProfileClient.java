package com.pstech.algomentor.profiles;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import static com.pstech.algomentor.profiles.ProfileFetch.require;

/** Reads a HackerRank user's public badges (no login). */
public class HackerRankProfileClient {

	private static final String SITE = "HackerRank";

	private final RestClient http;

	private final String baseUrl;

	public HackerRankProfileClient(RestClient http, String baseUrl) {
		this.http = http;
		this.baseUrl = baseUrl;
	}

	public Profiles.HackerRankProfile fetch(String user) {
		return ProfileFetch.call(SITE, user, () -> {
			String body = http.get().uri(baseUrl + "/rest/hackers/{u}/badges", user).retrieve().body(String.class);
			JsonNode root = ProfileFetch.json(body);
			if (!require(root, "status").asBoolean()) {
				throw ProfileFetch.notFound(SITE, user);
			}
			List<Profiles.Badge> badges = new ArrayList<>();
			for (JsonNode b : require(root, "models")) {
				badges.add(new Profiles.Badge(require(b, "badge_name").asString(), b.path("stars").asInt(),
						b.path("level").asInt(), b.path("solved").asInt()));
			}
			return new Profiles.HackerRankProfile(user, List.copyOf(badges));
		});
	}

}
