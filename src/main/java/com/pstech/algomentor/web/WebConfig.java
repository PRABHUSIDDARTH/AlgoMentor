package com.pstech.algomentor.web;

import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.pstech.algomentor.AlgoMentorProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	private final AlgoMentorProperties properties;

	public WebConfig(AlgoMentorProperties properties) {
		this.properties = properties;
	}

	@Bean
	RequestGuardInterceptor askGuard() {
		return new RequestGuardInterceptor(properties.rateLimit(), properties.maxRequestBytes());
	}

	// LeetCode, profile and GitHub lookups get their own allowance so they don't use up /ask requests.
	@Bean
	RequestGuardInterceptor problemGuard() {
		return new RequestGuardInterceptor(properties.problemRateLimit(), properties.maxRequestBytes());
	}

	// A few shares a day per person is plenty for "the project that got me in".
	@Bean
	RequestGuardInterceptor contributionGuard() {
		return new RequestGuardInterceptor(new AlgoMentorProperties.RateLimit(3, 10), 16 * 1024);
	}

	/** Runs streaming answers off the request thread; one cheap virtual thread per stream. */
	@Bean(destroyMethod = "close")
	ExecutorService streamExecutor() {
		return Executors.newVirtualThreadPerTaskExecutor();
	}

	/** Vite names built files by content hash, so they can be cached forever. */
	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/assets/**")
			.addResourceLocations("classpath:/static/assets/")
			.setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(askGuard()).addPathPatterns("/ask", "/ask/stream");
		// Only submitting is limited; reading the approved list is free.
		registry.addInterceptor(new HandlerInterceptor() {
			@Override
			public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
				return !"POST".equals(request.getMethod()) || contributionGuard().preHandle(request, response, handler);
			}
		}).addPathPatterns("/api/contributions");
		registry.addInterceptor(problemGuard()).addPathPatterns("/problem", "/profiles/**", "/git/check/**", "/git/repo-health/**");
	}

}
