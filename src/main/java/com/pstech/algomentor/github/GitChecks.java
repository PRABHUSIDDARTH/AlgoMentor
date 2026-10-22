package com.pstech.algomentor.github;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.pstech.algomentor.github.CheckResult.Detail;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * The ten Git challenges, each checked against the learner's public repository. Challenges with a
 * setup script read its marker file ({@code .algomentor/<challenge>.json}) from the default branch.
 * Checks look at repository state only; they never inspect code.
 */
public class GitChecks {

	public static final List<String> CHALLENGES = List.of("first-commit", "meaningful-commits", "feature-pr", "merge-conflict",
			"squash", "revert", "rescue-branch", "cherry-pick", "release", "remove-secret");

	static final int MEANINGFUL_NEEDED = 5;

	private static final Set<String> FILLER = Set.of("update", "updates", "updated", "fix", "fixes", "fixed", "wip", "stuff", "file",
			"files", "code", "changes", "change", "minor", "small", "some", "things", "more", "misc", "the", "a", "an", "and", "here", "it",
			"this", "again", "final", "commit", "work", "test");

	// Imperative verbs that happen to end in -ed or -ing.
	private static final Set<String> NOT_PAST = Set.of("embed", "speed", "seed", "feed", "need", "shed", "proceed", "exceed", "succeed",
			"bring", "ring", "ping", "string", "swing", "spring");

	private static final Pattern SHA = Pattern.compile("^[0-9a-f]{40}$");

	private static final Pattern SAFE_FILE = Pattern.compile("^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$");

	private static final Pattern SEMVER = Pattern.compile("^v?(\\d+)\\.(\\d+)\\.(\\d+)$");

	private final GitHubClient gh;

	public GitChecks(GitHubClient gh) {
		this.gh = gh;
	}

	public CheckResult check(String owner, String repo, String challenge) {
		JsonNode info = gh.repo(owner, repo);
		String branch = info.path("default_branch").asString("main");
		Repo r = new Repo(owner, repo, branch, info);
		return switch (challenge) {
			case "first-commit" -> firstCommit(r);
			case "meaningful-commits" -> meaningfulCommits(r);
			case "feature-pr" -> featurePr(r);
			case "merge-conflict" -> withMarker(r, challenge, this::mergeConflict);
			case "squash" -> withMarker(r, challenge, this::squash);
			case "revert" -> withMarker(r, challenge, this::revert);
			case "rescue-branch" -> withMarker(r, challenge, this::rescueBranch);
			case "cherry-pick" -> withMarker(r, challenge, this::cherryPick);
			case "release" -> release(r);
			case "remove-secret" -> withMarker(r, challenge, this::removeSecret);
			default -> throw new IllegalArgumentException("Unknown challenge " + challenge);
		};
	}

	record Repo(String owner, String name, String branch, JsonNode info) {
	}

	private interface MarkerCheck {

		CheckResult run(Repo repo, JsonNode marker);

	}

	private CheckResult withMarker(Repo r, String challenge, MarkerCheck check) {
		Optional<JsonNode> marker = gh.text(r.owner(), r.name(), ".algomentor/" + challenge + ".json", r.branch()).flatMap(GitChecks::json);
		if (marker.isEmpty() || !challenge.equals(marker.get().path("challenge").asString(""))) {
			return CheckResult.of(List.of(new Detail(false,
					"No challenge marker on %s yet. Run the setup script in your clone, then push %s.".formatted(r.branch(), r.branch()))));
		}
		if (!validMarker(marker.get())) {
			return CheckResult.of(List.of(new Detail(false,
					"The challenge marker on %s looks wrong. Run the setup script again in a fresh clone.".formatted(r.branch()))));
		}
		return check.run(r, marker.get());
	}

	/**
	 * The marker is a file in the learner's repository, so its values are untrusted: they end up in GitHub API
	 * paths. Only a full commit hash and a plain relative file path are accepted.
	 */
	static boolean validMarker(JsonNode m) {
		JsonNode sha = m.path("commitSha");
		if (!sha.isMissingNode() && !(sha.isString() && SHA.matcher(sha.asString()).matches())) {
			return false;
		}
		JsonNode file = m.path("file");
		if (!file.isMissingNode() && !(file.isString() && safeFile(file.asString()))) {
			return false;
		}
		JsonNode subject = m.path("subject");
		return subject.isMissingNode() || (subject.isString() && subject.asString().length() <= 120);
	}

	private static boolean safeFile(String file) {
		return SAFE_FILE.matcher(file).matches() && Arrays.stream(file.split("/")).noneMatch((s) -> s.equals(".") || s.equals(".."));
	}

