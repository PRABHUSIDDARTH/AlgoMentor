package com.pstech.algomentor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AlgoMentorApplication {

	public static void main(String[] args) {
		SpringApplication.run(AlgoMentorApplication.class, args);
	}

}
