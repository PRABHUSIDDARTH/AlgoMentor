#!/usr/bin/env bash
# AlgoMentor Git challenge 10: remove a committed secret.
# Commits a FAKE key file to your default branch. It never pushes or touches remotes.
CHALLENGE=remove-secret
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

mkdir -p config
printf 'ALGOMENTOR-FAKE-KEY-%s\n' "$(date +%s)" > config/secret.key
printf 'service=library\n' > config/app.properties
git add config
git commit -qm "Add service configuration"
write_marker ',"file":"config/secret.key"'
git commit -qm "Set up the remove-secret challenge"

cat <<MSG
Set up: config/secret.key (a fake key) is now in $MAIN's history.
Your turn:
  1. Remove config/secret.key from every commit (git filter-repo, or git rebase -i and amend)
  2. Add it to .gitignore so it can't come back
  3. Push the rewritten history: git push --force-with-lease origin $MAIN
In real life, a leaked key must also be revoked: rewriting history doesn't un-leak it.
MSG
