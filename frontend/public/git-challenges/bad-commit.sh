#!/usr/bin/env bash
# AlgoMentor Git challenge 6: revert a bad commit.
# Commits a change that breaks app.txt on your default branch. It never pushes or touches remotes.
CHALLENGE=revert
set -euo pipefail

fail() { echo "AlgoMentor: $1" >&2; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "run this inside your project's Git repository (your own clone)."
cd "$(git rev-parse --show-toplevel)"
git rev-parse --verify -q HEAD >/dev/null || fail "make a first commit before running this."
MAIN="$(git symbolic-ref --short -q HEAD)" || fail "you're on a detached HEAD. Check out your default branch first."
[ -z "$(git status --porcelain)" ] || fail "your working tree is not clean. Commit or stash your changes first."
[ ! -e ".algomentor/$CHALLENGE.json" ] || fail "this challenge is already set up here (.algomentor/$CHALLENGE.json exists)."
BASE="$(git rev-parse HEAD)"

# Records where the challenge started, so AlgoMentor can check your work once you push.
write_marker() { # write_marker '<extra json fields, each starting with a comma>'
  mkdir -p .algomentor
  printf '{"challenge":"%s","baseSha":"%s","createdAt":"%s"%s}\n' "$CHALLENGE" "$BASE" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${1:-}" > ".algomentor/$CHALLENGE.json"
  git add ".algomentor/$CHALLENGE.json"
}

printf 'status=ok\nversion=1\n' > app.txt
git add app.txt
git commit -qm "Add app status file"
printf 'status=BROKEN\nversion=1\n' > app.txt
git commit -qam "Break app.txt"
BAD="$(git rev-parse HEAD)"
write_marker ",\"commitSha\":\"$BAD\""
git commit -qm "Set up the revert challenge"

cat <<MSG
Set up: commit ${BAD:0:7} ("Break app.txt") broke app.txt on $MAIN.
Your turn:
  1. git log --oneline                 (find the bad commit)
  2. Undo it with a new commit, without rewriting history: git revert <sha>
  3. git push origin $MAIN
MSG
