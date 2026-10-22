#!/usr/bin/env bash
# AlgoMentor Git challenge 4: resolve a merge conflict.
# Creates two branches that change the same line of conflict.txt. It never pushes or touches remotes.
CHALLENGE=merge-conflict
FILES="conflict.txt"
BRANCHES="conflict/theirs"
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

printf 'Welcome to the library.\nOpening hours: 9 to 5.\n' > conflict.txt
write_marker ',"file":"conflict.txt"'
git add conflict.txt
git commit -qm "Add opening hours notice"

git switch -qc conflict/theirs
printf 'Welcome to the library.\nOpening hours: 10 to 6 on weekdays.\n' > conflict.txt
git commit -qam "Extend weekday opening hours"

git switch -q "$MAIN"
printf 'Welcome to the library.\nOpening hours: 8 to 4, closed on Sundays.\n' > conflict.txt
git commit -qam "Open earlier and close on Sundays"

cat <<MSG
Set up: $MAIN and conflict/theirs both changed line 2 of conflict.txt.
Your turn:
  1. git merge conflict/theirs        (it will stop with a conflict)
  2. Edit conflict.txt so it reads the way you want, removing the <<<<<<< ======= >>>>>>> lines
  3. git add conflict.txt && git commit
  4. git push origin $MAIN
MSG
