package com.pstech.algomentor.web;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.pstech.algomentor.AlgoMentorProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
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

	// LeetCode lookups get their own allowance so fetching a problem doesn't use up /ask requests.
	@Bean
	RequestGuardInterceptor problemGuard() {
		return new RequestGuardInterceptor(properties.problemRateLimit(), properties.maxRequestBytes());
	}

	/** Runs streaming answers off the request thread; one cheap virtual thread per stream. */
	@Bean(destroyMethod = "close")
	ExecutorService streamExecutor() {
		return Executors.newVirtualThreadPerTaskExecutor();
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(askGuard()).addPathPatterns("/ask", "/ask/stream");
		registry.addInterceptor(problemGuard()).addPathPatterns("/problem");
	}

}
