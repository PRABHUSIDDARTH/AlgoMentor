package com.pstech.algomentor.e2e;

import java.util.List;

import com.pstech.algomentor.github.CheckResult;
import com.pstech.algomentor.github.GitChecks;
import com.pstech.algomentor.github.GitHubClient;
import com.pstech.algomentor.github.RepoHealth;
import com.pstech.algomentor.web.ApiException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;

/** Fixed GitHub state for browser tests: demo/library has done challenges 1–3 and nothing else; other repos are private. */
@Configuration
@Profile("e2e")
public class StubGitHubConfig {

	private static final List<String> DONE = List.of("first-commit", "meaningful-commits", "feature-pr");

	private static final GitHubClient UNUSED = new GitHubClient(RestClient.create(), "http://unused.invalid", "");

	private static void requireDemo(String owner, String repo) {
		if (!"demo".equals(owner) || !"library".equals(repo)) {
			throw new ApiException(HttpStatus.NOT_FOUND, "Make the repository public to verify it.");
		}
	}

	@Bean
	GitChecks gitChecks() {
		return new GitChecks(UNUSED) {
			@Override
			public CheckResult check(String owner, String repo, String challenge) {
				requireDemo(owner, repo);
				boolean done = DONE.contains(challenge);
				return new CheckResult(done, List.of(new CheckResult.Detail(done, done ? "Looks good" : "Not done yet")));
			}
		};
	}

	@Bean
	RepoHealth repoHealth() {
		return new RepoHealth(UNUSED) {
			@Override
			public CheckResult check(String owner, String repo) {
				requireDemo(owner, repo);
				return new CheckResult(false, List.of(new CheckResult.Detail(true, "README has 3 sections"),
						new CheckResult.Detail(false, "Add a CI workflow under .github/workflows")));
			}
		};
	}

}
