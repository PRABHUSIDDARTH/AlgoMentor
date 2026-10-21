package com.pstech.algomentor.web;

import java.util.List;

public enum Mode {

	EXPLAIN, HINT, SOLUTION;

	/**
	 * Builds the prompt for this mode. For {@link #HINT}, {@code previousHints} are the hints the
	 * user has already seen, so the model gives the next one instead of repeating them.
	 */
	public String prompt(String problem, List<String> previousHints, int maxHints) {
		return switch (this) {
			case EXPLAIN -> "Explain this DSA problem clearly with approach and intuition:\n\n" + problem;
			case SOLUTION ->
				"Give the optimal solution with code (Python/Java) and time/space complexity for:\n\n" + problem;
			case HINT -> hintPrompt(problem, previousHints, maxHints);
		};
	}

	private static String hintPrompt(String problem, List<String> previousHints, int maxHints) {
		int number = previousHints.size() + 1;
		StringBuilder prompt = new StringBuilder()
			.append("You are a DSA tutor giving hints one at a time, so the student can solve the problem themselves.\n")
			.append("Give ONLY hint ").append(number).append(" of at most ").append(maxHints).append(".\n")
			.append("Rules: 2-4 sentences, no code, never reveal the full solution. ")
			.append("Each hint must be more specific than the previous ones and must not repeat them. ")
			.append("Start your reply with \"**Hint ").append(number).append(":**\".\n");
		if (number == maxHints) {
			prompt.append("This is the final hint: you may name the exact technique or data structure, but still no code.\n");
		}
		prompt.append("\nProblem:\n").append(problem).append('\n');
		if (!previousHints.isEmpty()) {
			prompt.append("\nHints already given:\n");
			for (int i = 0; i < previousHints.size(); i++) {
				prompt.append(i + 1).append(". ").append(previousHints.get(i).strip()).append('\n');
			}
		}
		return prompt.toString();
	}

	/** Unknown or missing modes fall back to EXPLAIN, matching the original Flask app. */
	public static Mode from(String value) {
		if (value != null) {
			for (Mode mode : values()) {
				if (mode.name().equalsIgnoreCase(value)) {
					return mode;
				}
			}
		}
		return EXPLAIN;
	}

}
