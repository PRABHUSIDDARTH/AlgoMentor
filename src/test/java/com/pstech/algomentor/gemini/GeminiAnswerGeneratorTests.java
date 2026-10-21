package com.pstech.algomentor.gemini;

import com.pstech.algomentor.AlgoMentorProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

class GeminiAnswerGeneratorTests {

	@Test
	void missingApiKeyFailsOnFirstUseNotAtStartup() {
		var properties = new AlgoMentorProperties(new AlgoMentorProperties.Gemini("", "gemini-2.5-flash"), 8000,
				65536, new AlgoMentorProperties.RateLimit(10, 100));
		var generator = new GeminiAnswerGenerator(properties);

		assertThatIllegalStateException().isThrownBy(() -> generator.generate("Two Sum"))
			.withMessageContaining("GEMINI_API_KEY");
	}

}
