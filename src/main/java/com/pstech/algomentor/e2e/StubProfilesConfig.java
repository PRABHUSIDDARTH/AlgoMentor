package com.pstech.algomentor.e2e;

import java.util.List;

import com.pstech.algomentor.profiles.GfgProfileClient;
import com.pstech.algomentor.profiles.GitHubProfileClient;
import com.pstech.algomentor.profiles.HackerRankProfileClient;
import com.pstech.algomentor.profiles.LeetCodeProfileClient;
import com.pstech.algomentor.profiles.Profiles;
import com.pstech.algomentor.web.ApiException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;

/** Fixed profiles for browser tests: user "demo" exists on every site; everyone else is not found. */
@Configuration
@Profile("e2e")
public class StubProfilesConfig {

	private static void requireDemo(String user, String site) {
		if (!"demo".equalsIgnoreCase(user)) {
			throw new ApiException(HttpStatus.NOT_FOUND, "No public profile found for %s on %s.".formatted(user, site));
		}
	}

	@Bean
	LeetCodeProfileClient leetCodeProfileClient() {
		return new LeetCodeProfileClient(RestClient.create(), "https://leetcode.com") {
			@Override
			public Profiles.LeetCodeProfile fetch(String user) {
				requireDemo(user, "LeetCode");
				return new Profiles.LeetCodeProfile("demo", 250_000, new Profiles.Solved(140, 150, 22, 312),
						List.of(new Profiles.TopicCount("Array", 120), new Profiles.TopicCount("Hash Table", 60),
								new Profiles.TopicCount("String", 55), new Profiles.TopicCount("Dynamic Programming", 20)),
						List.of(new Profiles.RecentSolve("two-sum", "Two Sum", 1_790_000_000L),
								new Profiles.RecentSolve("valid-anagram", "Valid Anagram", 1_790_000_100L)));
			}
		};
	}

	@Bean
	HackerRankProfileClient hackerRankProfileClient() {
		return new HackerRankProfileClient(RestClient.create(), "https://www.hackerrank.com") {
			@Override
			public Profiles.HackerRankProfile fetch(String user) {
				requireDemo(user, "HackerRank");
				return new Profiles.HackerRankProfile("demo", List.of(new Profiles.Badge("Problem Solving", 5, 3, 80)));
			}
		};
	}

	@Bean
	GfgProfileClient gfgProfileClient() {
		return new GfgProfileClient(RestClient.create(), "https://www.geeksforgeeks.org") {
			@Override
			public Profiles.GfgProfile fetch(String user) {
				requireDemo(user, "GeeksforGeeks");
				return new Profiles.GfgProfile("demo", 125, 320, 454, 7);
			}
		};
	}

	@Bean
	GitHubProfileClient gitHubProfileClient() {
		return new GitHubProfileClient(RestClient.create(), "https://api.github.com", "") {
			@Override
			public Profiles.GitHubProfile fetch(String user) {
				requireDemo(user, "GitHub");
				return new Profiles.GitHubProfile("demo", 12, 30, 48, List.of("Java", "TypeScript"), 1_790_000_000L);
			}
		};
	}

}
