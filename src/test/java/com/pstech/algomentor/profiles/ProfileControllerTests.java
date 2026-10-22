package com.pstech.algomentor.profiles;

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

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProfileControllerTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	ProfileController controller;

	@Autowired
	@Qualifier("problemGuard")
	RequestGuardInterceptor problemGuard;

	@MockitoBean
	LeetCodeProfileClient leetCode;

	@MockitoBean
	HackerRankProfileClient hackerRank;

	@MockitoBean
	GfgProfileClient gfg;

	@MockitoBean
	GitHubProfileClient gitHub;

	@BeforeEach
	void setUp() {
		problemGuard.reset();
		controller.clearCache();
		given(leetCode.fetch(anyString())).willReturn(new Profiles.LeetCodeProfile("demo", 10, new Profiles.Solved(1, 2, 3, 6),
				List.of(new Profiles.TopicCount("Array", 4)), List.of()));
		given(gfg.fetch(anyString())).willReturn(new Profiles.GfgProfile("demo", 125, 320, 454, 7));
	}

	@Test
	void returnsGitHubProfile() throws Exception {
		given(gitHub.fetch("octocat")).willReturn(new Profiles.GitHubProfile("octocat", 8, 24711, 21117, List.of("CSS", "HTML"), 1724253942L));
		mvc.perform(get("/profiles/github/octocat"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.stars").value(21117))
			.andExpect(jsonPath("$.languages[0]").value("CSS"));
	}

	@Test
	void returnsLeetCodeProfile() throws Exception {
		mvc.perform(get("/profiles/leetcode/demo"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.solved.total").value(6))
			.andExpect(jsonPath("$.topics[0].tag").value("Array"));
	}

	@Test
	void rejectsInvalidUsername() throws Exception {
		mvc.perform(get("/profiles/leetcode/a b")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").exists());
		mvc.perform(get("/profiles/gfg/" + "x".repeat(41))).andExpect(status().isBadRequest());
	}

	@Test
	void rejectsUnknownSite() throws Exception {
		mvc.perform(get("/profiles/codeforces/demo")).andExpect(status().isNotFound());
	}

	@Test
	void cachesPerSiteAndUser() throws Exception {
		mvc.perform(get("/profiles/gfg/demo")).andExpect(status().isOk());
		mvc.perform(get("/profiles/gfg/DEMO")).andExpect(status().isOk());
		verify(gfg, times(1)).fetch(anyString());
	}

	@Test
	void refreshBypassesTheCache() throws Exception {
		mvc.perform(get("/profiles/gfg/demo")).andExpect(status().isOk());
		mvc.perform(get("/profiles/gfg/demo").param("refresh", "true")).andExpect(status().isOk());
		mvc.perform(get("/profiles/gfg/demo")).andExpect(status().isOk());
		verify(gfg, times(2)).fetch(anyString());
	}

	@Test
	void doesNotCacheErrors() throws Exception {
		given(hackerRank.fetch(anyString())).willThrow(new ApiException(HttpStatus.BAD_GATEWAY, "Couldn't read HackerRank right now."));
		mvc.perform(get("/profiles/hackerrank/demo")).andExpect(status().isBadGateway())
			.andExpect(jsonPath("$.error", containsString("HackerRank")));
		mvc.perform(get("/profiles/hackerrank/demo")).andExpect(status().isBadGateway());
		verify(hackerRank, times(2)).fetch(anyString());
	}

	@Test
	void sharesTheProblemRateLimit() throws Exception {
		for (int i = 0; i < 20; i++) {
			mvc.perform(get("/profiles/gfg/demo")).andExpect(status().isOk());
		}
		mvc.perform(get("/profiles/gfg/demo")).andExpect(status().isTooManyRequests());
	}

}
