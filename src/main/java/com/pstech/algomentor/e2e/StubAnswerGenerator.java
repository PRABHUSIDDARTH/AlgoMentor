package com.pstech.algomentor.e2e;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.pstech.algomentor.gemini.AnswerGenerator;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Deterministic stand-in for Gemini, active only under the {@code e2e} profile so browser tests
 * don't depend on a real model. It recognises the mode from markers in the prompt.
 */
@Component
@Profile("e2e")
public class StubAnswerGenerator implements AnswerGenerator {

	private static final Pattern HINT = Pattern.compile("Give ONLY hint (\\d)");

	private static final Pattern LANGUAGE = Pattern.compile("code in (Python|Java|C\\+\\+)");

	private static final int CHUNKS = 5;

	private final Duration delay;

	public StubAnswerGenerator() {
		this(Duration.ofMillis(40));
	}

	StubAnswerGenerator(Duration delay) {
		this.delay = delay;
	}

	@Override
	public String generate(String prompt) {
		return answerFor(prompt);
	}

	@Override
	public void stream(String prompt, Consumer<String> onChunk) {
		for (String chunk : split(answerFor(prompt))) {
			pause();
			onChunk.accept(chunk);
		}
	}

	private static String answerFor(String prompt) {
		Matcher hint = HINT.matcher(prompt);
		if (hint.find()) {
			return "**Hint " + hint.group(1) + ":** Think about which values you have already seen, "
					+ "and how you could look one up in constant time.";
		}
		Matcher language = LANGUAGE.matcher(prompt);
		if (language.find()) {
			String fence = switch (language.group(1)) {
				case "Java" -> "java";
				case "C++" -> "cpp";
				default -> "python";
			};
			return "Keep a hash map from value to index and check each complement as you go.\n\n"
					+ "```" + fence + "\n" + code(fence) + "\n```\n\n"
					+ "```complexity\ntime: O(n) | one pass over the array\nspace: O(n) | the hash map\n```\n";
		}
		if (prompt.contains("follow-up")) {
			return "Follow-up: an array would need a linear scan for every lookup, "
					+ "so the whole approach would become quadratic.";
		}
		return "**Intuition.** For each number, the partner you need is target minus that number. "
				+ "Remembering what you've seen turns the search into a lookup.";
	}

	private static String code(String fence) {
		return switch (fence) {
			case "java" -> "int[] twoSum(int[] nums, int target) {\n    Map<Integer, Integer> seen = new HashMap<>();\n    return new int[0];\n}";
			case "cpp" -> "vector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int, int> seen;\n    return {};\n}";
			default -> "def two_sum(nums, target):\n    seen = {}\n    return []";
		};
	}

	private static List<String> split(String text) {
		List<String> chunks = new ArrayList<>();
		int size = (int) Math.ceil(text.length() / (double) CHUNKS);
		for (int i = 0; i < text.length(); i += size) {
			chunks.add(text.substring(i, Math.min(text.length(), i + size)));
		}
		return chunks;
	}

	private void pause() {
		if (delay.isZero()) {
			return;
		}
		try {
			Thread.sleep(delay);
		}
		catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
		}
	}

}
