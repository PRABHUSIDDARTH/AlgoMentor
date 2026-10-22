package com.pstech.algomentor.github;

import java.time.Duration;
import java.util.function.Supplier;
import java.util.regex.Pattern;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.pstech.algomentor.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** Git challenge checks and repo health for public GitHub repositories, cached briefly. */
@RestController
public class GitController {

	static final Duration CACHE_TTL = Duration.ofMinutes(2);

	private static final Pattern NAME = Pattern.compile("^[A-Za-z0-9_.-]{1,100}$");

	private final GitChecks checks;

	private final RepoHealth health;

	// Passing checks only: a learner who fixes something and presses Check again must see the new result at once.
	private final Cache<String, CheckResult> cache = Caffeine.newBuilder().expireAfterWrite(CACHE_TTL).maximumSize(10_000).build();

	public GitController(GitChecks checks, RepoHealth health) {
		this.checks = checks;
		this.health = health;
	}

	@GetMapping("/git/check/{owner}/{repo}/{challenge}")
	public CheckResult check(@PathVariable String owner, @PathVariable String repo, @PathVariable String challenge) {
		validate(owner, repo);
		if (!GitChecks.CHALLENGES.contains(challenge)) {
			throw new ApiException(HttpStatus.NOT_FOUND, "Unknown challenge: " + challenge);
		}
		return cached(owner, repo, challenge, () -> checks.check(owner.toLowerCase(), repo.toLowerCase(), challenge));
	}

	@GetMapping("/git/repo-health/{owner}/{repo}")
	public CheckResult health(@PathVariable String owner, @PathVariable String repo) {
		validate(owner, repo);
		return cached(owner, repo, "health", () -> health.check(owner.toLowerCase(), repo.toLowerCase()));
	}

	/** For tests. */
	public void clearCache() {
		cache.invalidateAll();
	}

	private static void validate(String owner, String repo) {
		if (!NAME.matcher(owner).matches() || !NAME.matcher(repo).matches()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Use a repository link like https://github.com/you/your-repo.");
		}
	}

	private CheckResult cached(String owner, String repo, String what, Supplier<CheckResult> run) {
		String key = (owner + "/" + repo + "/" + what).toLowerCase();
		CheckResult hit = cache.getIfPresent(key);
		if (hit != null) {
			return hit;
		}
		CheckResult fresh = run.get();
		if (fresh.passed()) {
			cache.put(key, fresh);
		}
		return fresh;
	}

}
