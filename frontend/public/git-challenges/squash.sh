#!/usr/bin/env bash
# AlgoMentor Git challenge 5: squash with an interactive rebase.
# Creates feature/squash with four work-in-progress commits. It never pushes or touches remotes.
CHALLENGE=squash
FILES="squash.txt"
BRANCHES="feature/squash"
set -euo pipefail

fail() { echo "AlgoMentor: $1" >&2; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "run this inside your project's Git repository (your own clone)."
cd "$(git rev-parse --show-toplevel)"
git rev-parse --verify -q HEAD >/dev/null || fail "make a first commit before running this."
MAIN="$(git symbolic-ref --short -q HEAD)" || fail "you're on a detached HEAD. Check out your default branch first."
[ -z "$(git status --porcelain)" ] || fail "your working tree is not clean. Commit or stash your changes first."
[ ! -e ".algomentor/$CHALLENGE.json" ] || fail "this challenge is already set up here (.algomentor/$CHALLENGE.json exists)."
# Never overwrite the learner's own files or branches: stop before anything is changed.
for f in $FILES; do [ ! -e "$f" ] || fail "$f already exists here, and this script would overwrite it. Run it in a scratch clone instead."; done
for b in $BRANCHES; do git show-ref --verify --quiet "refs/heads/$b" && fail "the branch $b already exists here. Rename it or run this in a scratch clone." || true; done
BASE="$(git rev-parse HEAD)"

# Records where the challenge started, so AlgoMentor can check your work once you push.
write_marker() { # write_marker '<extra json fields, each starting with a comma>'
  mkdir -p .algomentor
  printf '{"challenge":"%s","baseSha":"%s","createdAt":"%s"%s}\n' "$CHALLENGE" "$BASE" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${1:-}" > ".algomentor/$CHALLENGE.json"
  git add ".algomentor/$CHALLENGE.json"
}

write_marker ''
git commit -qm "Set up the squash challenge"

git switch -qc feature/squash
for i in 1 2 3 4; do
  echo "Squash feature step $i" >> squash.txt
  git add squash.txt
  git commit -qm "wip $i"
done
git switch -q "$MAIN"

cat <<MSG
Set up: feature/squash has 4 "wip" commits.
Your turn:
  1. git switch feature/squash
  2. git rebase -i $MAIN               (keep the first "pick", change the other three to "squash")
  3. Make the single commit's message exactly: Add squash feature
  4. git push origin feature/squash    (don't merge it)
  5. git switch $MAIN && git push origin $MAIN   (so the challenge marker is on GitHub)
MSG
