package com.pstech.algomentor.github;

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
public class GitHubConfig {

	/** Optional read-only token: 5,000 calls an hour instead of 60. */
	@Bean
	GitHubClient gitHubClient(@Value("${algomentor.github.token:}") String token) {
		HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NORMAL).build();
		JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client);
		factory.setReadTimeout(Duration.ofSeconds(15));
		RestClient http = RestClient.builder().requestFactory(factory).defaultHeader("User-Agent", "AlgoMentor").build();
		return new GitHubClient(http, "https://api.github.com", token);
	}

	@Bean
	GitChecks gitChecks(GitHubClient gitHubClient) {
		return new GitChecks(gitHubClient);
	}

	@Bean
	RepoHealth repoHealth(GitHubClient gitHubClient) {
		return new RepoHealth(gitHubClient);
	}

}
