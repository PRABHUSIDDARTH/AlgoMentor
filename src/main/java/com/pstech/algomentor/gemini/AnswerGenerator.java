package com.pstech.algomentor.gemini;

/**
 * Sends a prompt to the language model and returns its text answer.
 * Kept as an interface so tests can swap in a fake instead of calling Gemini.
 */
public interface AnswerGenerator {

	String generate(String prompt);

}
