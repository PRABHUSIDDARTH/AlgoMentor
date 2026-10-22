package com.pstech.algomentor.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SpaControllerTests {

	@Autowired
	MockMvc mvc;

	@Test
	void forwardsAppRoutes() throws Exception {
		mvc.perform(get("/app")).andExpect(status().isOk()).andExpect(forwardedUrl("/index.html"));
		mvc.perform(get("/app/anything")).andExpect(status().isOk()).andExpect(forwardedUrl("/index.html"));
	}

	@Test
	void forwardsPracticeRoutes() throws Exception {
		for (String path : new String[] { "/roadmap", "/roadmap/arrays", "/today", "/test/abc", "/level", "/learn", "/learn/oop" }) {
			mvc.perform(get(path)).andExpect(status().isOk()).andExpect(forwardedUrl("/index.html"));
		}
	}

	@Test
	void leavesApiAlone() throws Exception {
		mvc.perform(get("/problem")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").exists());
	}

}
