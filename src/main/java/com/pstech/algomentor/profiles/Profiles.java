package com.pstech.algomentor.profiles;

import java.util.List;

/** Public profile data read from LeetCode, HackerRank, GeeksforGeeks and GitHub. */
public final class Profiles {

	private Profiles() {
	}

	public record Solved(int easy, int medium, int hard, int total) {
	}

	public record TopicCount(String tag, int solved) {
	}

	/** {@code solvedAt} is epoch seconds. LeetCode only exposes the most recent ~20 accepted problems. */
	public record RecentSolve(String slug, String title, long solvedAt) {
	}

	public record LeetCodeProfile(String username, Integer ranking, Solved solved, List<TopicCount> topics,
			List<RecentSolve> recent) {
	}

	public record Badge(String name, int stars, int level, int solved) {
	}

	public record HackerRankProfile(String username, List<Badge> badges) {
	}

	public record GfgProfile(String username, int solved, int score, Integer instituteRank, Integer streak) {
	}

	/** Stars and languages cover the user's own public repositories (not forks); {@code lastPushAt} is epoch seconds. */
	public record GitHubProfile(String username, int publicRepos, int followers, int stars, List<String> languages,
			Long lastPushAt) {
	}

}
