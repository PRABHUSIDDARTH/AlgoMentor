package com.pstech.algomentor.web;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;

import com.pstech.algomentor.AlgoMentorProperties;
import com.pstech.algomentor.gemini.AnswerGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
public class AskController {

	private static final Logger log = LoggerFactory.getLogger(AskController.class);

	private static final Duration STREAM_TIMEOUT = Duration.ofMinutes(3);

	private static final int MAX_HINT_CHARS = 4000;

	private static final String GEMINI_FAILED = "AlgoMentor couldn't get an answer right now. Please try again shortly.";

	private static final String EMPTY_ANSWER = "The model returned an empty answer. Try rephrasing the problem.";

	private final AnswerGenerator answers;

	private final Executor streamExecutor;

	private final int maxProblemChars;

	private final int maxHints;

	public AskController(AnswerGenerator answers, @Qualifier("streamExecutor") Executor streamExecutor,
			AlgoMentorProperties properties) {
		this.answers = answers;
		this.streamExecutor = streamExecutor;
		this.maxProblemChars = properties.maxProblemChars();
		this.maxHints = properties.maxHints();
	}

	/** {@code previousHints} is only used in hint mode: the hints already shown, oldest first. */
	public record AskRequest(String problem, String mode, List<String> previousHints) {
	}

	public record AskResponse(String result) {
	}

	@PostMapping("/ask")
	public AskResponse ask(@RequestBody AskRequest request) {
		String prompt = buildPrompt(request);
		String answer;
		try {
			answer = answers.generate(prompt);
		}
		catch (RuntimeException ex) {
			log.error("Gemini request failed", ex);
			throw new ApiException(HttpStatus.BAD_GATEWAY, GEMINI_FAILED);
		}

		if (answer == null || answer.isBlank()) {
			throw new ApiException(HttpStatus.BAD_GATEWAY, EMPTY_ANSWER);
		}
		return new AskResponse(answer);
	}

	/**
	 * Same as {@link #ask} but streams the answer as Server-Sent Events: a {@code chunk} event
	 * ({"text": ...}) per piece of text, then {@code done}, or {@code error} ({"error": ...}).
	 * Invalid requests are rejected with a normal JSON error before the stream starts.
	 */
	@PostMapping("/ask/stream")
	public SseEmitter askStream(@RequestBody AskRequest request) {
		String prompt = buildPrompt(request);
		SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT.toMillis());
		streamExecutor.execute(() -> streamAnswer(prompt, emitter));
		return emitter;
	}

	private void streamAnswer(String prompt, SseEmitter emitter) {
		boolean[] sentAny = { false };
		try {
			answers.stream(prompt, chunk -> {
				send(emitter, "chunk", Map.of("text", chunk));
				sentAny[0] = true;
			});
			if (sentAny[0]) {
				send(emitter, "done", Map.of());
			}
			else {
				send(emitter, "error", Map.of("error", EMPTY_ANSWER));
			}
			emitter.complete();
		}
		catch (UncheckedIOException ex) {
			// The browser disconnected; nothing left to send.
			emitter.complete();
		}
		catch (RuntimeException ex) {
			log.error("Gemini streaming request failed", ex);
			try {
				send(emitter, "error", Map.of("error", GEMINI_FAILED));
			}
			catch (UncheckedIOException ignored) {
			}
			emitter.complete();
		}
	}

	private static void send(SseEmitter emitter, String event, Object data) {
		try {
			emitter.send(SseEmitter.event().name(event).data(data));
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
	}

	private String buildPrompt(AskRequest request) {
		String problem = request.problem() == null ? "" : request.problem().strip();
		if (problem.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Please paste a problem first.");
		}
		if (problem.length() > maxProblemChars) {
			throw new ApiException(HttpStatus.BAD_REQUEST,
					"Problem is too long (max %d characters).".formatted(maxProblemChars));
		}

		Mode mode = Mode.from(request.mode());
		List<String> previousHints = request.previousHints() == null ? List.of() : request.previousHints();
		if (mode == Mode.HINT) {
			if (previousHints.size() >= maxHints) {
				throw new ApiException(HttpStatus.BAD_REQUEST,
						"You've seen all %d hints. Try Solution mode to see the full answer.".formatted(maxHints));
			}
			if (previousHints.stream().anyMatch(h -> h == null || h.length() > MAX_HINT_CHARS)) {
				throw new ApiException(HttpStatus.BAD_REQUEST, "Previous hints are invalid. Start the hints again.");
			}
		}
		return mode.prompt(problem, previousHints, maxHints);
	}

}
