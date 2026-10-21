package com.pstech.algomentor.web;

import java.util.List;

/**
 * Everything a {@link Mode} may need to build its prompt. Fields a mode doesn't use are ignored.
 *
 * @param previousHints hints already shown, oldest first
 * @param conversation earlier follow-up exchanges, oldest first
 * @param question the follow-up question being asked
 * @param solutionRevealed whether the student has already seen the full solution
 */
public record PromptInput(String problem, List<String> previousHints, int maxHints, Language language,
		List<Turn> conversation, String question, boolean solutionRevealed) {

	/** One follow-up message; {@code role} is "user" or "mentor". */
	public record Turn(String role, String text) {
	}

}
