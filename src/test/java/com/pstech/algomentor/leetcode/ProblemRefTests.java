package com.pstech.algomentor.leetcode;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class ProblemRefTests {

	@ParameterizedTest
	@ValueSource(strings = { "1", " 1 ", "#1", "1.", "LC 1", "lc1", "lc #1", "LeetCode 1", "leetcode#1" })
	void parsesProblemNumbers(String input) {
		assertThat(ProblemRef.parse(input)).contains(new ProblemRef(1, null));
	}

	@ParameterizedTest
	@ValueSource(strings = { "https://leetcode.com/problems/two-sum/", "leetcode.com/problems/two-sum",
			"https://www.leetcode.com/problems/two-sum/description/?envType=daily",
			"https://leetcode.cn/problems/Two-Sum/" })
	void parsesProblemUrls(String input) {
		assertThat(ProblemRef.parse(input)).contains(new ProblemRef(null, "two-sum"));
	}

	@ParameterizedTest
	@ValueSource(strings = { "", "0", "Given an array of 1 integers", "two sum", "123456",
			"https://example.com/problems/two-sum", "1 2" })
	void ignoresOrdinaryProblemText(String input) {
		assertThat(ProblemRef.parse(input)).isEmpty();
	}

	@Test
	void ignoresNull() {
		assertThat(ProblemRef.parse(null)).isEmpty();
	}

}
