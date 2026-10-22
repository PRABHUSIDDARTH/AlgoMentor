import { CHALLENGE_TITLES, type ChallengeId } from './types'

export type GitChallenge = {
  id: ChallengeId
  order: number
  title: string
  brief: string
  steps: string[]
  /** Name of the setup script in /git-challenges (without extension); absent when no setup is needed. */
  script?: string
  cheatSheet: { command: string; what: string }[]
  docs: { label: string; url: string }[]
  /** Exactly what the check looks for on GitHub. */
  passesWhen: string
}

const BOOK = 'https://git-scm.com/book/en/v2'

type Entry = Omit<GitChallenge, 'title'>

const ENTRIES: Entry[] = [
  {
    id: 'first-commit',
    order: 1,
    brief: 'Every repository starts with one commit and a README. Create a project folder, make that first commit, and push it to a new public repository on GitHub. This is the base for everything else in the Learn hub.',
    steps: [
      'Create a new public repository on GitHub (no files yet), or reuse one for a project you are building.',
      'On your machine, run git init in your project folder and create a README.md that says what the project is.',
      'Stage and commit: git add README.md, then git commit with a message that says what you added.',
      'Connect the remote and push your default branch.',
      'Make sure your commits use the email address on your GitHub account so GitHub links them to you.',
    ],
    cheatSheet: [
      { command: 'git init', what: 'Start a repository in the current folder.' },
      { command: 'git add README.md', what: 'Stage a file for the next commit.' },
      { command: 'git commit -m "Add project README"', what: 'Record the staged changes with a message.' },
      { command: 'git remote add origin <url>', what: 'Tell Git where the GitHub repository lives.' },
      { command: 'git push -u origin main', what: 'Upload the branch and remember it for next time.' },
      { command: 'git config user.email', what: 'Show the email your commits will use.' },
    ],
    docs: [
      { label: 'git commit', url: 'https://git-scm.com/docs/git-commit' },
      { label: 'git push', url: 'https://git-scm.com/docs/git-push' },
      { label: 'Getting a Git repository', url: `${BOOK}/Git-Basics-Getting-a-Git-Repository` },
    ],
    passesWhen: 'The repository is public, has a README, and has at least one commit on its default branch that GitHub links to your account.',
  },
  {
    id: 'meaningful-commits',
    order: 2,
    brief: 'A commit message is a note to the next person, and that person is often you in three months. Make at least five commits whose messages say what changed, in the imperative mood ("Add due dates to loans", not "updated stuff").',
    steps: [
      'Work in small steps, and commit each one on its own instead of one giant commit at the end.',
      'Write the subject line in the imperative: Add, Fix, Remove, Rename, Extract.',
      'Keep the subject between 10 and 72 characters. Put longer explanation in the body, after a blank line.',
      'Avoid messages like "update", "fix", "wip" or "changes": they say nothing.',
      'Push your branch when you have five good commits.',
    ],
    cheatSheet: [
      { command: 'git commit -m "Add late fee calculation"', what: 'Commit with a one-line message.' },
      { command: 'git commit', what: 'Open your editor to write a subject and a longer body.' },
      { command: 'git log --oneline', what: 'Review your messages in a compact list.' },
      { command: 'git commit --amend', what: 'Rewrite the last commit message (before you push it).' },
      { command: 'git add -p', what: 'Choose which pieces of your changes go into this commit.' },
    ],
    docs: [
      { label: 'git commit', url: 'https://git-scm.com/docs/git-commit' },
      { label: 'Distributed Git: contributing', url: `${BOOK}/Distributed-Git-Contributing-to-a-Project` },
    ],
    passesWhen: 'At least five commits on your default branch have subjects of 10 to 72 characters, in the imperative, and not only filler such as "update", "fix" or "wip". Merge commits do not count.',
  },
  {
    id: 'feature-pr',
    order: 3,
    brief: 'Real projects change through branches and pull requests, not by committing straight to the main branch. Make a change on a feature branch, open a pull request on GitHub, and merge it.',
    steps: [
      'Create a branch for one small feature: git switch -c feature/search.',
      'Make a commit or two on that branch and push it.',
      'On GitHub, open a pull request from your branch into the default branch, and describe what it changes.',
      'Review your own diff on the pull request page, then merge it.',
      'Pull the default branch locally so your machine matches GitHub.',
    ],
    cheatSheet: [
      { command: 'git switch -c feature/search', what: 'Create a branch and switch to it.' },
      { command: 'git push -u origin feature/search', what: 'Publish the branch to GitHub.' },
      { command: 'git switch main', what: 'Go back to the default branch.' },
      { command: 'git pull', what: 'Fetch and apply the latest changes from GitHub.' },
      { command: 'git branch --merged', what: 'List branches already merged into the current one.' },
    ],
    docs: [
      { label: 'git branch', url: 'https://git-scm.com/docs/git-branch' },
      { label: 'Basic branching and merging', url: `${BOOK}/Git-Branching-Basic-Branching-and-Merging` },
    ],
    passesWhen: 'The repository has at least one merged pull request whose branch was not the default branch.',
  },
  {
    id: 'merge-conflict',
    order: 4,
    script: 'conflict',
    brief: 'A merge conflict is Git saying "two people changed the same lines and I cannot decide". The setup script puts your repository in exactly that situation. Merge, read the markers, decide what the file should say, and finish the merge.',
    steps: [
      'Run the setup script in your own clone (see the box below). It creates conflict.txt and two branches that both change line 2.',
      'Run git merge conflict/theirs. Git stops and reports a conflict in conflict.txt.',
      'Open conflict.txt. Between <<<<<<< and >>>>>>> are both versions. Edit the file to what it should say, and delete all three marker lines.',
      'Stage the file and commit to finish the merge.',
      'Push your default branch.',
    ],
    cheatSheet: [
      { command: 'git merge conflict/theirs', what: 'Merge the other branch into the current one.' },
      { command: 'git status', what: 'See which files are in conflict.' },
      { command: 'git diff', what: 'Show the conflicting lines.' },
      { command: 'git add conflict.txt', what: 'Mark the conflict as resolved once you have edited the file.' },
      { command: 'git commit', what: 'Finish the merge with a merge commit.' },
      { command: 'git merge --abort', what: 'Give up and return to before the merge.' },
    ],
    docs: [
      { label: 'git merge', url: 'https://git-scm.com/docs/git-merge' },
      { label: 'Basic merge conflicts', url: `${BOOK}/Git-Branching-Basic-Branching-and-Merging#_basic_merge_conflicts` },
    ],
    passesWhen: 'Your default branch has a merge commit (two parents) that touches conflict.txt, and conflict.txt no longer contains conflict markers.',
  },
  {
    id: 'squash',
    order: 5,
    script: 'squash',
    brief: 'Work-in-progress commits are fine while you work, but nobody wants "wip 1, wip 2, wip 3, wip 4" in the history. An interactive rebase lets you combine them into one clean commit. The setup script creates a branch with four wip commits.',
    steps: [
      'Run the setup script in your own clone. It creates feature/squash with four "wip" commits.',
      'Switch to feature/squash and start an interactive rebase onto your default branch.',
      'In the editor, keep the first line as pick and change the other three from pick to squash (or s).',
      'When Git asks for the message, write exactly: Add squash feature.',
      'Push feature/squash. If Git refuses because history changed, use --force-with-lease. Do not merge it.',
    ],
    cheatSheet: [
      { command: 'git switch feature/squash', what: 'Move to the branch with the wip commits.' },
      { command: 'git rebase -i main', what: 'Rewrite the branch\'s commits interactively.' },
      { command: 'git rebase --abort', what: 'Cancel the rebase and return to before it.' },
      { command: 'git log --oneline main..feature/squash', what: 'List the commits the branch has beyond main.' },
      { command: 'git push --force-with-lease origin feature/squash', what: 'Push rewritten history, but only if nobody else pushed meanwhile.' },
    ],
    docs: [
      { label: 'git rebase', url: 'https://git-scm.com/docs/git-rebase' },
      { label: 'Rewriting history: squashing commits', url: `${BOOK}/Git-Tools-Rewriting-History` },
    ],
    passesWhen: 'The branch feature/squash is on GitHub and has exactly one commit on top of your default branch, with the message Add squash feature.',
  },
  {
    id: 'revert',
    order: 6,
    script: 'bad-commit',
    brief: 'Sometimes a bad change is already pushed and shared. You do not rewrite shared history; you add a new commit that undoes the old one. The setup script commits a change that breaks app.txt.',
    steps: [
      'Run the setup script in your own clone. It adds a commit called "Break app.txt" to your default branch.',
      'Find that commit with git log and note its hash.',
      'Undo it with git revert and the hash. Accept the suggested message.',
      'Check that app.txt says status=ok again.',
      'Push your default branch.',
    ],
    cheatSheet: [
      { command: 'git log --oneline', what: 'Find the commit to undo.' },
      { command: 'git show <hash>', what: 'See exactly what a commit changed.' },
      { command: 'git revert <hash>', what: 'Create a new commit that undoes that commit.' },
      { command: 'git revert --no-edit <hash>', what: 'Same, accepting the default message.' },
      { command: 'git revert --abort', what: 'Cancel a revert that hit a conflict.' },
    ],
    docs: [
      { label: 'git revert', url: 'https://git-scm.com/docs/git-revert' },
      { label: 'Undoing things', url: `${BOOK}/Git-Basics-Undoing-Things` },
    ],
    passesWhen: 'Your default branch has a commit whose message starts with "Revert" and contains "This reverts commit" followed by the hash of the exact commit the script made.',
  },
  {
    id: 'rescue-branch',
    order: 7,
    script: 'lost-branch',
    brief: 'You deleted a branch and then realised it had work on it. Git rarely loses commits straight away: the reflog remembers where your branches pointed. The setup script makes a commit on feature/rescue and then deletes that branch.',
    steps: [
      'Run the setup script in your own clone. It deletes the local branch feature/rescue.',
      'Look at git reflog and find the entry for "Add rescue notes".',
      'Recreate the branch at that commit, named feature/rescue.',
      'Push feature/rescue to GitHub, and push your default branch too, so the challenge marker is there.',
    ],
    cheatSheet: [
      { command: 'git reflog', what: 'List where HEAD has been recently, including deleted branches\' commits.' },
      { command: 'git branch feature/rescue <hash>', what: 'Create a branch pointing at a specific commit.' },
      { command: 'git switch -c feature/rescue <hash>', what: 'Create it and switch to it in one step.' },
      { command: 'git branch --list', what: 'Check the branch exists again.' },
      { command: 'git push -u origin feature/rescue', what: 'Publish the recovered branch.' },
    ],
    docs: [
      { label: 'git reflog', url: 'https://git-scm.com/docs/git-reflog' },
      { label: 'Maintenance and data recovery', url: `${BOOK}/Git-Internals-Maintenance-and-Data-Recovery` },
    ],
    passesWhen: 'The branch feature/rescue exists on GitHub and contains the commit "Add rescue notes" that the script made.',
  },
  {
    id: 'cherry-pick',
    order: 8,
    script: 'hotfix',
    brief: 'A branch has one commit you urgently need and another that is not ready. Merging the whole branch would ship the unfinished work, so you copy just the fix with cherry-pick. The setup script creates hotfix/fix-typo with a typo fix followed by an unfinished banner.',
    steps: [
      'Run the setup script in your own clone. It creates hotfix/fix-typo with two commits.',
      'Look at the branch with git log and find the commit called "Fix typo in welcome message".',
      'Switch to your default branch and cherry-pick only that commit.',
      'Check that welcome.txt is fixed and banner.txt does not exist on your default branch.',
      'Push your default branch.',
    ],
    cheatSheet: [
      { command: 'git log --oneline hotfix/fix-typo', what: 'List the commits on the hotfix branch.' },
      { command: 'git switch main', what: 'Go to the branch that needs the fix.' },
      { command: 'git cherry-pick <hash>', what: 'Copy one commit onto the current branch as a new commit.' },
      { command: 'git cherry-pick --abort', what: 'Cancel a cherry-pick that hit a conflict.' },
      { command: 'git show --stat HEAD', what: 'Check which files the new commit changed.' },
    ],
    docs: [
      { label: 'git cherry-pick', url: 'https://git-scm.com/docs/git-cherry-pick' },
      { label: 'Rebasing and cherry-picking', url: `${BOOK}/Git-Branching-Rebasing` },
    ],
    passesWhen: 'Your default branch has a new commit titled Fix typo in welcome message that changes welcome.txt, and the original hotfix commit itself was not merged into it.',
  },
  {
    id: 'release',
    order: 9,
    brief: 'A release is a named, permanent point in history. Tag the commit that you consider version 1.0.0 with an annotated tag, push the tag, and publish a GitHub Release for it.',
    steps: [
      'Decide which commit is your first release, usually the tip of the default branch.',
      'Create an annotated tag named v1.0.0 with a message (an annotated tag stores who made it and when).',
      'Push the tag: tags are not pushed by a normal git push.',
      'On GitHub, open Releases, choose the tag, and publish a release with a short description of what is in it.',
    ],
    cheatSheet: [
      { command: 'git tag -a v1.0.0 -m "First release"', what: 'Create an annotated tag on the current commit.' },
      { command: 'git push origin v1.0.0', what: 'Publish the tag to GitHub.' },
      { command: 'git tag --list', what: 'See your tags.' },
      { command: 'git show v1.0.0', what: 'View the tag message and the commit it points to.' },
      { command: 'git tag -d v1.0.0', what: 'Delete a local tag (if you tagged the wrong commit).' },
    ],
    docs: [
      { label: 'git tag', url: 'https://git-scm.com/docs/git-tag' },
      { label: 'Tagging', url: `${BOOK}/Git-Basics-Tagging` },
    ],
    passesWhen: 'The repository has an annotated tag named v1.0.0 (or a later semantic version) and a published GitHub Release for a version tag.',
  },
  {
    id: 'remove-secret',
    order: 10,
    script: 'secret',
    brief: 'You committed a key by mistake. Deleting the file in a new commit is not enough: it is still in history for anyone who clones. You must rewrite history to remove it, add it to .gitignore, and, in real life, revoke the key. The setup script commits a fake key file.',
    steps: [
      'Run the setup script in your own clone. It commits config/secret.key (a fake key) to your default branch.',
      'Remove that file from every commit in history, for example with git filter-branch or the separate git filter-repo tool.',
      'If you used git filter-repo, it removes the origin remote on purpose. Add it back with git remote add origin <url>, using the URL that git remote -v showed before you started.',
      'Add config/secret.key (or *.key) to .gitignore and commit it.',
      'Force-push the rewritten history to GitHub with --force-with-lease.',
      'Remember: anything that was pushed must be treated as leaked. Rewriting history is cleanup, not a substitute for revoking a real key.',
    ],
    cheatSheet: [
      { command: 'git log --all -- config/secret.key', what: 'Find every commit that touched the file.' },
      { command: "git filter-branch --index-filter 'git rm -q --cached --ignore-unmatch config/secret.key' -- --all", what: 'Remove the file from all commits on all branches.' },
      { command: 'git check-ignore -v config/secret.key', what: 'Confirm .gitignore now covers the file.' },
      { command: 'git push --force-with-lease origin main', what: 'Replace the history on GitHub with your rewritten history.' },
      { command: 'git reflog expire --expire=now --all', what: 'Forget the old commits locally.' },
    ],
    docs: [
      { label: 'gitignore', url: 'https://git-scm.com/docs/gitignore' },
      { label: 'git filter-branch', url: 'https://git-scm.com/docs/git-filter-branch' },
      { label: 'Rewriting history', url: `${BOOK}/Git-Tools-Rewriting-History` },
    ],
    passesWhen: 'No commit reachable from any branch on GitHub contains config/secret.key, and .gitignore on your default branch covers config/secret.key.',
  },
]

export const GIT_CHALLENGES: GitChallenge[] = ENTRIES.map((e) => ({ ...e, title: CHALLENGE_TITLES[e.id] }))

export const GIT_CHALLENGE_BY_ID = new Map(GIT_CHALLENGES.map((c) => [c.id, c]))
