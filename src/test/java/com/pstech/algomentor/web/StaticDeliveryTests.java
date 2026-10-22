package com.pstech.algomentor.web;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import static org.assertj.core.api.Assertions.assertThat;

/** Real HTTP (not MockMvc): compression and caching happen in the server, outside the controllers. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class StaticDeliveryTests {

	@LocalServerPort
	int port;

	final HttpClient http = HttpClient.newHttpClient();

	HttpResponse<byte[]> get(String path) throws Exception {
		return http.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
			.header("Accept-Encoding", "gzip")
			.build(), HttpResponse.BodyHandlers.ofByteArray());
	}

	@Test
	void compressesJavaScript() throws Exception {
		HttpResponse<byte[]> res = get("/assets/test-asset-abc123.js");
		assertThat(res.statusCode()).isEqualTo(200);
		assertThat(res.headers().firstValue("Content-Encoding")).hasValue("gzip");
	}

	@Test
	void cachesHashedAssetsForAYear() throws Exception {
		HttpResponse<byte[]> res = get("/assets/test-asset-abc123.js");
		assertThat(res.headers().firstValue("Cache-Control").orElse("")).contains("max-age=31536000").contains("immutable");
	}

	@Test
	void neverCachesTheHtmlShell() throws Exception {
		HttpResponse<byte[]> res = get("/app");
		assertThat(res.statusCode()).isEqualTo(200);
		assertThat(res.headers().firstValue("Cache-Control").orElse("")).contains("no-cache");
	}

}
