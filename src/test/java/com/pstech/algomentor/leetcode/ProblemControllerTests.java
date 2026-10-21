package com.pstech.algomentor.leetcode;

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
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProblemControllerTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	@Qualifier("problemGuard")
	RequestGuardInterceptor problemGuard;

	@MockitoBean
	LeetCodeClient leetCode;

	@BeforeEach
	void setUp() {
		problemGuard.reset();
	}

	@Test
	void returnsProblem() throws Exception {
		given(leetCode.fetch(new ProblemRef(1, null))).willReturn(new LeetCodeClient.Problem("1", "Two Sum", "two-sum",
				"Easy", List.of("Array"), "https://leetcode.com/problems/two-sum/", "Find `target`."));

		mvc.perform(get("/problem").param("ref", "LC 1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.title").value("Two Sum"))
			.andExpect(jsonPath("$.statement").value("Find `target`."))
			.andExpect(jsonPath("$.tags[0]").value("Array"));
	}

	@Test
	void rejectsTextThatIsNotAProblemReference() throws Exception {
		mvc.perform(get("/problem").param("ref", "Given an array..."))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.error", containsString("problem number")));
	}

	@Test
	void requiresRef() throws Exception {
		mvc.perform(get("/problem")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").exists());
	}

	@Test
	void passesThroughLeetCodeErrors() throws Exception {
		given(leetCode.fetch(new ProblemRef(99999, null)))
			.willThrow(new ApiException(HttpStatus.NOT_FOUND, "Couldn't find LeetCode problem #99999."));

		mvc.perform(get("/problem").param("ref", "99999"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.error", containsString("#99999")));
	}

	@Test
	void hasItsOwnRateLimit() throws Exception {
		for (int i = 0; i < 20; i++) {
			mvc.perform(get("/problem").param("ref", "nope")).andExpect(status().isBadRequest());
		}
		mvc.perform(get("/problem").param("ref", "nope")).andExpect(status().isTooManyRequests());
	}

}
