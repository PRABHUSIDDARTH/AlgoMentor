package com.pstech.algomentor.e2e;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StubAnswerGeneratorTests {

	final StubAnswerGenerator stub = new StubAnswerGenerator(Duration.ZERO);

	@Test
	void hintStartsWithItsNumber() {
		List<String> chunks = stream("Give ONLY hint 2 of at most 4.\n\nProblem:\nTwo Sum");
		assertThat(String.join("", chunks)).startsWith("**Hint 2:**");
		assertThat(chunks).hasSizeGreaterThan(1);
	}

	@Test
	void solutionUsesRequestedLanguageAndComplexityBlock() {
		List<String> chunks = stream("Give the optimal solution with code in Java and explain the approach for:\n\nTwo Sum");
		String text = String.join("", chunks);
		assertThat(text).contains("```java").contains("```complexity");
		assertThat(chunks).hasSizeGreaterThan(1);
	}

	@Test
	void followupIsLabelled() {
		List<String> chunks = stream("You are a DSA tutor answering a student's follow-up question about this problem only.");
		assertThat(String.join("", chunks)).contains("Follow-up:");
		assertThat(chunks).hasSizeGreaterThan(1);
	}

	@Test
	void explainStreamsSeveralChunksAndGenerateJoinsThem() {
		String prompt = "Explain this DSA problem clearly with approach and intuition:\n\nTwo Sum";
		List<String> chunks = stream(prompt);
		assertThat(chunks).hasSizeGreaterThan(1);
		assertThat(stub.generate(prompt)).isEqualTo(String.join("", chunks));
	}

	private List<String> stream(String prompt) {
		List<String> chunks = new ArrayList<>();
		stub.stream(prompt, chunks::add);
		return chunks;
	}

}
