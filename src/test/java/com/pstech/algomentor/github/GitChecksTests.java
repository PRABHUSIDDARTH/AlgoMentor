package com.pstech.algomentor.github;

import org.junit.jupiter.api.Test;

import static com.pstech.algomentor.github.FakeGitHub.commit;
import static com.pstech.algomentor.github.FakeGitHub.commitDetail;
import static com.pstech.algomentor.github.FakeGitHub.file;
import static com.pstech.algomentor.github.FakeGitHub.list;
import static org.assertj.core.api.Assertions.assertThat;

/** Each challenge rule against a passing and a failing repository. */
class GitChecksTests {

	static final String COMMITS = "/commits?sha=main&per_page=100";

	static final String LOST = "3".repeat(40);

	static final String HOTFIX = "4".repeat(40);

	FakeGitHub gh = new FakeGitHub("ana", "library");

	CheckResult run(String challenge) {
		return new GitChecks(gh.client()).check("ana", "library", challenge);
	}

	static String marker(String id, String extra) {
		return file("{\"challenge\":\"" + id + "\",\"baseSha\":\"b0\",\"createdAt\":\"2026-10-22T10:00:00Z\"" + extra + "}");
	}

	@Test
	void firstCommitPassesWithReadmeAndOwnerCommit() {
		gh.repo("main").on(COMMITS, list(commit("c1", "Add library catalogue", "ana"))).on("/readme", file("# Library"));
		CheckResult r = run("first-commit");
		assertThat(r.passed()).isTrue();
		assertThat(r.details()).allMatch(CheckResult.Detail::ok);
	}

	@Test
	void firstCommitFailsWithoutReadme() {
		gh.repo("main").on(COMMITS, list(commit("c1", "Add library catalogue", "ana"))).missing("/readme");
		CheckResult r = run("first-commit");
		assertThat(r.passed()).isFalse();
		assertThat(r.details()).anyMatch((d) -> !d.ok() && d.text().contains("README"));
	}

	@Test
	void firstCommitNeedsACommitByTheOwner() {
		gh.repo("main").on(COMMITS, list(commit("c1", "Initial commit", "someone-else"))).on("/readme", file("# Library"));
		assertThat(run("first-commit").passed()).isFalse();
	}

	@Test
	void meaningfulCommitsRule() {
		assertThat(GitChecks.meaningful("Add borrow and return to Library")).isTrue();
		assertThat(GitChecks.meaningful("Fix off-by-one in due date maths")).isTrue();
		assertThat(GitChecks.meaningful("update")).isFalse();
		assertThat(GitChecks.meaningful("Update files")).isFalse();
		assertThat(GitChecks.meaningful("WIP stuff here")).isFalse();
		assertThat(GitChecks.meaningful("fix fix fix fix")).isFalse();
		assertThat(GitChecks.meaningful("Added the book class")).isFalse(); // not imperative
		assertThat(GitChecks.meaningful("Adding the book class")).isFalse();
		assertThat(GitChecks.meaningful("Add x")).isFalse(); // under 10 characters
		assertThat(GitChecks.meaningful("Add " + "a".repeat(70))).isFalse(); // over 72
		assertThat(GitChecks.meaningful("Merge pull request #3 from ana/feature")).isFalse();
		assertThat(GitChecks.meaningful("Add search by author\n\nLonger body that can be any length.")).isTrue();
	}

	@Test
	void meaningfulCommitsNeedsFive() {
		gh.repo("main").on(COMMITS, list(commit("1", "Add Book and Member classes", "ana"), commit("2", "Add borrowing with due dates", "ana"),
				commit("3", "Validate ISBN before saving", "ana"), commit("4", "Extract catalogue search", "ana"), commit("5", "update", "ana"),
				commit("6", "wip", "ana")));
		CheckResult r = run("meaningful-commits");
		assertThat(r.passed()).isFalse();
		assertThat(r.details()).anyMatch((d) -> d.text().contains("4 of 5"));
	}

	@Test
	void featurePrNeedsMergedPrFromNonDefaultBranch() {
		gh.repo("main").on("/pulls?state=closed&per_page=100", """
				[{"number":1,"merged_at":null,"head":{"ref":"feature/a"},"base":{"ref":"main"}},
				 {"number":2,"merged_at":"2026-10-20T10:00:00Z","head":{"ref":"main"},"base":{"ref":"release"}}]""");
		assertThat(run("feature-pr").passed()).isFalse();

		FakeGitHub ok = new FakeGitHub("ana", "library");
		ok.repo("main").on("/pulls?state=closed&per_page=100", """
				[{"number":3,"merged_at":"2026-10-21T10:00:00Z","head":{"ref":"feature/search"},"base":{"ref":"main"}}]""");
		assertThat(new GitChecks(ok.client()).check("ana", "library", "feature-pr").passed()).isTrue();
	}

