package com.pstech.algomentor.profiles;

import java.nio.charset.StandardCharsets;

import com.pstech.algomentor.web.ApiException;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/** Each client against a fixture captured from the real site (2026-10-22). */
class ProfileClientTests {

	static String fixture(String name) throws Exception {
		return new ClassPathResource("profiles/" + name).getContentAsString(StandardCharsets.UTF_8);
	}

	static void assertStatus(Runnable call, HttpStatus status) {
		assertThatExceptionOfType(ApiException.class).isThrownBy(call::run)
			.satisfies(ex -> assertThat(ex.getStatus()).isEqualTo(status));
	}

	@Nested
	class LeetCode {

		RestClient.Builder builder = RestClient.builder();

		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

		LeetCodeProfileClient client = new LeetCodeProfileClient(builder.build(), "https://lc.test");

		@Test
		void mapsProfile() throws Exception {
			server.expect(requestTo("https://lc.test/graphql")).andRespond(withSuccess(fixture("leetcode.json"), MediaType.APPLICATION_JSON));
			Profiles.LeetCodeProfile p = client.fetch("lee215");
			assertThat(p.username()).isEqualTo("lee215");
			assertThat(p.ranking()).isEqualTo(104649);
			assertThat(p.solved()).isEqualTo(new Profiles.Solved(126, 411, 149, 686));
			assertThat(p.topics()).first().isEqualTo(new Profiles.TopicCount("Array", 385));
			assertThat(p.topics()).hasSize(9);
			assertThat(p.topics()).extracting(Profiles.TopicCount::solved).isSortedAccordingTo((a, b) -> b - a);
			assertThat(p.recent()).first()
				.isEqualTo(new Profiles.RecentSolve("maximum-alternating-subarray-sum-with-one-deletion",
						"Maximum Alternating Subarray Sum With One Deletion", 1791086655L));
		}

		@Test
		void nullMatchedUserIsNotFound() {
			server.expect(requestTo("https://lc.test/graphql"))
				.andRespond(withSuccess("{\"data\":{\"matchedUser\":null,\"recentAcSubmissionList\":null}}", MediaType.APPLICATION_JSON));
			assertStatus(() -> client.fetch("nobody"), HttpStatus.NOT_FOUND);
		}

		@Test
		void htmlChallengeIsBadGateway() {
			server.expect(requestTo("https://lc.test/graphql")).andRespond(withSuccess("<html>Just a moment...</html>", MediaType.TEXT_HTML));
			assertStatus(() -> client.fetch("lee215"), HttpStatus.BAD_GATEWAY);
		}

		@Test
		void nonNumericTimestampIsBadGatewayNot500() {
			server.expect(requestTo("https://lc.test/graphql")).andRespond(withSuccess(
					"{\"data\":{\"matchedUser\":{\"username\":\"x\",\"profile\":{\"ranking\":1},\"submitStatsGlobal\":{\"acSubmissionNum\":[]},"
							+ "\"tagProblemCounts\":{}},\"recentAcSubmissionList\":[{\"title\":\"T\",\"titleSlug\":\"t\",\"timestamp\":\"yesterday\"}]}}",
					MediaType.APPLICATION_JSON));
			assertStatus(() -> client.fetch("x"), HttpStatus.BAD_GATEWAY);
		}

		@Test
		void unexpectedShapeIsBadGateway() {
			server.expect(requestTo("https://lc.test/graphql"))
				.andRespond(withSuccess("{\"data\":{\"matchedUser\":{\"username\":\"x\",\"submitStatsGlobal\":null}}}", MediaType.APPLICATION_JSON));
			assertStatus(() -> client.fetch("x"), HttpStatus.BAD_GATEWAY);
		}

	}

	@Nested
	class HackerRank {

		RestClient.Builder builder = RestClient.builder();

		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

		HackerRankProfileClient client = new HackerRankProfileClient(builder.build(), "https://hr.test");

		@Test
		void mapsBadges() throws Exception {
			server.expect(requestTo("https://hr.test/rest/hackers/abc/badges"))
				.andRespond(withSuccess(fixture("hackerrank.json"), MediaType.APPLICATION_JSON));
			Profiles.HackerRankProfile p = client.fetch("abc");
			assertThat(p.badges()).containsExactly(new Profiles.Badge("Problem Solving", 6, 3, 202),
					new Profiles.Badge("Java", 4, 2, 40));
		}

