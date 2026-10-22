package com.pstech.algomentor.github;

import java.util.List;

/** The outcome of a repository check: passed when every detail is ok. */
public record CheckResult(boolean passed, List<Detail> details) {

	public record Detail(boolean ok, String text) {
	}

	static CheckResult of(List<Detail> details) {
		return new CheckResult(!details.isEmpty() && details.stream().allMatch(Detail::ok), List.copyOf(details));
	}

}