	@Test
	void mergeConflictNeedsTwoParentMergeTouchingFileWithoutMarkers() {
		gh.repo("main").on("/contents/.algomentor/merge-conflict.json?ref=main", marker("merge-conflict", ",\"file\":\"conflict.txt\""))
			.on(COMMITS, list(commit("m1", "Merge branch 'conflict/theirs'", "ana", "p1", "p2"), commit("p1", "Edit greeting", "ana", "b0")))
			.on("/commits/m1", commitDetail("m1", "Merge", "conflict.txt", "@@ -1 +1 @@\n-hi\n+hello"))
			.on("/contents/conflict.txt?ref=main", file("hello, reader\n"));
		assertThat(run("merge-conflict").passed()).isTrue();

		FakeGitHub markers = new FakeGitHub("ana", "library");
		markers.repo("main").on("/contents/.algomentor/merge-conflict.json?ref=main", marker("merge-conflict", ",\"file\":\"conflict.txt\""))
			.on(COMMITS, list(commit("m1", "Merge branch 'conflict/theirs'", "ana", "p1", "p2")))
			.on("/commits/m1", commitDetail("m1", "Merge", "conflict.txt", "+<<<<<<< HEAD"))
			.on("/contents/conflict.txt?ref=main", file("<<<<<<< HEAD\nhello\n=======\nhi\n>>>>>>> theirs\n"));
		CheckResult r = new GitChecks(markers.client()).check("ana", "library", "merge-conflict");
		assertThat(r.passed()).isFalse();
		assertThat(r.details()).anyMatch((d) -> !d.ok() && d.text().contains("conflict markers"));
	}

	@Test
	void markerMissingSaysRunTheScript() {
		gh.repo("main").missing("/contents/.algomentor/squash.json?ref=main");
		CheckResult r = run("squash");
		assertThat(r.passed()).isFalse();
		assertThat(r.details()).singleElement().satisfies((d) -> assertThat(d.text()).contains("setup script"));
	}

	@Test
	void squashNeedsExactlyOneCommitOnBase() {
		gh.repo("main").on("/contents/.algomentor/squash.json?ref=main", marker("squash", ""))
			.on("/compare/main...feature/squash", """
					{"status":"ahead","ahead_by":1,"commits":[{"sha":"s1","commit":{"message":"Add squash feature"}}]}""");
		assertThat(run("squash").passed()).isTrue();

		FakeGitHub four = new FakeGitHub("ana", "library");
		four.repo("main").on("/contents/.algomentor/squash.json?ref=main", marker("squash", ""))
			.on("/compare/main...feature/squash", """
					{"status":"ahead","ahead_by":4,"commits":[{"sha":"1","commit":{"message":"wip 1"}},{"sha":"2","commit":{"message":"wip 2"}},
					 {"sha":"3","commit":{"message":"wip 3"}},{"sha":"4","commit":{"message":"wip 4"}}]}""");
		assertThat(new GitChecks(four.client()).check("ana", "library", "squash").passed()).isFalse();
	}

	@Test
	void revertNeedsRevertOfScriptedSha() {
		String bad = "badc0ffee0000000000000000000000000000001";
		gh.repo("main").on("/contents/.algomentor/revert.json?ref=main", marker("revert", ",\"commitSha\":\"" + bad + "\""))
			.on(COMMITS, list(commit("r1", "Revert \"Break app.txt\"\n\nThis reverts commit " + bad + ".", "ana")));
		assertThat(run("revert").passed()).isTrue();

		FakeGitHub other = new FakeGitHub("ana", "library");
		other.repo("main").on("/contents/.algomentor/revert.json?ref=main", marker("revert", ",\"commitSha\":\"" + bad + "\""))
			.on(COMMITS, list(commit("r1", "Revert \"Something else\"\n\nThis reverts commit 1234.", "ana")));
		assertThat(new GitChecks(other.client()).check("ana", "library", "revert").passed()).isFalse();
	}

