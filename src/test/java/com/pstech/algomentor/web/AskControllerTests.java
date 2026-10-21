package com.pstech.algomentor.web;

import com.pstech.algomentor.gemini.AnswerGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.function.Consumer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willAnswer;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AskControllerTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	@Qualifier("askGuard")
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
		ask("{\"problem\": \"" + "x".repeat(12_001) + "\"}").andExpect(status().isBadRequest());
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

	@Test
	void hintPromptIncludesPreviousHintsAndNextNumber() throws Exception {
		ask("{\"problem\": \"Two Sum\", \"mode\": \"hint\", \"previousHints\": [\"Use a loop\", \"Think about lookups\"]}")
			.andExpect(status().isOk());
		verify(answers).generate(argThat(p -> p.contains("hint 3 of at most 4") && p.contains("1. Use a loop")
				&& p.contains("2. Think about lookups")));
	}

	@Test
	void finalHintMayNameTheTechnique() throws Exception {
		ask("{\"problem\": \"Two Sum\", \"mode\": \"hint\", \"previousHints\": [\"a\", \"b\", \"c\"]}")
			.andExpect(status().isOk());
		verify(answers).generate(argThat(p -> p.contains("hint 4 of at most 4") && p.contains("final hint")));
	}

	@Test
	void rejectsHintsPastTheLimit() throws Exception {
		ask("{\"problem\": \"Two Sum\", \"mode\": \"hint\", \"previousHints\": [\"a\", \"b\", \"c\", \"d\"]}")
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.error", containsString("Solution")));
	}

	@Test
	void streamsChunksThenDone() throws Exception {
		willAnswer(inv -> {
			Consumer<String> onChunk = inv.getArgument(1);
			onChunk.accept("**Two");
			onChunk.accept(" pointers**\nline 2");
			return null;
		}).given(answers).stream(anyString(), any());

		String body = stream("{\"problem\": \"Two Sum\", \"mode\": \"hint\"}");
		assertThat(body).contains("event:chunk", "{\"text\":\"**Two\"}", "{\"text\":\" pointers**\\nline 2\"}",
				"event:done");
		assertThat(body.indexOf("event:done")).isGreaterThan(body.lastIndexOf("event:chunk"));
		verify(answers).stream(argThat(p -> p.contains("hint 1 of at most 4")), any());
	}

	@Test
	void streamSendsErrorEventWhenGeminiFails() throws Exception {
		willThrow(new IllegalStateException("quota")).given(answers).stream(anyString(), any());
		String body = stream("{\"problem\": \"Two Sum\"}");
		assertThat(body).contains("event:error", "couldn't get an answer").doesNotContain("event:done");
	}

	@Test
	void streamSendsErrorEventForEmptyAnswer() throws Exception {
		String body = stream("{\"problem\": \"Two Sum\"}"); // mock stream() emits nothing
		assertThat(body).contains("event:error", "empty answer");
	}

	@Test
	void streamRejectsInvalidRequestWithJsonBeforeStreaming() throws Exception {
		mvc.perform(post("/ask/stream").contentType(MediaType.APPLICATION_JSON).content("{\"problem\": \"\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.error", notNullValue()));
	}

	@Test
	void streamIsRateLimitedWithAsk() throws Exception {
		for (int i = 0; i < 10; i++) {
			ask("{\"problem\": \"Two Sum\"}").andExpect(status().isOk());
		}
		mvc.perform(post("/ask/stream").contentType(MediaType.APPLICATION_JSON).content("{\"problem\": \"Two Sum\"}"))
			.andExpect(status().isTooManyRequests());
	}

	@Test
	void solutionPromptUsesRequestedLanguage() throws Exception {
		ask("{\"problem\": \"Two Sum\", \"mode\": \"solution\", \"language\": \"java\"}").andExpect(status().isOk());
		verify(answers).generate(argThat(p -> p.contains("code in Java") && p.contains("```complexity")));
	}

	@Test
	void solutionDefaultsToPython() throws Exception {
		ask("{\"problem\": \"Two Sum\", \"mode\": \"solution\"}").andExpect(status().isOk());
		verify(answers).generate(argThat(p -> p.contains("code in Python")));
	}

	@Test
	void rejectsUnsupportedLanguage() throws Exception {
		ask("{\"problem\": \"Two Sum\", \"mode\": \"solution\", \"language\": \"rust\"}")
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.error", containsString("Unsupported language")));
	}

	private String stream(String json) throws Exception {
		MvcResult result = mvc.perform(post("/ask/stream").contentType(MediaType.APPLICATION_JSON).content(json))
			.andExpect(request().asyncStarted())
			.andReturn();
		result.getAsyncResult(5_000);
		return result.getResponse().getContentAsString();
	}

	private ResultActions ask(String json) throws Exception {
		return mvc.perform(post("/ask").contentType(MediaType.APPLICATION_JSON).content(json));
	}

}
