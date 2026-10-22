export type TrackId = 'oop' | 'cn' | 'dbms' | 'os'

export type QuizQuestion = { id: string; prompt: string; options: string[]; answer: number; why: string }

export type Lesson = {
  id: string
  title: string
  minutes: number
  /** A short, concrete reason to care, shown first. Inline markdown. */
  hook?: string
  /** Three or four things to take away, shown beside the hook. Inline markdown. */
  keyPoints?: string[]
  /**
   * Markdown, rendered through the app's sanitising renderer. Blockquotes that start with
   * [!KEY], [!GOTCHA], [!INTERVIEW], [!TRY] or [!STORY] become callouts beside their section.
   */
  body: string
  /** Key into the diagram registry (components/learn/diagrams). */
  diagram?: string
  code?: { java: string; python: string; cpp: string }
  quiz: QuizQuestion[]
  interview: { q: string; a: string }[]
}

export type Track = { id: TrackId; title: string; short: string; summary: string; modules: Lesson[]; projects: string[] }

export type ChallengeId = 'first-commit' | 'meaningful-commits' | 'feature-pr' | 'merge-conflict' | 'squash' | 'revert' | 'rescue-branch' | 'cherry-pick' | 'release' | 'remove-secret'

export const CHALLENGE_IDS: readonly ChallengeId[] = ['first-commit', 'meaningful-commits', 'feature-pr', 'merge-conflict', 'squash', 'revert', 'rescue-branch', 'cherry-pick', 'release', 'remove-secret']

export const CHALLENGE_TITLES: Record<ChallengeId, string> = {
  'first-commit': 'First commit and push',
  'meaningful-commits': 'Meaningful commits',
  'feature-pr': 'Feature branch and pull request',
  'merge-conflict': 'Resolve a merge conflict',
  squash: 'Squash with interactive rebase',
  revert: 'Revert a bad commit',
  'rescue-branch': 'Recover a deleted branch',
  'cherry-pick': 'Cherry-pick a hotfix',
  release: 'Tag a release',
  'remove-secret': 'Remove a committed secret',
}

export type Project = {
  id: string
  track: TrackId
  level: 'beginner' | 'intermediate' | 'advanced'
  title: string
  goal: string
  proves: string[]
  requirements: string[]
  stretch: string[]
  /** Suggested, not required: any language works. */
  stack: string
  acceptance: string[]
  /** Git challenges this project's repository should show, checked against the learner's public repo. */
  gitMilestones: ChallengeId[]
}
