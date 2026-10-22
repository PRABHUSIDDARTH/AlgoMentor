package com.pstech.algomentor.github;

import org.junit.jupiter.api.Test;

import static com.pstech.algomentor.github.FakeGitHub.commit;
import static com.pstech.algomentor.github.FakeGitHub.file;
import static org.assertj.core.api.Assertions.assertThat;

class RepoHealthTests {

	static String commits(int meaningful) {
		String[] items = new String[meaningful + 2];
		for (int i = 0; i < meaningful; i++) {
			items[i] = commit("c" + i, "Add feature number " + i + " to the ledger", "ana");
		}
		items[meaningful] = commit("u", "update", "ana");
		items[meaningful + 1] = commit("w", "wip", "ana");
		return FakeGitHub.list(items);
	}

	@Test
	void repoHealthItems() {
		FakeGitHub gh = new FakeGitHub("ana", "library");
		gh.on("", FakeGitHub.repoJson("main", "{\"spdx_id\":\"MIT\"}", "[\"java\",\"oop\"]", "\"https://ana.dev/library\""))
			.on("/readme", file("# Library\n\n![demo](docs/demo.gif)\n\n## Features\n\n## Setup\n\n## Usage\n"))
			.on("/git/trees/main?recursive=1", """
					{"tree":[{"path":"src/test/java/LibraryTest.java","type":"blob"},{"path":".github/workflows/ci.yml","type":"blob"}]}""")
			.on("/commits?sha=main&per_page=100", commits(20))
			.on("/tags?per_page=100", "[{\"name\":\"v1.0.0\"}]");
		CheckResult r = new RepoHealth(gh.client()).check("ana", "library");
		assertThat(r.details()).hasSize(9);
		assertThat(r.details()).allMatch(CheckResult.Detail::ok);
		assertThat(r.passed()).isTrue();
	}

	@Test
	void bareRepoFailsEachItemWithAReason() {
		FakeGitHub gh = new FakeGitHub("ana", "library");
		gh.repo("main").missing("/readme")
			.on("/git/trees/main?recursive=1", "{\"tree\":[{\"path\":\"Main.java\",\"type\":\"blob\"}]}")
			.on("/commits?sha=main&per_page=100", commits(3))
			.on("/tags?per_page=100", "[]");
		CheckResult r = new RepoHealth(gh.client()).check("ana", "library");
		assertThat(r.passed()).isFalse();
		assertThat(r.details()).hasSize(9).noneMatch(CheckResult.Detail::ok);
		assertThat(r.details()).anyMatch((d) -> d.text().contains("3 of 20"));
	}

	@Test
	void anEmptyRepositoryIsAChecklistOfMissingThingsNotAnError() {
		FakeGitHub gh = new FakeGitHub("ana", "library");
		gh.repo("main").missing("/readme").conflict("/git/trees/main?recursive=1").conflict("/commits?sha=main&per_page=100").on("/tags?per_page=100", "[]");
		CheckResult r = new RepoHealth(gh.client()).check("ana", "library");
		assertThat(r.passed()).isFalse();
		assertThat(r.details()).hasSize(9).noneMatch(CheckResult.Detail::ok);
	}

}