	private static Optional<JsonNode> json(String text) {
		try {
			JsonNode node = JsonMapper.shared().readTree(text);
			return node.isObject() ? Optional.of(node) : Optional.empty();
		}
		catch (RuntimeException ex) {
			return Optional.empty();
		}
	}

	static String subject(String message) {
		int nl = message.indexOf('\n');
		return (nl < 0 ? message : message.substring(0, nl)).strip();
	}

	private static String message(JsonNode commit) {
		return commit.path("commit").path("message").asString("");
	}

	/**
	 * A commit subject that says what changed: 10–72 characters, imperative ("Add", not "Added" or
	 * "Adding"), not a merge, and not only filler such as "update files" or "wip".
	 */
	public static boolean meaningful(String message) {
		String s = subject(message);
		if (s.length() < 10 || s.length() > 72 || s.startsWith("Merge ")) {
			return false;
		}
		List<String> words = Arrays.stream(s.toLowerCase(Locale.ROOT).split("[^a-z0-9]+")).filter((w) -> !w.isEmpty()).toList();
		if (words.isEmpty() || words.stream().allMatch(FILLER::contains)) {
			return false;
		}
		String first = words.get(0);
		boolean pastOrGerund = (first.endsWith("ed") || first.endsWith("ing")) && !NOT_PAST.contains(first);
		return !pastOrGerund && !first.equals("wip");
	}

	private CheckResult firstCommit(Repo r) {
		String login = r.info().path("owner").path("login").asString(r.owner());
		boolean ownerCommit = false;
		JsonNode commits = gh.commits(r.owner(), r.name(), r.branch());
		for (JsonNode c : commits) {
			ownerCommit |= login.equalsIgnoreCase(c.path("author").path("login").asString(""));
		}
		boolean readme = gh.readme(r.owner(), r.name()).isPresent();
		String commitText = commits.isEmpty() ? "The repository has no commits yet: make your first commit and push it."
				: ownerCommit ? "There's a commit by %s on %s".formatted(login, r.branch())
						: "No commit on %s is linked to %s's GitHub account. Check git config user.email.".formatted(r.branch(), login);
		return CheckResult.of(List.of(new Detail(true, "The repository is public"),
				new Detail(ownerCommit, commitText),
				new Detail(readme, readme ? "README found" : "Add a README and push it")));
	}

	private CheckResult meaningfulCommits(Repo r) {
		int good = 0;
		String weak = null;
		for (JsonNode c : gh.commits(r.owner(), r.name(), r.branch())) {
			String m = message(c);
			if (meaningful(m)) {
				good++;
			}
			else if (weak == null && !subject(m).startsWith("Merge ")) {
				weak = subject(m);
			}
		}
		List<Detail> details = new ArrayList<>();
		details.add(new Detail(good >= MEANINGFUL_NEEDED, "%d of %d meaningful commit messages on %s".formatted(Math.min(good, MEANINGFUL_NEEDED),
				MEANINGFUL_NEEDED, r.branch())));
		if (good < MEANINGFUL_NEEDED && weak != null) {
			details.add(new Detail(false, "\"%s\" doesn't say what changed. Write subjects like \"Add due dates to loans\".".formatted(weak)));
		}
		return CheckResult.of(details);
	}

	private CheckResult featurePr(Repo r) {
		Optional<JsonNode> pr = stream(gh.closedPulls(r.owner(), r.name()))
			.filter((p) -> !p.path("merged_at").isNull() && !p.path("merged_at").isMissingNode())
			.filter((p) -> !r.branch().equals(p.path("head").path("ref").asString("")))
			.findFirst();
		return CheckResult.of(List.of(new Detail(pr.isPresent(), pr.map((p) -> "Pull request #%d from %s was merged"
			.formatted(p.path("number").asInt(), p.path("head").path("ref").asString("")))
			.orElse("No merged pull request from a feature branch yet"))));
	}

	private CheckResult mergeConflict(Repo r, JsonNode marker) {
		String file = marker.path("file").asString("conflict.txt");
		boolean merged = stream(gh.commits(r.owner(), r.name(), r.branch()))
			.filter((c) -> c.path("parents").size() == 2)
			.limit(10)
			.anyMatch((c) -> touches(r, c.path("sha").asString(""), file) || touches(r, c.path("parents").path(1).path("sha").asString(""), file));
		Optional<String> content = gh.text(r.owner(), r.name(), file, r.branch());
		boolean clean = content.isPresent() && content.get().lines()
			.noneMatch((l) -> l.startsWith("<<<<<<<") || l.equals("=======") || l.startsWith(">>>>>>>"));
		return CheckResult.of(List.of(
				new Detail(merged, merged ? "A merge commit on %s resolves %s".formatted(r.branch(), file)
						: "No merge commit on %s touches %s yet".formatted(r.branch(), file)),
				new Detail(clean, clean ? "%s has no conflict markers left".formatted(file)
						: content.isEmpty() ? "%s is missing on %s".formatted(file, r.branch())
								: "%s still has conflict markers (<<<<<<<, =======, >>>>>>>)".formatted(file))));
	}

