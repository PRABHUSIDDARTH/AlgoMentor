package com.pstech.algomentor.github;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

import com.pstech.algomentor.github.CheckResult.Detail;
import tools.jackson.databind.JsonNode;

import static com.pstech.algomentor.github.GitChecks.stream;

/** "Make your GitHub shine": the things a recruiter notices in the first minute on a project repo. */
public class RepoHealth {

	static final int COMMITS_NEEDED = 20;

	private static final Pattern SECTION = Pattern.compile("(?m)^##+\\s+\\S");

	private static final Pattern IMAGE = Pattern.compile("!\\[[^\\]]*]\\(|<img\\s", Pattern.CASE_INSENSITIVE);

	private static final Set<String> TEST_DIRS = Set.of("test", "tests", "__tests__", "spec", "specs");

	private static final Pattern TEST_FILE = Pattern.compile("(^|/)(\\w+Tests?\\.(java|kt|cs)|test_\\w+\\.py|\\w+_test\\.(py|go)|[\\w.-]+\\.(test|spec)\\.[jt]sx?)$");

	private final GitHubClient gh;

	public RepoHealth(GitHubClient gh) {
		this.gh = gh;
	}

	public CheckResult check(String owner, String repo) {
		JsonNode info = gh.repo(owner, repo);
		String branch = info.path("default_branch").asString("main");
		Optional<String> readme = gh.readme(owner, repo);
		List<String> paths = stream(gh.tree(owner, repo, branch).path("tree")).map((t) -> t.path("path").asString("")).toList();
		long sections = readme.map((r) -> SECTION.matcher(r).results().count()).orElse(0L);
		boolean image = readme.map((r) -> IMAGE.matcher(r).find()).orElse(false);
		boolean tests = paths.stream().anyMatch((p) -> TEST_FILE.matcher(p).find()
				|| List.of(p.split("/")).subList(0, Math.max(0, p.split("/").length - 1)).stream().anyMatch(TEST_DIRS::contains));
		boolean ci = paths.stream().anyMatch((p) -> p.startsWith(".github/workflows/") && (p.endsWith(".yml") || p.endsWith(".yaml")));
		boolean license = info.path("license").isObject();
		boolean topics = info.path("topics").size() > 0;
		boolean homepage = !info.path("homepage").asString("").isBlank();
		long commits = stream(gh.commits(owner, repo, branch)).filter((c) -> GitChecks.meaningful(c.path("commit").path("message").asString(""))).count();
		boolean tag = stream(gh.tags(owner, repo)).anyMatch((t) -> GitChecks.releaseVersion(t.path("name").asString("")));
		return CheckResult.of(List.of(
				new Detail(sections >= 3, readme.isEmpty() ? "Add a README with sections: what it is, how to run it, how it works"
						: "README has %d %s (needs 3: what it is, how to run it, how it works)".formatted(sections, sections == 1 ? "section" : "sections")),
				new Detail(image, image ? "README shows a screenshot or GIF" : "Add a screenshot or GIF to the README"),
				new Detail(tests, tests ? "Has tests" : "Add a tests directory"),
				new Detail(ci, ci ? "CI workflow runs on GitHub Actions" : "Add a CI workflow under .github/workflows"),
				new Detail(license, license ? "Has a license" : "Add a license (MIT is a common choice)"),
				new Detail(topics, topics ? "Topics are set" : "Set topics in the repository's About box"),
				new Detail(homepage, homepage ? "Has a demo or homepage link" : "Add a demo or homepage link in the About box"),
				new Detail(commits >= COMMITS_NEEDED, "%d of %d meaningful commits".formatted(Math.min(commits, COMMITS_NEEDED), COMMITS_NEEDED)),
				new Detail(tag, tag ? "Has a release tag" : "Tag a release (v1.0.0)")));
	}

}