	@Test
	void rescueBranchExistsWithScriptedCommit() {
		gh.repo("main").on("/contents/.algomentor/rescue-branch.json?ref=main", marker("rescue-branch", ",\"commitSha\":\"" + LOST + "\""))
			.on("/compare/" + LOST + "...feature/rescue", "{\"status\":\"identical\",\"ahead_by\":0,\"commits\":[]}");
		assertThat(run("rescue-branch").passed()).isTrue();

		FakeGitHub gone = new FakeGitHub("ana", "library");
		gone.repo("main").on("/contents/.algomentor/rescue-branch.json?ref=main", marker("rescue-branch", ",\"commitSha\":\"" + LOST + "\""))
			.missing("/compare/" + LOST + "...feature/rescue");
		CheckResult r = new GitChecks(gone.client()).check("ana", "library", "rescue-branch");
		assertThat(r.passed()).isFalse();
		assertThat(r.details()).anyMatch((d) -> d.text().contains("feature/rescue"));
	}

	@Test
	void cherryPickSamePatchDifferentSha() {
		String extra = ",\"commitSha\":\"" + HOTFIX + "\",\"subject\":\"Fix typo in welcome message\",\"file\":\"welcome.txt\"";
		gh.repo("main").on("/contents/.algomentor/cherry-pick.json?ref=main", marker("cherry-pick", extra))
			.on(COMMITS, list(commit("c7", "Fix typo in welcome message", "ana", "b0")))
			.on("/commits/c7", commitDetail("c7", "Fix typo in welcome message", "welcome.txt", "-Welcom\n+Welcome"))
			.on("/commits/" + HOTFIX, commitDetail(HOTFIX, "Fix typo in welcome message", "welcome.txt", "-Welcom\n+Welcome"));
		assertThat(run("cherry-pick").passed()).isTrue();

		FakeGitHub merged = new FakeGitHub("ana", "library");
		merged.repo("main").on("/contents/.algomentor/cherry-pick.json?ref=main", marker("cherry-pick", extra))
			.on(COMMITS, list(commit(HOTFIX, "Fix typo in welcome message", "ana", "b0")));
		CheckResult r = new GitChecks(merged.client()).check("ana", "library", "cherry-pick");
		assertThat(r.passed()).isFalse();
		assertThat(r.details()).anyMatch((d) -> d.text().contains("cherry-pick"));
	}

	@Test
	void releaseNeedsAnnotatedSemverTagAndRelease() {
		gh.repo("main").on("/tags?per_page=100", "[{\"name\":\"v1.0.0\"},{\"name\":\"v0.9.0\"}]")
			.on("/releases?per_page=100", "[{\"tag_name\":\"v1.0.0\",\"draft\":false}]")
			.on("/git/ref/tags/v1.0.0", "{\"object\":{\"type\":\"tag\"}}");
		assertThat(run("release").passed()).isTrue();

		FakeGitHub light = new FakeGitHub("ana", "library");
		light.repo("main").on("/tags?per_page=100", "[{\"name\":\"v1.2.0\"}]")
			.on("/releases?per_page=100", "[]")
			.on("/git/ref/tags/v1.2.0", "{\"object\":{\"type\":\"commit\"}}");
		CheckResult r = new GitChecks(light.client()).check("ana", "library", "release");
		assertThat(r.passed()).isFalse();
		assertThat(r.details()).filteredOn((d) -> !d.ok()).hasSize(2);
	}

	@Test
	void removeSecretNoReachableCommitContainsFileAndGitignoreCovers() {
		String extra = ",\"file\":\"config/secret.key\"";
		gh.repo("main").on("/contents/.algomentor/remove-secret.json?ref=main", marker("remove-secret", extra))
			.on("/branches?per_page=100", "[{\"name\":\"main\"},{\"name\":\"dev\"}]")
			.on("/commits?sha=main&path=config/secret.key&per_page=100", "[]")
			.on("/commits?sha=dev&path=config/secret.key&per_page=100", "[]")
			.on("/contents/.gitignore?ref=main", file("# secrets\n*.key\nnode_modules/\n"));
		assertThat(run("remove-secret").passed()).isTrue();

		FakeGitHub leaked = new FakeGitHub("ana", "library");
		leaked.repo("main").on("/contents/.algomentor/remove-secret.json?ref=main", marker("remove-secret", extra))
			.on("/branches?per_page=100", "[{\"name\":\"main\"}]")
			.on("/commits?sha=main&path=config/secret.key&per_page=100", list(commit("k1", "Add config", "ana")))
			.missing("/contents/.gitignore?ref=main");
		CheckResult r = new GitChecks(leaked.client()).check("ana", "library", "remove-secret");
		assertThat(r.passed()).isFalse();
		assertThat(r.details()).filteredOn((d) -> !d.ok()).hasSize(2);
	}

