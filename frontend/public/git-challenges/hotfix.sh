#!/usr/bin/env bash
# AlgoMentor Git challenge 8: cherry-pick a hotfix.
# Puts a typo fix on hotfix/fix-typo next to an unfinished change. It never pushes or touches remotes.
CHALLENGE=cherry-pick
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

printf 'Welcom to the library!\n' > welcome.txt
git add welcome.txt
git commit -qm "Add welcome message"

git switch -qc hotfix/fix-typo
printf 'Welcome to the library!\n' > welcome.txt
git commit -qam "Fix typo in welcome message"
FIX="$(git rev-parse HEAD)"
printf 'Experimental banner, not ready yet\n' > banner.txt
git add banner.txt
git commit -qm "Add experimental banner"

git switch -q "$MAIN"
write_marker ",\"commitSha\":\"$FIX\",\"subject\":\"Fix typo in welcome message\",\"file\":\"welcome.txt\""
git commit -qm "Set up the cherry-pick challenge"

cat <<MSG
Set up: hotfix/fix-typo has the fix (${FIX:0:7}) and an unfinished banner you don't want on $MAIN.
Your turn:
  1. Bring only the typo fix to $MAIN (git cherry-pick), not the whole branch
  2. git push origin $MAIN
MSG
