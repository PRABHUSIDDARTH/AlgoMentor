package com.pstech.algomentor.contributions;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ContributionConfig {

	/** Set algomentor.contributions.file (CONTRIBUTIONS_FILE) to a path on a persistent disk in production. */
	@Bean
	ContributionStore contributionStore(@Value("${algomentor.contributions.file:}") String path) {
		String file = path == null || path.isBlank() ? System.getProperty("java.io.tmpdir") + "/algomentor-contributions.json" : path;
		return new ContributionStore(file);
	}

}
