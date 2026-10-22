package com.pstech.algomentor.leetcode;

import java.net.http.HttpClient;
import java.time.Duration;

import com.pstech.algomentor.AlgoMentorProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@Profile("!e2e")
public class LeetCodeConfig {

	@Bean
	LeetCodeClient leetCodeClient(AlgoMentorProperties properties) {
		String baseUrl = properties.leetcode().baseUrl();
		HttpClient httpClient = HttpClient.newBuilder()
			.connectTimeout(Duration.ofSeconds(5))
			.followRedirects(HttpClient.Redirect.NORMAL)
			.build();
		JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
		requestFactory.setReadTimeout(Duration.ofSeconds(20));

		RestClient http = RestClient.builder()
			.baseUrl(baseUrl)
			.requestFactory(requestFactory)
			// LeetCode rejects requests without a browser-like User-Agent.
			.defaultHeader("User-Agent", "Mozilla/5.0 (compatible; AlgoMentor)")
			.build();
		return new LeetCodeClient(http, baseUrl);
	}

}
