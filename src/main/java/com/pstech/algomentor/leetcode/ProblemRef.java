package com.pstech.algomentor.leetcode;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * A reference to a LeetCode problem typed by the user: a number ("1", "#1", "LC 1",
 * "leetcode 1") or a problem URL ("https://leetcode.com/problems/two-sum/").
 * Exactly one of {@code number} and {@code slug} is set.
 */
public record ProblemRef(Integer number, String slug) {

	private static final Pattern NUMBER = Pattern.compile("^(?:#|lc\\s*#?|leetcode\\s*#?)?\\s*(\\d{1,5})\\.?$",
			Pattern.CASE_INSENSITIVE);

	private static final Pattern URL = Pattern
		.compile("^(?:https?://)?(?:www\\.)?leetcode\\.(?:com|cn)/problems/([a-z0-9-]+)/?\\S*$", Pattern.CASE_INSENSITIVE);

	public static Optional<ProblemRef> parse(String input) {
		if (input == null) {
			return Optional.empty();
		}
		String text = input.strip();
		Matcher number = NUMBER.matcher(text);
		if (number.matches()) {
			int n = Integer.parseInt(number.group(1));
			return n > 0 ? Optional.of(new ProblemRef(n, null)) : Optional.empty();
		}
		Matcher url = URL.matcher(text);
		if (url.matches()) {
			return Optional.of(new ProblemRef(null, url.group(1).toLowerCase()));
		}
		return Optional.empty();
	}

	@Override
	public String toString() {
		return number != null ? "#" + number : slug;
	}

}
