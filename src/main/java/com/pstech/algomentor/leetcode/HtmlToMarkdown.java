package com.pstech.algomentor.leetcode;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.nodes.TextNode;

/**
 * Converts LeetCode's problem HTML into plain Markdown that reads well in the text box and in
 * the prompt. Only the handful of tags LeetCode uses are handled; anything else keeps its text.
 */
final class HtmlToMarkdown {

	private HtmlToMarkdown() {
	}

	static String convert(String html) {
		StringBuilder out = new StringBuilder();
		children(Jsoup.parseBodyFragment(html).body(), out, false);
		return out.toString()
			.replace('\u00a0', ' ')
			.replaceAll("[ \\t]+\\n", "\n")
			.replaceAll("\\n{3,}", "\n\n")
			.strip();
	}

	/**
	 * @param raw inside {@code <pre>} or {@code <code>}: keep whitespace as-is and add no
	 * Markdown emphasis, since it wouldn't render there
	 */
	private static void append(Node node, StringBuilder out, boolean raw) {
		if (node instanceof TextNode text) {
			if (raw) {
				out.append(text.getWholeText());
			}
			else if (!(text.isBlank() && isBlockContainer(node.parent()))) {
				// Blank text between block elements is just source formatting.
				out.append(text.text());
			}
			return;
		}
		if (!(node instanceof Element el)) {
			return;
		}
		switch (el.tagName()) {
			case "pre" -> {
				StringBuilder inner = new StringBuilder();
				children(el, inner, true);
				out.append("\n```\n").append(inner.toString().strip()).append("\n```\n\n");
			}
			case "code" -> {
				if (raw) {
					children(el, out, true);
				}
				else {
					out.append('`');
					children(el, out, true);
					out.append('`');
				}
			}
			case "strong", "b" -> wrap(el, out, raw ? "" : "**", raw);
			case "em", "i" -> wrap(el, out, raw ? "" : "*", raw);
			case "sup" -> {
				out.append('^');
				children(el, out, raw);
			}
			case "sub" -> {
				out.append('_');
				children(el, out, raw);
			}
			case "br" -> out.append('\n');
			case "li" -> {
				out.append("- ");
				children(el, out, raw);
				out.append('\n');
			}
			case "p", "div", "ul", "ol" -> {
				children(el, out, raw);
				out.append("\n\n");
			}
			case "img" -> out.append("[image]");
			default -> children(el, out, raw);
		}
	}

	private static boolean isBlockContainer(Node node) {
		return node instanceof Element el
				&& switch (el.tagName()) {
					case "body", "div", "ul", "ol" -> true;
					default -> false;
				};
	}

	private static void wrap(Element el, StringBuilder out, String marker, boolean raw) {
		StringBuilder inner = new StringBuilder();
		children(el, inner, raw);
		String text = inner.toString();
		if (text.isBlank() || marker.isEmpty()) {
			out.append(text);
		}
		else {
			out.append(marker).append(text.strip()).append(marker);
			if (Character.isWhitespace(text.charAt(text.length() - 1))) {
				out.append(' ');
			}
		}
	}

	private static void children(Element el, StringBuilder out, boolean raw) {
		for (Node child : el.childNodes()) {
			append(child, out, raw);
		}
	}

}
