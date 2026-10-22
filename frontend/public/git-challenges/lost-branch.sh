#!/usr/bin/env bash
# AlgoMentor Git challenge 7: recover a deleted branch.
# Makes a commit on feature/rescue, then deletes that branch locally. It never pushes or touches remotes.
CHALLENGE=rescue-branch
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

git switch -qc feature/rescue
printf 'Notes worth keeping.\n' > rescue.txt
git add rescue.txt
git commit -qm "Add rescue notes"
LOST="$(git rev-parse HEAD)"
git switch -q "$MAIN"
write_marker ",\"commitSha\":\"$LOST\""
git commit -qm "Set up the rescue-branch challenge"
git branch -qD feature/rescue

cat <<MSG
Set up: feature/rescue had a commit and has just been deleted.
Your turn:
  1. Find the lost commit (git reflog is a good place to look)
  2. Recreate feature/rescue pointing at it
  3. git push origin feature/rescue
  4. git push origin $MAIN             (so the challenge marker is on GitHub)
MSG
