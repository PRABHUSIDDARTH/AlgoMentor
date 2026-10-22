package com.pstech.algomentor.contributions;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * Contributions in one JSON file, rewritten atomically on every change. That is enough for a review queue of a few
 * hundred entries on one instance; swap it for a database before running several instances.
 */
public class ContributionStore {

	/** A full queue means review has fallen behind, so new submissions wait instead of piling up. */
	static final int MAX_PENDING = 500;

	private final Path file;

	private final List<Contribution> items = new ArrayList<>();

	public ContributionStore(String path) {
		this.file = Path.of(path);
		load();
	}

	private void load() {
		if (!Files.exists(file)) {
			return;
		}
		try {
			items.addAll(JsonMapper.shared().readValue(Files.readString(file), new TypeReference<List<Contribution>>() {
			}));
		}
		catch (IOException ex) {
			throw new UncheckedIOException("Could not read " + file, ex);
		}
	}

	private void save() {
		try {
			Path parent = file.toAbsolutePath().getParent();
			Files.createDirectories(parent);
			Path tmp = Files.createTempFile(parent, "contributions", ".tmp");
			Files.writeString(tmp, JsonMapper.shared().writeValueAsString(items));
			Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
		}
		catch (IOException ex) {
			throw new UncheckedIOException("Could not write " + file, ex);
		}
	}

	public synchronized void add(Contribution c) {
		items.add(c);
		save();
	}

	public synchronized List<Contribution> pending() {
		return items.stream().filter((c) -> c.status() == Contribution.Status.PENDING).sorted(Comparator.comparing(Contribution::submittedAt)).toList();
	}

	public synchronized List<Contribution> approved() {
		return items.stream().filter((c) -> c.status() == Contribution.Status.APPROVED).sorted(Comparator.comparing(Contribution::decidedAt).reversed()).toList();
	}

	public synchronized Optional<Contribution> decide(String id, Contribution.Status status, java.time.Instant at) {
		for (int i = 0; i < items.size(); i++) {
			if (items.get(i).id().equals(id)) {
				Contribution next = items.get(i).withStatus(status, at);
				items.set(i, next);
				save();
				return Optional.of(next);
			}
		}
		return Optional.empty();
	}

	/** For tests. */
	public synchronized void clear() {
		items.clear();
		save();
	}

}
