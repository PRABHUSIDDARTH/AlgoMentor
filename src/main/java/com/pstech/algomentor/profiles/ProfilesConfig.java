package com.pstech.algomentor.profiles;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@Profile("!e2e")
public class ProfilesConfig {

	private static RestClient http() {
		HttpClient client = HttpClient.newBuilder()
			.connectTimeout(Duration.ofSeconds(5))
			.followRedirects(HttpClient.Redirect.NORMAL)
			.build();
		JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client);
		factory.setReadTimeout(Duration.ofSeconds(20));
		// These sites reject requests without a browser-like User-Agent.
		return RestClient.builder().requestFactory(factory).defaultHeader("User-Agent", "Mozilla/5.0 (compatible; AlgoMentor)").build();
	}

	@Bean
	LeetCodeProfileClient leetCodeProfileClient() {
		return new LeetCodeProfileClient(http(), "https://leetcode.com");
	}

	@Bean
	HackerRankProfileClient hackerRankProfileClient() {
		return new HackerRankProfileClient(http(), "https://www.hackerrank.com");
	}

	@Bean
	GfgProfileClient gfgProfileClient() {
		return new GfgProfileClient(http(), "https://www.geeksforgeeks.org");
	}

	@Bean
	GitHubProfileClient gitHubProfileClient(@Value("${algomentor.github.token:}") String token) {
		return new GitHubProfileClient(http(), "https://api.github.com", token);
	}

}
