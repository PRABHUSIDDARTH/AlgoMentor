package com.pstech.algomentor.gemini;

import java.util.function.Consumer;

import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.GenerateContentResponse;
import com.pstech.algomentor.AlgoMentorProperties;
import jakarta.annotation.PreDestroy;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@Profile("!e2e")
public class GeminiAnswerGenerator implements AnswerGenerator {

	private final AlgoMentorProperties.Gemini config;

	private volatile Client client;

	public GeminiAnswerGenerator(AlgoMentorProperties properties) {
		this.config = properties.gemini();
	}

	@Override
	public String generate(String prompt) {
		return client().models.generateContent(config.model(), prompt, null).text();
	}

	@Override
	public void stream(String prompt, Consumer<String> onChunk) {
		// Closing the stream also stops the request if onChunk throws (e.g. the browser left).
		try (ResponseStream<GenerateContentResponse> stream = client().models.generateContentStream(config.model(),
				prompt, null)) {
			for (GenerateContentResponse response : stream) {
				String text = response.text();
				if (text != null && !text.isEmpty()) {
					onChunk.accept(text);
				}
			}
		}
	}

	// Created lazily so the app (and tests) can start without GEMINI_API_KEY set.
	private Client client() {
		Client c = client;
		if (c == null) {
			synchronized (this) {
				c = client;
				if (c == null) {
					if (!StringUtils.hasText(config.apiKey())) {
						throw new IllegalStateException("GEMINI_API_KEY is not set");
					}
					c = client = Client.builder().apiKey(config.apiKey()).build();
				}
			}
		}
		return c;
	}

	@PreDestroy
	void close() {
		if (client != null) {
			client.close();
		}
	}

}
