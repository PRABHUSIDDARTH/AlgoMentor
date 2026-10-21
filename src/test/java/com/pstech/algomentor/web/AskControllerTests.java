package com.pstech.algomentor.web;

import com.pstech.algomentor.gemini.AnswerGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AskControllerTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	RequestGuardInterceptor requestGuard;

	@MockitoBean
	AnswerGenerator answers;

	@BeforeEach
	void setUp() {
		requestGuard.reset();
		given(answers.generate(anyString())).willReturn("**Two pointers**");
	}

	@Test
	void servesIndexPage() throws Exception {
		mvc.perform(get("/")).andExpect(status().isOk()).andExpect(forwardedUrl("index.html"));
		mvc.perform(get("/index.html"))
			.andExpect(status().isOk())
			.andExpect(content().string(containsString("AlgoMentor")));
	}

	@Test
	void returnsAnswerUsingModePrompt() throws Exception {
		ask("{\"problem\": \"Two Sum\", \"mode\": \"hint\"}")
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.result").value("**Two pointers**"));
		verify(answers).generate(argThat(p -> p.contains("hints") && p.contains("Two Sum")));
	}

	@Test
	void unknownModeFallsBackToExplain() throws Exception {
		ask("{\"problem\": \"Two Sum\", \"mode\": \"bogus\"}").andExpect(status().isOk());
		verify(answers).generate(argThat(p -> p.startsWith("Explain")));
	}

	@Test
	void rejectsEmptyProblem() throws Exception {
		ask("{\"problem\": \"   \"}").andExpect(status().isBadRequest()).andExpect(jsonPath("$.error", notNullValue()));
	}

	@Test
	void rejectsTooLongProblem() throws Exception {
		ask("{\"problem\": \"" + "x".repeat(8001) + "\"}").andExpect(status().isBadRequest());
	}

	@Test
	void rejectsNonJsonBody() throws Exception {
		mvc.perform(post("/ask").contentType(MediaType.TEXT_PLAIN).content("not json"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.error", notNullValue()));
		ask("{broken").andExpect(status().isBadRequest()).andExpect(jsonPath("$.error", notNullValue()));
	}

	@Test
	void rejectsOversizedBody() throws Exception {
		ask("{\"problem\": \"" + "x".repeat(70_000) + "\"}")
			.andExpect(status().isContentTooLarge())
			.andExpect(jsonPath("$.error", notNullValue()));
	}

	@Test
	void handlesGeminiFailure() throws Exception {
		given(answers.generate(anyString())).willThrow(new IllegalStateException("quota"));
		ask("{\"problem\": \"Two Sum\"}").andExpect(status().isBadGateway()).andExpect(jsonPath("$.error", notNullValue()));
	}

	@Test
	void handlesEmptyAnswer() throws Exception {
		given(answers.generate(anyString())).willReturn(null);
		ask("{\"problem\": \"Two Sum\"}").andExpect(status().isBadGateway());
	}

	@Test
	void rateLimitsPerClientIp() throws Exception {
		for (int i = 0; i < 10; i++) {
			ask("{\"problem\": \"Two Sum\"}").andExpect(status().isOk());
		}
		ask("{\"problem\": \"Two Sum\"}")
			.andExpect(status().isTooManyRequests())
			.andExpect(jsonPath("$.error", notNullValue()));

		// A different client (last X-Forwarded-For hop) has its own allowance.
		mvc.perform(post("/ask").contentType(MediaType.APPLICATION_JSON)
			.header("X-Forwarded-For", "1.2.3.4, 9.9.9.9")
			.content("{\"problem\": \"Two Sum\"}")).andExpect(status().isOk());
	}

	private ResultActions ask(String json) throws Exception {
		return mvc.perform(post("/ask").contentType(MediaType.APPLICATION_JSON).content(json));
	}

}
