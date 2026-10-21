package com.pstech.algomentor.gemini;

import java.util.function.Consumer;

/**
 * Sends a prompt to the language model and returns its text answer.
 * Kept as an interface so tests can swap in a fake instead of calling Gemini.
 */
public interface AnswerGenerator {

	String generate(String prompt);

	/** Streams the answer, passing each text chunk to {@code onChunk} as it arrives. */
	void stream(String prompt, Consumer<String> onChunk);

}
