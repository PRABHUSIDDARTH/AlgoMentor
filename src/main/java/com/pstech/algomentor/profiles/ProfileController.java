package com.pstech.algomentor.profiles;

import java.time.Duration;
import java.util.function.Function;
import java.util.regex.Pattern;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.pstech.algomentor.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Public profile stats for LeetCode, HackerRank, GeeksforGeeks and GitHub, cached for six hours. */
@RestController
public class ProfileController {

	private static final Pattern USERNAME = Pattern.compile("^[A-Za-z0-9_.-]{1,40}$");

	private final LeetCodeProfileClient leetCode;

	private final HackerRankProfileClient hackerRank;

	private final GfgProfileClient gfg;

	private final GitHubProfileClient gitHub;

	// Successful reads only: a failure should be retried on the next request.
	private final Cache<String, Object> cache = Caffeine.newBuilder()
		.expireAfterWrite(Duration.ofHours(6))
		.maximumSize(10_000)
		.build();

	public ProfileController(LeetCodeProfileClient leetCode, HackerRankProfileClient hackerRank, GfgProfileClient gfg,
			GitHubProfileClient gitHub) {
		this.leetCode = leetCode;
		this.hackerRank = hackerRank;
		this.gfg = gfg;
		this.gitHub = gitHub;
	}

	@GetMapping("/profiles/leetcode/{user}")
	public Profiles.LeetCodeProfile leetCode(@PathVariable String user, @RequestParam(defaultValue = "false") boolean refresh) {
		return cached("leetcode", user, refresh, leetCode::fetch);
	}

	@GetMapping("/profiles/hackerrank/{user}")
	public Profiles.HackerRankProfile hackerRank(@PathVariable String user, @RequestParam(defaultValue = "false") boolean refresh) {
		return cached("hackerrank", user, refresh, hackerRank::fetch);
	}

	@GetMapping("/profiles/gfg/{user}")
	public Profiles.GfgProfile gfg(@PathVariable String user, @RequestParam(defaultValue = "false") boolean refresh) {
		return cached("gfg", user, refresh, gfg::fetch);
	}

	@GetMapping("/profiles/github/{user}")
	public Profiles.GitHubProfile gitHub(@PathVariable String user, @RequestParam(defaultValue = "false") boolean refresh) {
		return cached("github", user, refresh, gitHub::fetch);
	}

	/** For tests. */
	public void clearCache() {
		cache.invalidateAll();
	}

	@SuppressWarnings("unchecked")
	private <T> T cached(String site, String user, boolean refresh, Function<String, T> fetch) {
		if (!USERNAME.matcher(user).matches()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "That doesn't look like a username. Use letters, digits, _ . or -.");
		}
		String key = site + ":" + user.toLowerCase();
		if (refresh) {
			// "Refresh" in Settings: read the site again (still rate-limited), and keep the new result.
			T fresh = fetch.apply(user);
			cache.put(key, fresh);
			return fresh;
		}
		return (T) cache.get(key, k -> fetch.apply(user));
	}

}
