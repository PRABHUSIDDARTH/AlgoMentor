package com.pstech.algomentor.leetcode;

import com.pstech.algomentor.web.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class LeetCodeClientTests {

	static final String BASE = "https://leetcode.test";

	static final String PROBLEM_LIST = """
			{"num_total": 2, "stat_status_pairs": [
			  {"stat": {"frontend_question_id": 1, "question__title_slug": "two-sum"}, "paid_only": false},
			  {"stat": {"frontend_question_id": 156, "question__title_slug": "binary-tree-upside-down"}, "paid_only": true}
			]}""";

	static final String TWO_SUM = """
			{"data": {"question": {"questionFrontendId": "1", "title": "Two Sum", "titleSlug": "two-sum",
			  "difficulty": "Easy", "isPaidOnly": false, "content": "<p>Find <code>target</code>.</p>",
			  "topicTags": [{"name": "Array"}, {"name": "Hash Table"}]}}}""";

	MockRestServiceServer server;

	LeetCodeClient client;

	@BeforeEach
	void setUp() {
		RestClient.Builder builder = RestClient.builder().baseUrl(BASE);
		server = MockRestServiceServer.bindTo(builder).build();
		client = new LeetCodeClient(builder.build(), BASE);
	}

	@Test
	void fetchesProblemByNumberAndCachesIt() {
		// The real endpoint serves JSON labelled as text/html.
		server.expect(once(), requestTo(BASE + "/api/problems/all/"))
			.andRespond(withSuccess(PROBLEM_LIST, MediaType.TEXT_HTML));
		server.expect(once(), requestTo(BASE + "/graphql"))
			.andExpect(method(HttpMethod.POST))
			.andExpect(content().string(org.hamcrest.Matchers.containsString("\"titleSlug\":\"two-sum\"")))
			.andRespond(withSuccess(TWO_SUM, MediaType.APPLICATION_JSON));

		LeetCodeClient.Problem problem = client.fetch(new ProblemRef(1, null));
		assertThat(problem.number()).isEqualTo("1");
		assertThat(problem.title()).isEqualTo("Two Sum");
		assertThat(problem.difficulty()).isEqualTo("Easy");
		assertThat(problem.tags()).containsExactly("Array", "Hash Table");
		assertThat(problem.url()).isEqualTo(BASE + "/problems/two-sum/");
		assertThat(problem.statement()).isEqualTo("Find `target`.");

		// Second lookup by number or by URL slug is served from the cache.
		assertThat(client.fetch(new ProblemRef(1, null))).isEqualTo(problem);
		assertThat(client.fetch(new ProblemRef(null, "two-sum"))).isEqualTo(problem);
		server.verify();
	}

	@Test
	void unknownNumberIsNotFound() {
		server.expect(requestTo(BASE + "/api/problems/all/"))
			.andRespond(withSuccess(PROBLEM_LIST, MediaType.APPLICATION_JSON));

		assertThatExceptionOfType(ApiException.class).isThrownBy(() -> client.fetch(new ProblemRef(99999, null)))
			.satisfies(ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND))
			.withMessageContaining("#99999");
	}

	@Test
	void unknownSlugIsNotFound() {
		server.expect(requestTo(BASE + "/graphql"))
			.andRespond(withSuccess("{\"data\": {\"question\": null}}", MediaType.APPLICATION_JSON));

		assertThatExceptionOfType(ApiException.class).isThrownBy(() -> client.fetch(new ProblemRef(null, "nope")))
			.satisfies(ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
	}

	@Test
	void premiumProblemExplainsWhy() {
		server.expect(requestTo(BASE + "/graphql"))
			.andRespond(withSuccess("""
					{"data": {"question": {"questionFrontendId": "156", "title": "Binary Tree Upside Down",
					  "titleSlug": "binary-tree-upside-down", "difficulty": "Medium", "isPaidOnly": true,
					  "content": null, "topicTags": []}}}""", MediaType.APPLICATION_JSON));

		assertThatExceptionOfType(ApiException.class)
			.isThrownBy(() -> client.fetch(new ProblemRef(null, "binary-tree-upside-down")))
			.withMessageContaining("Premium");
	}

	@Test
	void nonJsonResponseIsBadGateway() {
		server.expect(requestTo(BASE + "/api/problems/all/"))
			.andRespond(withSuccess("<html>Just a moment...</html>", MediaType.TEXT_HTML));

		assertThatExceptionOfType(ApiException.class).isThrownBy(() -> client.fetch(new ProblemRef(1, null)))
			.satisfies(ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_GATEWAY));
	}

	@Test
	void leetCodeOutageIsBadGateway() {
		server.expect(requestTo(BASE + "/api/problems/all/")).andRespond(withServerError());

		assertThatExceptionOfType(ApiException.class).isThrownBy(() -> client.fetch(new ProblemRef(1, null)))
			.satisfies(ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_GATEWAY))
			.withMessageContaining("Paste the problem statement");
	}

}
