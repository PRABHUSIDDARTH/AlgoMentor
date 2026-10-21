package com.pstech.algomentor.web;

import java.io.IOException;
import java.time.Duration;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.pstech.algomentor.AlgoMentorProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Rejects oversized bodies and rate-limits each client IP before a request reaches Gemini.
 * Limits are kept in memory, so they apply per instance.
 */
public class RequestGuardInterceptor implements HandlerInterceptor {

	private final AlgoMentorProperties.RateLimit limit;

	private final long maxRequestBytes;

	// Idle IPs are evicted after a day, so the map can't grow without bound.
	private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
		.expireAfterAccess(Duration.ofDays(1))
		.maximumSize(100_000)
		.build();

	public RequestGuardInterceptor(AlgoMentorProperties.RateLimit limit, long maxRequestBytes) {
		this.limit = limit;
		this.maxRequestBytes = maxRequestBytes;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws IOException {
		if (request.getContentLengthLong() > maxRequestBytes) {
			return reject(response, HttpStatus.CONTENT_TOO_LARGE, "Request is too large.");
		}
		if (!buckets.get(clientIp(request), ip -> newBucket()).tryConsume(1)) {
			return reject(response, HttpStatus.TOO_MANY_REQUESTS,
					"Too many requests. Please wait a minute and try again.");
		}
		return true;
	}

	public void reset() {
		buckets.invalidateAll();
	}

	private Bucket newBucket() {
		return Bucket.builder()
			.addLimit(Bandwidth.builder().capacity(limit.perMinute()).refillIntervally(limit.perMinute(), Duration.ofMinutes(1)).build())
			.addLimit(Bandwidth.builder().capacity(limit.perDay()).refillIntervally(limit.perDay(), Duration.ofDays(1)).build())
			.build();
	}

	// Cloud Run's front end appends the real client IP as the last X-Forwarded-For entry;
	// earlier entries come from the client and can be forged.
	static String clientIp(HttpServletRequest request) {
		String forwarded = request.getHeader("X-Forwarded-For");
		if (StringUtils.hasText(forwarded)) {
			String[] parts = forwarded.split(",");
			return parts[parts.length - 1].strip();
		}
		return request.getRemoteAddr();
	}

	private static boolean reject(HttpServletResponse response, HttpStatus status, String message) throws IOException {
		response.setStatus(status.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write("{\"error\":\"" + message + "\"}");
		return false;
	}

}
