package com.pstech.algomentor.web;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	private final RequestGuardInterceptor requestGuard;

	public WebConfig(RequestGuardInterceptor requestGuard) {
		this.requestGuard = requestGuard;
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(requestGuard).addPathPatterns("/ask");
	}

}
