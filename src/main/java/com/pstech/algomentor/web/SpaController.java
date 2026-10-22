package com.pstech.algomentor.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Serves the React app for its client-side routes, so deep links and reloads work. */
@Controller
public class SpaController {

	@GetMapping({ "/app", "/app/**", "/roadmap", "/roadmap/**", "/today", "/test/**", "/tests", "/level", "/level/core", "/learn", "/learn/**", "/projects", "/projects/**", "/git", "/git/{challengeId}", "/resume", "/companies", "/companies/{companyId}", "/about", "/about/settings", "/admin/review" })
	public String app() {
		return "forward:/index.html";
	}

}
