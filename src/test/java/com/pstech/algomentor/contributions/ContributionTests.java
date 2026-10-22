package com.pstech.algomentor.contributions;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import com.pstech.algomentor.web.RequestGuardInterceptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ContributionTests {

	static final Path FILE = tempFile();

	static Path tempFile() {
		try {
			return Files.createTempDirectory("contributions").resolve("contributions.json");
		}
		catch (IOException ex) {
			throw new IllegalStateException(ex);
		}
	}

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		registry.add("algomentor.contributions.file", FILE::toString);
		registry.add("algomentor.admin-token", () -> "test-admin-token-123");
	}

	@Autowired
	MockMvc mvc;

	@Autowired
	ContributionStore store;

	@Autowired
	@Qualifier("contributionGuard")
	RequestGuardInterceptor guard;

	@BeforeEach
	void setUp() {
		guard.reset();
		store.clear();
	}

	static Map<String, Object> valid() {
		return new java.util.HashMap<>(Map.ofEntries(
				Map.entry("company", "Atlassian"),
				Map.entry("level", "sde1"),
				Map.entry("roleTitle", "Software Engineer, Backend"),
				Map.entry("projectTitle", "Seat reservation system"),
				Map.entry("summary", "A booking API where one seat can never be sold twice, with expiring holds and a race test."),
				Map.entry("whyItHelped", "In the system design round I walked through the unique constraint and the hold expiry job."),
				Map.entry("stack", "Spring Boot, PostgreSQL"),
				Map.entry("repoUrl", "https://github.com/ana/seats"),
				Map.entry("name", "Ana G."),
				Map.entry("linkedin", "ana-gomez"),
				Map.entry("email", "ana@example.com"),
				Map.entry("year", 2026),
				Map.entry("consent", true)));
	}

	MockHttpServletRequestBuilder submit(Map<String, Object> body) {
		return post("/api/contributions").contentType(MediaType.APPLICATION_JSON).content(JsonMapper.shared().writeValueAsString(body));
	}

	String submitAndGetId(Map<String, Object> body) throws Exception {
		String json = mvc.perform(submit(body)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
		return JsonMapper.shared().readTree(json).get("id").asString();
	}

	@Test
	void acceptsAValidContributionAsPendingAndKeepsItOutOfThePublicList() throws Exception {
		mvc.perform(submit(valid())).andExpect(status().isCreated()).andExpect(jsonPath("$.id").isNotEmpty()).andExpect(jsonPath("$.status").value("PENDING"));
		mvc.perform(get("/api/contributions")).andExpect(status().isOk()).andExpect(content().json("[]"));
		assertThat(Files.readString(FILE)).contains("Seat reservation system");
	}

	@Test
	void requiresConsentAndTheCoreFields() throws Exception {
		Map<String, Object> noConsent = valid();
		noConsent.put("consent", false);
		mvc.perform(submit(noConsent)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value(containsString("consent")));
		for (String field : new String[] { "company", "roleTitle", "projectTitle", "summary", "whyItHelped", "stack" }) {
			guard.reset();
			Map<String, Object> body = valid();
			body.remove(field);
			mvc.perform(submit(body)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value(containsString(field)));
		}
	}

	@Test
	void rejectsBadValues() throws Exception {
		for (Map.Entry<String, Object> bad : Map.<String, Object>of("level", "ceo", "repoUrl", "http://github.com/a/b", "email", "nope", "linkedin", "a b",
				"summary", "too short", "year", 1999).entrySet()) {
			guard.reset();
			Map<String, Object> body = valid();
			body.put(bad.getKey(), bad.getValue());
			mvc.perform(submit(body)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value(containsString(bad.getKey())));
		}
		guard.reset();
		Map<String, Object> elsewhere = valid();
		elsewhere.put("repoUrl", "https://evil.example.com/a/b");
		mvc.perform(submit(elsewhere)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value(containsString("repoUrl")));
	}

	@Test
	void aFilledHoneypotLooksSuccessfulButStoresNothing() throws Exception {
		Map<String, Object> body = valid();
		body.put("website", "http://spam.example");
		mvc.perform(submit(body)).andExpect(status().isCreated());
		assertThat(store.pending()).isEmpty();
	}

	@Test
	void isRateLimitedPerClient() throws Exception {
		for (int i = 0; i < 3; i++) {
			mvc.perform(submit(valid())).andExpect(status().isCreated());
		}
		mvc.perform(submit(valid())).andExpect(status().isTooManyRequests());
	}

	@Test
	void adminEndpointsNeedTheToken() throws Exception {
		mvc.perform(get("/api/admin/contributions")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/admin/contributions").header("X-Admin-Token", "wrong")).andExpect(status().isUnauthorized());
		mvc.perform(post("/api/admin/contributions/abc/approve")).andExpect(status().isUnauthorized());
	}

	@Test
	void anApprovedContributionBecomesPublicWithoutTheEmail() throws Exception {
		String id = submitAndGetId(valid());
		mvc.perform(get("/api/admin/contributions").header("X-Admin-Token", "test-admin-token-123"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].id").value(id))
			.andExpect(jsonPath("$[0].email").value("ana@example.com"));
		mvc.perform(post("/api/admin/contributions/" + id + "/approve").header("X-Admin-Token", "test-admin-token-123"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("APPROVED"));
		mvc.perform(get("/api/contributions"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].company").value("Atlassian"))
			.andExpect(jsonPath("$[0].projectTitle").value("Seat reservation system"))
			.andExpect(jsonPath("$[0].linkedin").value("ana-gomez"))
			.andExpect(jsonPath("$[0].email").doesNotExist())
			.andExpect(jsonPath("$[0].status").doesNotExist());
	}

	@Test
	void aRejectedContributionNeverAppearsAndUnknownIdsAre404() throws Exception {
		String id = submitAndGetId(valid());
		mvc.perform(post("/api/admin/contributions/" + id + "/reject").header("X-Admin-Token", "test-admin-token-123")).andExpect(status().isOk());
		mvc.perform(get("/api/contributions")).andExpect(content().json("[]"));
		mvc.perform(post("/api/admin/contributions/nope/approve").header("X-Admin-Token", "test-admin-token-123")).andExpect(status().isNotFound());
	}

	@Test
	void surviveARestartByReadingTheFile() throws Exception {
		String id = submitAndGetId(valid());
		mvc.perform(post("/api/admin/contributions/" + id + "/approve").header("X-Admin-Token", "test-admin-token-123")).andExpect(status().isOk());
		ContributionStore reopened = new ContributionStore(FILE.toString());
		assertThat(reopened.approved()).hasSize(1);
	}

	@Test
	void stopsAcceptingWhenTheReviewQueueIsFull() throws Exception {
		for (int i = 0; i < ContributionStore.MAX_PENDING; i++) {
			store.add(new Contribution("p" + i, Contribution.Status.PENDING, java.time.Instant.now(), null, "Acme", "sde1", "Engineer", "Project " + i,
					"summary summary summary summary summary summary", "why why why why why why why why why why why", "Java", null, null, null, null, null));
		}
		guard.reset();
		mvc.perform(submit(valid())).andExpect(status().isServiceUnavailable());
	}

}
