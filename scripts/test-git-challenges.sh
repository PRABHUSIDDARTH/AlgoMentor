#!/usr/bin/env bash
# Runs every Git challenge setup script in a throwaway repository and checks the broken state it leaves.
# Usage: scripts/test-git-challenges.sh   (also runs the PowerShell versions when pwsh is installed)
set -uo pipefail
DIR="$(cd "$(dirname "$0")/../frontend/public/git-challenges" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
export GIT_AUTHOR_NAME=Test GIT_AUTHOR_EMAIL=test@example.com GIT_COMMITTER_NAME=Test GIT_COMMITTER_EMAIL=test@example.com
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
fails=0
pass() { echo "  ok   $1"; }
fail() { echo "  FAIL $1"; fails=$((fails + 1)); }
check() { if eval "$2" >/dev/null 2>&1; then pass "$1"; else fail "$1"; fi; }

# A fresh repo with one commit on main, like a learner's project clone.
fresh() {
  local d="$TMP/$1"
  rm -rf "$d" && mkdir -p "$d" && cd "$d" || exit 1
  git init -q -b main && echo "# Library" > README.md && git add README.md && git commit -qm "Add README"
  git init -q --bare "$d.origin.git" && git remote add origin "$d.origin.git"
  CFG="$(md5sum < .git/config)"
}

# The script must not push, add remotes or change Git config.
untouched() {
  [ -z "$(git --git-dir="$PWD.origin.git" for-each-ref)" ] && [ "$(md5sum < .git/config)" = "$CFG" ]
}

# run <runner> <script-name>: runner is "bash" or "pwsh".
run() {
  if [ "$1" = bash ]; then bash "$DIR/$2.sh"; else pwsh -NoProfile -File "$DIR/$2.ps1"; fi
}

marker_ok() { # marker_ok <challenge-id>
  python3 -c "import json,sys; m=json.load(open('.algomentor/$1.json')); assert m['challenge']=='$1' and len(m['baseSha'])==40 and m['createdAt']" \
    && git cat-file -e "HEAD:.algomentor/$1.json"
}

suite() {
  local r=$1
  echo "== $r"

  fresh "$r-conflict"; run "$r" conflict >/dev/null
  check "$r conflict: nothing pushed, config unchanged" untouched
  check "$r conflict: marker" "marker_ok merge-conflict"
  check "$r conflict: on main, clean" "[ \"\$(git branch --show-current)\" = main ] && [ -z \"\$(git status --porcelain)\" ]"
  check "$r conflict: merge conflicts" "! git merge -q conflict/theirs && git diff --name-only --diff-filter=U | grep -qx conflict.txt"
  git merge --abort >/dev/null 2>&1

  fresh "$r-squash"; run "$r" squash >/dev/null
  check "$r squash: nothing pushed, config unchanged" untouched
  check "$r squash: marker" "marker_ok squash"
  check "$r squash: 4 commits on feature/squash" "[ \"\$(git rev-list --count main..feature/squash)\" = 4 ]"

  fresh "$r-bad"; run "$r" bad-commit >/dev/null
  check "$r bad-commit: nothing pushed, config unchanged" untouched
  check "$r bad-commit: marker" "marker_ok revert"
  sha=$(python3 -c "import json; print(json.load(open('.algomentor/revert.json'))['commitSha'])")
  check "$r bad-commit: bad commit on main" "git merge-base --is-ancestor $sha main && git show $sha -- app.txt | grep -q BROKEN"
  check "$r bad-commit: revertable" "git revert --no-edit $sha && ! grep -q BROKEN app.txt"

  fresh "$r-lost"; run "$r" lost-branch >/dev/null
  check "$r lost-branch: nothing pushed, config unchanged" untouched
  check "$r lost-branch: marker" "marker_ok rescue-branch"
  sha=$(python3 -c "import json; print(json.load(open('.algomentor/rescue-branch.json'))['commitSha'])")
  check "$r lost-branch: branch deleted" "! git rev-parse --verify -q refs/heads/feature/rescue"
  check "$r lost-branch: commit in reflog" "git reflog --format=%H | grep -qx $sha"

  fresh "$r-hotfix"; run "$r" hotfix >/dev/null
  check "$r hotfix: nothing pushed, config unchanged" untouched
  check "$r hotfix: marker" "marker_ok cherry-pick"
  sha=$(python3 -c "import json; print(json.load(open('.algomentor/cherry-pick.json'))['commitSha'])")
  check "$r hotfix: fix not on main" "! git merge-base --is-ancestor $sha main && git merge-base --is-ancestor $sha hotfix/fix-typo"
  check "$r hotfix: marker names subject and file" "grep -q '\"subject\":\"Fix typo in welcome message\"' .algomentor/cherry-pick.json && grep -q '\"file\":\"welcome.txt\"' .algomentor/cherry-pick.json"
  check "$r hotfix: cherry-pick applies" "git cherry-pick $sha && grep -q 'Welcome to' welcome.txt"

  fresh "$r-secret"; run "$r" secret >/dev/null
  check "$r secret: nothing pushed, config unchanged" untouched
  check "$r secret: marker" "marker_ok remove-secret"
  check "$r secret: key in history" "[ -n \"\$(git log --all --format=%H -- config/secret.key)\" ]"

  # Guards
  mkdir -p "$TMP/$r-outside" && cd "$TMP/$r-outside"
  check "$r refusesOutsideRepo" "! run $r squash && [ ! -d .algomentor ]"
  out=$(run "$r" squash 2>&1); check "$r refusesOutsideRepo says why" "echo \"\$out\" | grep -qi 'git repository'"

  fresh "$r-dirty"; echo change >> README.md
  check "$r refusesDirtyTree" "! run $r squash && [ ! -d .algomentor ]"
  out=$(run "$r" squash 2>&1); check "$r refusesDirtyTree says why" "echo \"\$out\" | grep -qi 'not clean'"

  fresh "$r-twice"; run "$r" squash >/dev/null; before=$(git rev-parse HEAD)
  check "$r refusesSecondRun" "! run $r squash && [ \"\$(git rev-parse HEAD)\" = $before ]"
  out=$(run "$r" squash 2>&1); check "$r refusesSecondRun says why" "echo \"\$out\" | grep -qi 'already set up'"

  fresh "$r-detached"; git checkout -q --detach
  check "$r refusesDetachedHead" "! run $r squash && [ ! -d .algomentor ]"
}

for s in conflict squash bad-commit lost-branch hotfix secret; do
  for ext in sh ps1; do [ -f "$DIR/$s.$ext" ] || fail "missing $s.$ext"; done
done

[ -d "$DIR" ] && suite bash
if command -v pwsh >/dev/null; then suite pwsh; else echo "== pwsh not installed: PowerShell scripts not run here (CI runs them)"; fi

echo
if [ $fails -eq 0 ]; then echo "git challenge scripts: all checks passed"; else echo "git challenge scripts: $fails failed"; exit 1; fi