		@Test
		void statusFalseIsNotFound() {
			server.expect(requestTo("https://hr.test/rest/hackers/nobody/badges"))
				.andRespond(withSuccess("{\"status\":false,\"models\":[]}", MediaType.APPLICATION_JSON));
			assertStatus(() -> client.fetch("nobody"), HttpStatus.NOT_FOUND);
		}

		@Test
		void httpNotFoundIsNotFound() {
			server.expect(requestTo("https://hr.test/rest/hackers/nobody/badges")).andRespond(withStatus(HttpStatus.NOT_FOUND));
			assertStatus(() -> client.fetch("nobody"), HttpStatus.NOT_FOUND);
		}

		@Test
		void htmlChallengeIsBadGateway() {
			server.expect(requestTo("https://hr.test/rest/hackers/abc/badges")).andRespond(withSuccess("<html>blocked</html>", MediaType.TEXT_HTML));
			assertStatus(() -> client.fetch("abc"), HttpStatus.BAD_GATEWAY);
		}

	}

	@Nested
	class Gfg {

		RestClient.Builder builder = RestClient.builder();

		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

		GfgProfileClient client = new GfgProfileClient(builder.build(), "https://gfg.test");

		@Test
		void parsesEmbeddedJson() throws Exception {
			server.expect(requestTo("https://gfg.test/profile/nishant_raj/"))
				.andRespond(withSuccess(fixture("gfg.html"), MediaType.TEXT_HTML));
			assertThat(client.fetch("nishant_raj")).isEqualTo(new Profiles.GfgProfile("nishant_raj", 125, 320, 454, 7));
		}

		@Test
		void missingFieldsIsBadGateway() {
			server.expect(requestTo("https://gfg.test/profile/x/"))
				.andRespond(withSuccess("<html><script>{\"username\":\"x\"}</script></html>", MediaType.TEXT_HTML));
			assertStatus(() -> client.fetch("x"), HttpStatus.BAD_GATEWAY);
		}

		@Test
		void notFoundPageIsNotFound() {
			server.expect(requestTo("https://gfg.test/profile/nobody/")).andRespond(withStatus(HttpStatus.NOT_FOUND));
			assertStatus(() -> client.fetch("nobody"), HttpStatus.NOT_FOUND);
		}

	}

	@Nested
	class GitHub {

		RestClient.Builder builder = RestClient.builder();

		MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

		GitHubProfileClient client = new GitHubProfileClient(builder.build(), "https://gh.test", "");

		@Test
		void mapsUserAndOwnRepositories() throws Exception {
			server.expect(requestTo("https://gh.test/users/octocat")).andRespond(withSuccess(fixture("github-user.json"), MediaType.APPLICATION_JSON));
			server.expect(requestTo("https://gh.test/users/octocat/repos?per_page=100&sort=pushed"))
				.andRespond(withSuccess(fixture("github-repos.json"), MediaType.APPLICATION_JSON));
			Profiles.GitHubProfile p = client.fetch("octocat");
			assertThat(p.username()).isEqualTo("octocat");
			assertThat(p.publicRepos()).isEqualTo(8);
			assertThat(p.followers()).isEqualTo(24711);
			// Stars and languages count the user's own repositories, not forks.
			assertThat(p.stars()).isEqualTo(21117);
			assertThat(p.languages()).containsExactly("CSS", "HTML");
			assertThat(p.lastPushAt()).isEqualTo(1724253942L);
		}

		@Test
		void unknownUserIsNotFound() {
			server.expect(requestTo("https://gh.test/users/nobody")).andRespond(withStatus(HttpStatus.NOT_FOUND));
			assertStatus(() -> client.fetch("nobody"), HttpStatus.NOT_FOUND);
		}

		@Test
		void unexpectedShapeIsBadGateway() {
			server.expect(requestTo("https://gh.test/users/octocat")).andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
			assertStatus(() -> client.fetch("octocat"), HttpStatus.BAD_GATEWAY);
		}

	}

}
