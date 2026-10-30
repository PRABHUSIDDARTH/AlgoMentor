package com.pstech.algomentor.contributions;

import java.time.Instant;

/**
 * A project a learner says helped them get a job, waiting for review. {@code email} is for the reviewer only and never
 * leaves the server through the public list.
 */
public record Contribution(String id, Status status, Instant submittedAt, Instant decidedAt, String company, String level,
		String roleTitle, String projectTitle, String summary, String whyItHelped, String stack, String repoUrl, String name,
		String linkedin, String email, Integer year) {

	public enum Status {

		PENDING, APPROVED, REJECTED

	}

	public Contribution withStatus(Status next, Instant at) {
		return new Contribution(id, next, submittedAt, at, company, level, roleTitle, projectTitle, summary, whyItHelped, stack,
				repoUrl, name, linkedin, email, year);
	}

	/** What the public list shows: no email, no review state. */
	public record Shown(String id, String company, String level, String roleTitle, String projectTitle, String summary,
			String whyItHelped, String stack, String repoUrl, String name, String linkedin, Integer year, Instant approvedAt) {
	}

	public Shown shown() {
		return new Shown(id, company, level, roleTitle, projectTitle, summary, whyItHelped, stack, repoUrl, name, linkedin, year,
				decidedAt);
	}

}
