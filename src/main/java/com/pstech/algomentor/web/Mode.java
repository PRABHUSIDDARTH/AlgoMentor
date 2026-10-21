package com.pstech.algomentor.web;

public enum Mode {

	EXPLAIN("Explain this DSA problem clearly with approach and intuition:\n\n%s"),
	HINT("Give 2-3 progressive hints (no full solution) for this DSA problem:\n\n%s"),
	SOLUTION("Give the optimal solution with code (Python/Java) and time/space complexity for:\n\n%s");

	private final String template;

	Mode(String template) {
		this.template = template;
	}

	public String prompt(String problem) {
		return template.formatted(problem);
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
