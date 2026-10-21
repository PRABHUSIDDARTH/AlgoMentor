package com.pstech.algomentor.web;

import java.util.List;

public enum Mode {

	EXPLAIN, HINT, SOLUTION, FOLLOWUP;

	/**
	 * Builds the prompt for this mode. For {@link #HINT}, {@code in.previousHints()} are the hints
	 * the user has already seen, so the model gives the next one instead of repeating them.
	 */
	public String prompt(PromptInput in) {
		return switch (this) {
			case EXPLAIN -> "Explain this DSA problem clearly with approach and intuition:\n\n" + in.problem();
			case SOLUTION -> solutionPrompt(in.problem(), in.language());
			case HINT -> hintPrompt(in.problem(), in.previousHints(), in.maxHints());
			case FOLLOWUP -> followupPrompt(in);
		};
	}

	private static String followupPrompt(PromptInput in) {
		StringBuilder prompt = new StringBuilder()
			.append("You are a DSA tutor answering a student's follow-up question about this problem only. ")
			.append("If the question is unrelated to the problem, steer back to it briefly.\n");
		if (!in.solutionRevealed()) {
			prompt.append("Do not give full code or the complete solution; keep guiding with reasoning.\n");
		}
		prompt.append("\nProblem:\n").append(in.problem()).append('\n');
		if (!in.previousHints().isEmpty()) {
			prompt.append("\nHints already given:\n");
			for (int i = 0; i < in.previousHints().size(); i++) {
				prompt.append(i + 1).append(". ").append(in.previousHints().get(i).strip()).append('\n');
			}
		}
		if (!in.conversation().isEmpty()) {
			prompt.append("\nConversation so far:\n");
			for (PromptInput.Turn turn : in.conversation()) {
				prompt.append("user".equals(turn.role()) ? "Student: " : "Mentor: ").append(turn.text().strip()).append('\n');
			}
		}
		prompt.append("\nStudent's follow-up question:\n").append(in.question().strip()).append('\n');
		return prompt.toString();
	}

	private static String solutionPrompt(String problem, Language language) {
		return """
				Give the optimal solution with code in %s and explain the approach for:

				%s

				End your answer with this fenced block, filled in:
				```complexity
				time: O(...) | <short reason>
				space: O(...) | <short reason>
				```
				""".formatted(language.displayName(), problem);
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
