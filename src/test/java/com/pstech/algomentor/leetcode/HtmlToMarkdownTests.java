package com.pstech.algomentor.leetcode;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HtmlToMarkdownTests {

	@Test
	void convertsLeetCodeStatement() {
		String html = """
				<p>Given an array of integers <code>nums</code>&nbsp;and an integer <code>target</code>, return \
				<em>indices of the two numbers</em>.</p>

				<p>&nbsp;</p>
				<p><strong class="example">Example 1:</strong></p>

				<pre>
				<strong>Input:</strong> nums = [2,7,11,15], target = 9
				<strong>Output:</strong> [0,1]
				</pre>

				<p><strong>Constraints:</strong></p>

				<ul>
					<li><code>2 &lt;= nums.length &lt;= 10<sup>4</sup></code></li>
					<li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>
				</ul>
				""";

		assertThat(HtmlToMarkdown.convert(html)).isEqualTo("""
				Given an array of integers `nums` and an integer `target`, return *indices of the two numbers*.

				**Example 1:**

				```
				Input: nums = [2,7,11,15], target = 9
				Output: [0,1]
				```

				**Constraints:**

				- `2 <= nums.length <= 10^4`
				- `-10^9 <= nums[i] <= 10^9`""");
	}

	@Test
	void keepsSpaceAfterBoldLabel() {
		assertThat(HtmlToMarkdown.convert("<p><strong>Input: </strong>nums = [1]</p>")).isEqualTo("**Input:** nums = [1]");
	}

}