	@Test
	void gitignoreMatching() {
		assertThat(GitChecks.ignored("config/secret.key", "*.key")).isTrue();
		assertThat(GitChecks.ignored("config/secret.key", "config/")).isTrue();
		assertThat(GitChecks.ignored("config/secret.key", "/config/secret.key")).isTrue();
		assertThat(GitChecks.ignored("config/secret.key", "secret.key")).isTrue();
		assertThat(GitChecks.ignored("config/secret.key", "**/*.key")).isTrue();
		assertThat(GitChecks.ignored("config/secret.key", "*.txt\n# config/secret.key")).isFalse();
		assertThat(GitChecks.ignored("config/secret.key", "*.key\n!config/secret.key")).isFalse();
	}

	@Test
	void usesDefaultBranchFromApi() {
		gh.repo("master").on("/commits?sha=master&per_page=100", list(commit("c1", "Add library catalogue", "ana"))).on("/readme", file("# Library"));
		assertThat(run("first-commit").passed()).isTrue();
	}


	@Test
	void mergeConflictAcceptsAResolutionThatKeepsOneSide() {
		// Keeping the first parent's line leaves conflict.txt unchanged against it, so GitHub lists no file for the merge itself.
		gh.repo("main").on("/contents/.algomentor/merge-conflict.json?ref=main", marker("merge-conflict", ",\"file\":\"conflict.txt\""))
			.on(COMMITS, list(commit("m1", "Merge branch 'conflict/theirs'", "ana", "p1", "p2")))
			.on("/commits/m1", "{\"sha\":\"m1\",\"commit\":{\"message\":\"Merge\"},\"files\":[]}")
			.on("/commits/p2", commitDetail("p2", "Extend weekday opening hours", "conflict.txt", "+Opening hours: 10 to 6"))
			.on("/contents/conflict.txt?ref=main", file("Opening hours: 8 to 4, closed on Sundays.\n"));
		assertThat(run("merge-conflict").passed()).isTrue();
	}

	@Test
	void mergeConflictStillNeedsTheMergeToInvolveTheFile() {
		gh.repo("main").on("/contents/.algomentor/merge-conflict.json?ref=main", marker("merge-conflict", ",\"file\":\"conflict.txt\""))
			.on(COMMITS, list(commit("m1", "Merge branch 'docs'", "ana", "p1", "p2")))
			.on("/commits/m1", "{\"sha\":\"m1\",\"commit\":{\"message\":\"Merge\"},\"files\":[]}")
			.on("/commits/p2", commitDetail("p2", "Edit docs", "README.md", "+docs"))
			.on("/contents/conflict.txt?ref=main", file("clean\n"));
		assertThat(run("merge-conflict").passed()).isFalse();
	}

	@Test
	void firstCommitOnAnEmptyRepositoryAsksForACommitNotForAPublicRepo() {
		gh.repo("main").conflict(COMMITS).missing("/readme");
		CheckResult r = run("first-commit");
		assertThat(r.passed()).isFalse();
		assertThat(r.details()).anyMatch((d) -> !d.ok() && d.text().contains("no commits yet"));
		assertThat(r.details()).noneMatch((d) -> d.text().contains("Make the repository public"));
	}

	@Test
	void meaningfulCommitsOnAnEmptyRepositoryIsZeroOfFive() {
		gh.repo("main").conflict(COMMITS);
		assertThat(run("meaningful-commits").details()).anyMatch((d) -> d.text().contains("0 of 5"));
	}

	@Test
	void markerValuesThatCouldLeaveTheRepoPathAreRejectedWithoutAnyRequest() {
		String[][] bad = {
				{"revert", ",\"commitSha\":\"../../../../user\""},
				{"rescue-branch", ",\"commitSha\":\"zzzz\""},
				{"cherry-pick", ",\"commitSha\":\"" + HOTFIX + "\",\"subject\":\"Fix\",\"file\":\"../../../user\""},
				{"merge-conflict", ",\"file\":\"/etc/passwd\""},
				{"remove-secret", ",\"file\":\"config/../../x\""},
		};
		for (String[] b : bad) {
			FakeGitHub one = new FakeGitHub("ana", "library");
			// Only the repo and the marker may be read: any further request makes the mock server fail the test.
			one.repo("main").on("/contents/.algomentor/" + b[0] + ".json?ref=main", marker(b[0], b[1]));
			CheckResult r = new GitChecks(one.client()).check("ana", "library", b[0]);
			assertThat(r.passed()).as(b[0]).isFalse();
			assertThat(r.details()).as(b[0]).singleElement().satisfies((d) -> assertThat(d.text()).contains("marker").contains("looks wrong"));
		}
	}

}