	/**
	 * Whether a commit changed {@code file}. GitHub lists a merge commit's files against its first parent, so a
	 * learner who resolved by keeping the first parent's line is recognised through the second parent instead.
	 */
	private boolean touches(Repo r, String sha, String file) {
		return !sha.isEmpty() && gh.commit(r.owner(), r.name(), sha)
			.map((d) -> stream(d.path("files")).anyMatch((f) -> file.equals(f.path("filename").asString(""))))
			.orElse(false);
	}

	private CheckResult squash(Repo r, JsonNode marker) {
		Optional<JsonNode> cmp = gh.compare(r.owner(), r.name(), r.branch(), "feature/squash");
		if (cmp.isEmpty()) {
			return CheckResult.of(List.of(new Detail(false, "feature/squash isn't on GitHub. Push it after squashing.")));
		}
		int ahead = cmp.get().path("ahead_by").asInt();
		JsonNode commits = cmp.get().path("commits");
		String subject = commits.size() > 0 ? subject(message(commits.get(commits.size() - 1))) : "";
		return CheckResult.of(List.of(
				new Detail(ahead == 1, "feature/squash has %d %s on top of %s (needs exactly 1)".formatted(ahead, ahead == 1 ? "commit" : "commits",
						r.branch())),
				new Detail("Add squash feature".equals(subject), "The commit message is \"Add squash feature\"")));
	}

	private CheckResult revert(Repo r, JsonNode marker) {
		String sha = marker.path("commitSha").asString("");
		boolean reverted = !sha.isEmpty() && stream(gh.commits(r.owner(), r.name(), r.branch()))
			.map(GitChecks::message)
			.anyMatch((m) -> subject(m).startsWith("Revert \"") && m.contains("This reverts commit " + sha));
		return CheckResult.of(List.of(new Detail(reverted, reverted ? "%s has a revert of %s".formatted(r.branch(), shortSha(sha))
				: "No commit on %s reverts %s yet (use git revert, don't rewrite history)".formatted(r.branch(), shortSha(sha)))));
	}

	private CheckResult rescueBranch(Repo r, JsonNode marker) {
		String sha = marker.path("commitSha").asString("");
		Optional<JsonNode> cmp = sha.isEmpty() ? Optional.empty() : gh.compare(r.owner(), r.name(), sha, "feature/rescue");
		if (cmp.isEmpty()) {
			return CheckResult.of(List.of(new Detail(false, "feature/rescue isn't on GitHub yet. Recover it from the reflog and push it.")));
		}
		String status = cmp.get().path("status").asString("");
		boolean contains = status.equals("identical") || status.equals("ahead");
		return CheckResult.of(List.of(new Detail(contains, contains ? "feature/rescue is back and has commit %s".formatted(shortSha(sha))
				: "feature/rescue exists but doesn't contain commit %s".formatted(shortSha(sha)))));
	}

	private CheckResult cherryPick(Repo r, JsonNode marker) {
		String sha = marker.path("commitSha").asString("");
		String wanted = marker.path("subject").asString("");
		String file = marker.path("file").asString("");
		List<JsonNode> onBranch = stream(gh.commits(r.owner(), r.name(), r.branch())).toList();
		if (onBranch.stream().anyMatch((c) -> sha.equals(c.path("sha").asString("")))) {
			return CheckResult.of(List.of(new Detail(false,
					"The hotfix commit itself is on %s, so it was merged, not cherry-picked. Use git cherry-pick to copy it.".formatted(r.branch()))));
		}
		Optional<String> originalPatch = gh.commit(r.owner(), r.name(), sha).flatMap((d) -> patch(d, file));
		boolean picked = onBranch.stream()
			.filter((c) -> subject(message(c)).equals(wanted))
			.limit(5)
			.anyMatch((c) -> gh.commit(r.owner(), r.name(), c.path("sha").asString(""))
				.flatMap((d) -> patch(d, file))
				.map((p) -> originalPatch.isEmpty() || originalPatch.get().equals(p))
				.orElse(false));
		return CheckResult.of(List.of(new Detail(picked, picked ? "%s has the hotfix as a new commit with the same change".formatted(r.branch())
				: "No commit on %s carries the hotfix change to %s yet".formatted(r.branch(), file))));
	}

