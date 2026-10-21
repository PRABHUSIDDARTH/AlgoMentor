package com.pstech.algomentor.web;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** The HTML shell names the current asset hashes, so browsers must revalidate it on every visit. */
@Component
public class HtmlNoCacheFilter extends OncePerRequestFilter {

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String path = request.getRequestURI();
		return !(path.equals("/") || path.equals("/index.html") || path.equals("/app") || path.startsWith("/app/"));
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		response.setHeader("Cache-Control", "no-cache");
		chain.doFilter(request, response);
	}

}
