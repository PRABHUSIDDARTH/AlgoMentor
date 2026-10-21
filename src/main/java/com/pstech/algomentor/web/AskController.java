package com.pstech.algomentor.web;

import com.pstech.algomentor.AlgoMentorProperties;
import com.pstech.algomentor.gemini.AnswerGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AskController {

	private static final Logger log = LoggerFactory.getLogger(AskController.class);

	private final AnswerGenerator answers;

	private final int maxProblemChars;

	public AskController(AnswerGenerator answers, AlgoMentorProperties properties) {
		this.answers = answers;
		this.maxProblemChars = properties.maxProblemChars();
	}

	public record AskRequest(String problem, String mode) {
	}

	public record AskResponse(String result) {
	}

	@PostMapping("/ask")
	public AskResponse ask(@RequestBody AskRequest request) {
		String problem = request.problem() == null ? "" : request.problem().strip();
		if (problem.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Please paste a problem first.");
		}
		if (problem.length() > maxProblemChars) {
			throw new ApiException(HttpStatus.BAD_REQUEST,
					"Problem is too long (max %d characters).".formatted(maxProblemChars));
		}

		String answer;
		try {
			answer = answers.generate(Mode.from(request.mode()).prompt(problem));
		}
		catch (RuntimeException ex) {
			log.error("Gemini request failed", ex);
			throw new ApiException(HttpStatus.BAD_GATEWAY,
					"AlgoMentor couldn't get an answer right now. Please try again shortly.");
		}

		if (answer == null || answer.isBlank()) {
			throw new ApiException(HttpStatus.BAD_GATEWAY,
					"The model returned an empty answer. Try rephrasing the problem.");
		}
		return new AskResponse(answer);
	}

}
