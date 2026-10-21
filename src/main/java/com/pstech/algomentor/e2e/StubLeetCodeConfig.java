package com.pstech.algomentor.e2e;

import java.util.List;
import java.util.Map;

import com.pstech.algomentor.leetcode.LeetCodeClient;
import com.pstech.algomentor.leetcode.ProblemRef;
import com.pstech.algomentor.web.ApiException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;

/** Fixed LeetCode data for browser tests under the {@code e2e} profile; never calls LeetCode. */
@Configuration
@Profile("e2e")
public class StubLeetCodeConfig {

	private static final Map<String, LeetCodeClient.Problem> PROBLEMS = Map.of(
			"two-sum", new LeetCodeClient.Problem("1", "Two Sum", "two-sum", "Easy", List.of("Array", "Hash Table"),
					"https://leetcode.com/problems/two-sum/",
					"Given an array of integers `nums` and an integer `target`, return *indices of the two numbers* "
							+ "such that they add up to `target`.\n\n**Example 1:**\n\n```\nInput: nums = [2,7,11,15], target = 9\n"
							+ "Output: [0,1]\n```"),
			"lru-cache", new LeetCodeClient.Problem("146", "LRU Cache", "lru-cache", "Medium",
					List.of("Hash Table", "Linked List", "Design"), "https://leetcode.com/problems/lru-cache/",
					"Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**. "
							+ "`get` and `put` must each run in `O(1)` average time."));

	private static final Map<Integer, String> SLUGS = Map.of(1, "two-sum", 146, "lru-cache");

	@Bean
	LeetCodeClient leetCodeClient() {
		return new LeetCodeClient(RestClient.create(), "https://leetcode.com") {
			@Override
			public Problem fetch(ProblemRef ref) {
				String slug = ref.slug() != null ? ref.slug() : SLUGS.get(ref.number());
				Problem problem = slug == null ? null : PROBLEMS.get(slug);
				if (problem == null) {
					throw new ApiException(HttpStatus.NOT_FOUND, "Couldn't find LeetCode problem %s.".formatted(ref));
				}
				return problem;
			}
		};
	}

}
