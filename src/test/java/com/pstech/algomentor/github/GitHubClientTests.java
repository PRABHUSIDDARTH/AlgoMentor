package com.pstech.algomentor.github;

import com.pstech.algomentor.web.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.ExpectedCount;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.headerDoesNotExist;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GitHubClientTests {

	FakeGitHub gh = new FakeGitHub("ana", "library");

	static void assertApi(Runnable call, HttpStatus status, String text) {
		assertThatExceptionOfType(ApiException.class).isThrownBy(call::run).satisfies((ex) -> {
			assertThat(ex.getStatus()).isEqualTo(status);
			assertThat(ex.getMessage()).contains(text);
		});
	}

	@Test
	void privateRepoIsNotFoundMessage() {
		gh.missing("");
		assertApi(() -> gh.client().repo("ana", "library"), HttpStatus.NOT_FOUND, "Make the repository public to verify it.");
	}

	@Test
	void rateLimitedIs503() {
		gh.server.expect(requestTo(FakeGitHub.BASE + "/repos/ana/library"))
			.andRespond(withStatus(HttpStatus.FORBIDDEN).headers(FakeGitHub.rateLimited()).body("{\"message\":\"API rate limit exceeded\"}"));
		assertApi(() -> gh.client().repo("ana", "library"), HttpStatus.SERVICE_UNAVAILABLE, "GitHub checks are busy, try again in a few minutes.");
	}

	@Test
	void tooManyRequestsIs503() {
		gh.server.expect(requestTo(FakeGitHub.BASE + "/repos/ana/library")).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
		assertApi(() -> gh.client().repo("ana", "library"), HttpStatus.SERVICE_UNAVAILABLE, "busy");
	}

	@Test
	void forbiddenWithoutRateLimitIsBadGateway() {
		gh.server.expect(requestTo(FakeGitHub.BASE + "/repos/ana/library")).andRespond(withStatus(HttpStatus.FORBIDDEN));
		assertApi(() -> gh.client().repo("ana", "library"), HttpStatus.BAD_GATEWAY, "GitHub");
	}

	@Test
	void malformedJsonIsBadGateway() {
		gh.server.expect(requestTo(FakeGitHub.BASE + "/repos/ana/library")).andRespond(withSuccess("<html>", MediaType.TEXT_HTML));
		assertApi(() -> gh.client().repo("ana", "library"), HttpStatus.BAD_GATEWAY, "GitHub");
	}

	@Test
	void tokenSentWhenConfigured() {
		gh.server.expect(ExpectedCount.once(), requestTo(FakeGitHub.BASE + "/repos/ana/library"))
			.andExpect(header("Authorization", "Bearer t0ken"))
			.andExpect(header("X-GitHub-Api-Version", "2022-11-28"))
			.andRespond(withSuccess(FakeGitHub.repoJson("main", "null", "[]", "null"), MediaType.APPLICATION_JSON));
		assertThat(gh.client("t0ken").repo("ana", "library").path("default_branch").asString()).isEqualTo("main");
		gh.server.verify();
	}

	@Test
	void noTokenNoAuthorizationHeader() {
		gh.server.expect(requestTo(FakeGitHub.BASE + "/repos/ana/library"))
			.andExpect(headerDoesNotExist("Authorization"))
			.andRespond(withSuccess(FakeGitHub.repoJson("main", "null", "[]", "null"), MediaType.APPLICATION_JSON));
		gh.client().repo("ana", "library");
		gh.server.verify();
	}

	@Test
	void missingFileIsEmptyNotAnError() {
		gh.missing("/contents/conflict.txt?ref=main");
		assertThat(gh.client().text("ana", "library", "conflict.txt", "main")).isEmpty();
	}

}