	private static Optional<String> patch(JsonNode commitDetail, String file) {
		return stream(commitDetail.path("files")).filter((f) -> file.equals(f.path("filename").asString("")))
			.map((f) -> f.path("patch").asString(""))
			.findFirst();
	}

	private CheckResult release(Repo r) {
		List<String> tags = stream(gh.tags(r.owner(), r.name())).map((t) -> t.path("name").asString("")).filter(GitChecks::releaseVersion).toList();
		Optional<String> annotated = tags.stream().limit(5)
			.filter((t) -> gh.tagRef(r.owner(), r.name(), t).map((ref) -> "tag".equals(ref.path("object").path("type").asString(""))).orElse(false))
			.findFirst();
		boolean released = stream(gh.releases(r.owner(), r.name()))
			.anyMatch((rel) -> !rel.path("draft").asBoolean(false) && releaseVersion(rel.path("tag_name").asString("")));
		String tagText = annotated.map((t) -> "Annotated tag " + t + " found")
			.orElse(tags.isEmpty() ? "No v1.0.0 (or later) tag yet" : tags.get(0) + " is a lightweight tag. Create it with git tag -a.");
		return CheckResult.of(List.of(new Detail(annotated.isPresent(), tagText),
				new Detail(released, released ? "A GitHub Release is published for it" : "Publish a GitHub Release for the tag")));
	}

	/** v1.0.0 or later. */
	static boolean releaseVersion(String tag) {
		Matcher m = SEMVER.matcher(tag);
		return m.matches() && Integer.parseInt(m.group(1)) >= 1;
	}

	private CheckResult removeSecret(Repo r, JsonNode marker) {
		String file = marker.path("file").asString("config/secret.key");
		List<String> leaking = stream(gh.branches(r.owner(), r.name())).limit(20)
			.map((b) -> b.path("name").asString(""))
			.filter((b) -> gh.commitsTouching(r.owner(), r.name(), b, file).size() > 0)
			.toList();
		boolean covered = gh.text(r.owner(), r.name(), ".gitignore", r.branch()).map((g) -> ignored(file, g)).orElse(false);
		return CheckResult.of(List.of(
				new Detail(leaking.isEmpty(), leaking.isEmpty() ? "No commit on any branch contains %s".formatted(file)
						: "%s is still in the history of %s".formatted(file, String.join(", ", leaking))),
				new Detail(covered, covered ? ".gitignore covers %s".formatted(file) : "Add %s to .gitignore".formatted(file))));
	}

	/** Whether {@code .gitignore} text ignores {@code path} (last matching rule wins; "!" re-includes). */
	static boolean ignored(String path, String gitignore) {
		boolean result = false;
		for (String raw : gitignore.split("\n")) {
			String line = raw.strip();
			if (line.isEmpty() || line.startsWith("#")) {
				continue;
			}
			boolean negate = line.startsWith("!");
			if (matches(negate ? line.substring(1) : line, path)) {
				result = !negate;
			}
		}
		return result;
	}

	private static boolean matches(String pattern, String path) {
		boolean dirOnly = pattern.endsWith("/");
		String p = dirOnly ? pattern.substring(0, pattern.length() - 1) : pattern;
		boolean anchored = p.contains("/");
		p = p.startsWith("/") ? p.substring(1) : p;
		Pattern re = Pattern.compile(glob(p));
		String[] parts = path.split("/");
		int last = dirOnly ? parts.length - 1 : parts.length; // a directory rule can't match the file itself
		for (int i = 0; i < last; i++) {
			String candidate = anchored ? String.join("/", Arrays.copyOfRange(parts, 0, i + 1)) : parts[i];
			if (re.matcher(candidate).matches()) {
				return true;
			}
		}
		return false;
	}

	private static String glob(String g) {
		StringBuilder re = new StringBuilder();
		for (int i = 0; i < g.length(); i++) {
			char c = g.charAt(i);
			if (g.startsWith("**/", i)) {
				re.append("(.*/)?");
				i += 2;
			}
			else if (g.startsWith("**", i)) {
				re.append(".*");
				i++;
			}
			else if (c == '*') {
				re.append("[^/]*");
			}
			else if (c == '?') {
				re.append("[^/]");
			}
			else {
				re.append(Pattern.quote(String.valueOf(c)));
			}
		}
		return re.toString();
	}

	private static String shortSha(String sha) {
		return sha.length() > 7 ? sha.substring(0, 7) : sha;
	}

	static java.util.stream.Stream<JsonNode> stream(JsonNode array) {
		return array.values().stream();
	}

}
