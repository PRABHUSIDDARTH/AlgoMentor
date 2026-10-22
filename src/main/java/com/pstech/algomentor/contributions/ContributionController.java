package com.pstech.algomentor.contributions;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import com.pstech.algomentor.web.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * "The project that got me in": people who have been placed share the project that helped. Submissions wait for review;
 * only approved ones are public. Everything shown is plain text, labelled as shared by users and not verified.
 */
@RestController
public class ContributionController {

	private static final Set<String> LEVELS = Set.of("intern", "sde1", "sde2", "sde3");

	private static final Set<String> REPO_HOSTS = Set.of("github.com", "www.github.com", "gitlab.com", "www.gitlab.com", "bitbucket.org", "www.bitbucket.org");

	private static final Pattern LINKEDIN = Pattern.compile("^[A-Za-z0-9-]{3,100}$");

	private static final Pattern EMAIL = Pattern.compile("^[^\\s@]{1,64}@[^\\s@]{1,190}\\.[^\\s@]{2,}$");

	private static final Pattern CONTROL = Pattern.compile("[\\p{Cntrl}&&[^\\n]]");

	private final ContributionStore store;

	private final String adminToken;

	public ContributionController(ContributionStore store, @Value("${algomentor.admin-token:}") String adminToken) {
		this.store = store;
		this.adminToken = adminToken == null ? "" : adminToken.strip();
	}

	/** The form. {@code website} is a honeypot: people leave it empty, bots fill it in. */
	public record Submission(String company, String level, String roleTitle, String projectTitle, String summary, String whyItHelped,
			String stack, String repoUrl, String name, String linkedin, String email, Integer year, Boolean consent, String website) {
	}

	@PostMapping("/api/contributions")
	public ResponseEntity<Map<String, String>> submit(@RequestBody Submission s) {
		if (s.website() != null && !s.website().isBlank()) {
			return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", UUID.randomUUID().toString(), "status", "PENDING"));
		}
		if (!Boolean.TRUE.equals(s.consent())) {
			throw bad("consent is needed: you agree that the details you add may be shown publicly after review.");
		}
		String company = text("company", s.company(), 2, 80, true);
		String roleTitle = text("roleTitle", s.roleTitle(), 2, 80, true);
		String projectTitle = text("projectTitle", s.projectTitle(), 4, 100, true);
		String summary = text("summary", s.summary(), 40, 1200, true);
		String why = text("whyItHelped", s.whyItHelped(), 40, 1200, true);
		String stack = text("stack", s.stack(), 2, 200, true);
		String name = text("name", s.name(), 1, 60, false);
		if (s.level() == null || !LEVELS.contains(s.level())) {
			throw bad("level must be one of intern, sde1, sde2, sde3.");
		}
		if (s.linkedin() != null && !s.linkedin().isBlank() && !LINKEDIN.matcher(s.linkedin().strip()).matches()) {
			throw bad("linkedin must be your profile name, like ana-gomez.");
		}
		if (s.email() != null && !s.email().isBlank() && !EMAIL.matcher(s.email().strip()).matches()) {
			throw bad("email does not look right.");
		}
		if (s.year() != null && (s.year() < 2000 || s.year() > Year.now().getValue() + 1)) {
			throw bad("year must be between 2000 and next year.");
		}
		String repoUrl = repo(s.repoUrl());
		if (store.pending().size() >= ContributionStore.MAX_PENDING) {
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Review is backed up. Please try again in a few days.");
		}
		Contribution c = new Contribution(UUID.randomUUID().toString(), Contribution.Status.PENDING, Instant.now(), null, company, s.level(), roleTitle,
				projectTitle, summary, why, stack, repoUrl, name, blankToNull(s.linkedin()), blankToNull(s.email()), s.year());
		store.add(c);
		return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", c.id(), "status", c.status().name()));
	}

	@GetMapping("/api/contributions")
	public List<Contribution.Shown> approved() {
		return store.approved().stream().map(Contribution::shown).toList();
	}

	@GetMapping("/api/admin/contributions")
	public List<Contribution> pending(@RequestHeader(value = "X-Admin-Token", required = false) String token) {
		requireAdmin(token);
		return store.pending();
	}

	@PostMapping("/api/admin/contributions/{id}/approve")
	public Contribution approve(@PathVariable String id, @RequestHeader(value = "X-Admin-Token", required = false) String token) {
		return decide(id, token, Contribution.Status.APPROVED);
	}

	@PostMapping("/api/admin/contributions/{id}/reject")
	public Contribution reject(@PathVariable String id, @RequestHeader(value = "X-Admin-Token", required = false) String token) {
		return decide(id, token, Contribution.Status.REJECTED);
	}

	private Contribution decide(String id, String token, Contribution.Status status) {
		requireAdmin(token);
		return store.decide(id, status, Instant.now()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No such contribution."));
	}

	/** Without a configured token the review API does not exist; with one, only a matching header gets in. */
	private void requireAdmin(String token) {
		if (token == null || adminToken.isEmpty() || !MessageDigest.isEqual(token.getBytes(StandardCharsets.UTF_8), adminToken.getBytes(StandardCharsets.UTF_8))) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "Review needs the admin token.");
		}
	}

	private static String text(String field, String value, int min, int max, boolean required) {
		String v = value == null ? "" : CONTROL.matcher(value).replaceAll("").strip();
		if (v.isEmpty() && !required) {
			return null;
		}
		if (v.length() < min || v.length() > max) {
			throw bad(field + " must be " + min + " to " + max + " characters.");
		}
		return v;
	}

	private static String repo(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		try {
			URI uri = URI.create(value.strip());
			if (!"https".equals(uri.getScheme()) || uri.getHost() == null || !REPO_HOSTS.contains(uri.getHost().toLowerCase()) || value.length() > 200) {
				throw bad("repoUrl must be an https link to GitHub, GitLab or Bitbucket.");
			}
			return uri.toString();
		}
		catch (IllegalArgumentException ex) {
			throw bad("repoUrl must be an https link to GitHub, GitLab or Bitbucket.");
		}
	}

	private static String blankToNull(String v) {
		return v == null || v.isBlank() ? null : v.strip();
	}

	private static ApiException bad(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, message);
	}

}
