package com.pstech.algomentor.profiles;

import java.util.function.Supplier;

import com.pstech.algomentor.web.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Shared error handling: profile sites change formats and show bot checks, which must never surface as 500s. */
final class ProfileFetch {

	private static final Logger log = LoggerFactory.getLogger(ProfileFetch.class);

	private ProfileFetch() {
	}

	static ApiException notFound(String site, String user) {
		return new ApiException(HttpStatus.NOT_FOUND, "No public profile found for %s on %s.".formatted(user, site));
	}

	static ApiException unreadable(String site) {
		return new ApiException(HttpStatus.BAD_GATEWAY, "Couldn't read %s right now.".formatted(site));
	}

	/** Runs a request, mapping HTTP 404 to "not found" and anything unexpected to 502. */
	static <T> T call(String site, String user, Supplier<T> request) {
		try {
			return request.get();
		}
		catch (ApiException ex) {
			throw ex;
		}
		catch (HttpClientErrorException.NotFound ex) {
			throw notFound(site, user);
		}
		catch (RuntimeException ex) {
			log.warn("{} profile read failed for {}", site, user, ex);
			throw unreadable(site);
		}
	}

	/** Parses JSON ourselves: these sites often label JSON as text/html, or return an HTML bot check instead. */
	static JsonNode json(String body) {
		if (body == null || body.isBlank() || body.stripLeading().startsWith("<")) {
			throw new IllegalStateException("Expected JSON");
		}
		return JsonMapper.shared().readTree(body);
	}

	/** A required field; a missing or null one means the site changed its format. */
	static JsonNode require(JsonNode node, String field) {
		JsonNode value = node == null ? null : node.get(field);
		if (value == null || value.isNull()) {
			throw new IllegalStateException("Missing field " + field);
		}
		return value;
	}

}
