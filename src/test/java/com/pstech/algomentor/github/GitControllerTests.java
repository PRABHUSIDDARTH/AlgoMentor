package com.pstech.algomentor.github;

import java.util.List;

import com.pstech.algomentor.web.ApiException;
import com.pstech.algomentor.web.RequestGuardInterceptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GitControllerTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	GitController controller;

	@Autowired
	@Qualifier("problemGuard")
	RequestGuardInterceptor problemGuard;

	@MockitoBean
	GitChecks checks;

	@MockitoBean
	RepoHealth health;

	static final CheckResult PASS = new CheckResult(true, List.of(new CheckResult.Detail(true, "README found")));

	@BeforeEach
	void setUp() {
		problemGuard.reset();
		controller.clearCache();
		given(checks.check(anyString(), anyString(), anyString())).willReturn(PASS);
		given(health.check(anyString(), anyString())).willReturn(PASS);
	}

	@Test
	void returnsCheckResult() throws Exception {
		mvc.perform(get("/git/check/ana/library/first-commit"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.passed").value(true))
			.andExpect(jsonPath("$.details[0].ok").value(true))
			.andExpect(jsonPath("$.details[0].text").value("README found"));
	}

	@Test
	void rejectsInvalidOwnerRepo() throws Exception {
		mvc.perform(get("/git/check/ana$/library/first-commit")).andExpect(status().isBadRequest());
		mvc.perform(get("/git/check/ana/" + "r".repeat(101) + "/first-commit")).andExpect(status().isBadRequest());
		mvc.perform(get("/git/repo-health/ana/lib%20rary")).andExpect(status().isBadRequest());
		verify(checks, never()).check(anyString(), anyString(), anyString());
	}

	@Test
	void unknownChallengeIsNotFound() throws Exception {
		mvc.perform(get("/git/check/ana/library/time-travel"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.error", containsString("challenge")));
	}

	@Test
	void cachesTwoMinutes() throws Exception {
		mvc.perform(get("/git/check/ana/library/first-commit")).andExpect(status().isOk());
		mvc.perform(get("/git/check/Ana/Library/first-commit")).andExpect(status().isOk());
		mvc.perform(get("/git/check/ana/library/release")).andExpect(status().isOk());
		verify(checks, times(1)).check("ana", "library", "first-commit");
		verify(checks, times(1)).check("ana", "library", "release");
		assertThat(GitController.CACHE_TTL).isEqualTo(java.time.Duration.ofMinutes(2));
	}

	@Test
	void errorsAreNotCached() throws Exception {
		given(checks.check(anyString(), anyString(), anyString()))
			.willThrow(new ApiException(HttpStatus.NOT_FOUND, "Make the repository public to verify it."))
			.willReturn(PASS);
		mvc.perform(get("/git/check/ana/library/first-commit"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.error").value("Make the repository public to verify it."));
		mvc.perform(get("/git/check/ana/library/first-commit")).andExpect(status().isOk());
	}

	@Test
	void repoHealthEndpoint() throws Exception {
		mvc.perform(get("/git/repo-health/ana/library")).andExpect(status().isOk()).andExpect(jsonPath("$.passed").value(true));
	}

}
