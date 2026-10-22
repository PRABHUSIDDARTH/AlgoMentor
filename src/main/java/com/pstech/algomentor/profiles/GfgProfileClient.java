package com.pstech.algomentor.profiles;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.web.client.RestClient;

/**
 * Reads a GeeksforGeeks profile. GfG has no public API; the profile page embeds the stats as
 * escaped JSON in a script, so we pick out the few fields we need.
 */
public class GfgProfileClient {

	private static final String SITE = "GeeksforGeeks";

	// The profile's own score is the one immediately followed by monthly_score.
	private static final Pattern SCORE = Pattern.compile("\\\\?\"score\\\\?\":(\\d+),\\\\?\"monthly_score");

	private final RestClient http;

	private final String baseUrl;

	public GfgProfileClient(RestClient http, String baseUrl) {
		this.http = http;
		this.baseUrl = baseUrl;
	}

	public Profiles.GfgProfile fetch(String user) {
		return ProfileFetch.call(SITE, user, () -> {
			String html = http.get().uri(baseUrl + "/profile/{u}/", user).retrieve().body(String.class);
			if (html == null) {
				throw new IllegalStateException("Empty page");
			}
			Integer solved = number(html, "total_problems_solved");
			Matcher score = SCORE.matcher(html);
			if (solved == null || !score.find()) {
				throw new IllegalStateException("Profile stats not found in page");
			}
			return new Profiles.GfgProfile(user, solved, Integer.parseInt(score.group(1)), number(html, "institute_rank"),
					number(html, "pod_solved_current_streak"));
		});
	}

	private static Integer number(String html, String field) {
		Matcher m = Pattern.compile("\\\\?\"" + Pattern.quote(field) + "\\\\?\":(\\d+)").matcher(html);
		return m.find() ? Integer.valueOf(m.group(1)) : null;
	}

}
