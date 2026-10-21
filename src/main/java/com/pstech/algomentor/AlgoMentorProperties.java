package com.pstech.algomentor;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("algomentor")
public record AlgoMentorProperties(
		Gemini gemini,
		int maxProblemChars,
		long maxRequestBytes,
		RateLimit rateLimit) {

	public record Gemini(String apiKey, String model) {
	}

	public record RateLimit(int perMinute, int perDay) {
	}

}
