package com.pstech.algomentor.web;

import org.springframework.http.HttpStatus;

/** Programming language for solution code. */
public enum Language {

	PYTHON("Python"), JAVA("Java"), CPP("C++");

	private final String displayName;

	Language(String displayName) {
		this.displayName = displayName;
	}

	public String displayName() {
		return displayName;
	}

	/** Missing or blank means Python; anything unknown is rejected rather than silently replaced. */
	public static Language parse(String value) {
		if (value == null || value.isBlank()) {
			return PYTHON;
		}
		for (Language language : values()) {
			if (language.name().equalsIgnoreCase(value.strip())) {
				return language;
			}
		}
		throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported language. Use python, java or cpp.");
	}

}
