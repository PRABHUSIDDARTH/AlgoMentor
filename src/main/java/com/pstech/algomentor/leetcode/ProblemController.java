package com.pstech.algomentor.leetcode;

import com.pstech.algomentor.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProblemController {

	private final LeetCodeClient leetCode;

	public ProblemController(LeetCodeClient leetCode) {
		this.leetCode = leetCode;
	}

	/** Fetches a LeetCode problem by number ("1", "#1", "LC 1") or problem URL. */
	@GetMapping("/problem")
	public LeetCodeClient.Problem problem(@RequestParam String ref) {
		ProblemRef parsed = ProblemRef.parse(ref)
			.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
					"Enter a LeetCode problem number (e.g. 1) or a leetcode.com/problems/... link."));
		return leetCode.fetch(parsed);
	}

}
