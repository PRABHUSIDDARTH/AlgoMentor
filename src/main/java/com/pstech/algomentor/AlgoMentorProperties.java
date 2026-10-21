package com.pstech.algomentor;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("algomentor")
public record AlgoMentorProperties(
		Gemini gemini,
		int maxProblemChars,
		int maxHints,
		long maxRequestBytes,
		RateLimit rateLimit,
		RateLimit problemRateLimit,
		LeetCode leetcode) {

	public record Gemini(String apiKey, String model) {
	}

	public record RateLimit(int perMinute, int perDay) {
	}

	public record LeetCode(String baseUrl) {
	}

}
