export type Site = 'leetcode' | 'hackerrank' | 'gfg' | 'github'

export const SITE_NAMES: Record<Site, string> = { leetcode: 'LeetCode', hackerrank: 'HackerRank', gfg: 'GeeksforGeeks', github: 'GitHub' }

const USERNAME = /^[A-Za-z0-9_.-]{1,40}$/

// Host, accepted path shapes, and first path segments that are site sections rather than users.
const RULES: Record<Site, { host: RegExp; example: string; prefixes: string[]; reserved: string[] }> = {
  leetcode: {
    host: /^(www\.)?leetcode\.com$/,
    example: 'leetcode.com/u/yourname',
    prefixes: ['u'],
    reserved: ['problems', 'problemset', 'contest', 'discuss', 'explore', 'study-plan', 'studyplan', 'accounts', 'subscribe', 'assessment', 'interview', 'store', 'tag'],
  },
  hackerrank: {
    host: /^(www\.)?hackerrank\.com$/,
    example: 'hackerrank.com/profile/yourname',
    prefixes: ['profile'],
    reserved: ['domains', 'contests', 'challenges', 'dashboard', 'skills-verification', 'interview', 'certify', 'leaderboard', 'jobs', 'apply', 'auth', 'work', 'products'],
  },
  gfg: {
    host: /^(www\.|auth\.)?geeksforgeeks\.org$/,
    example: 'geeksforgeeks.org/user/yourname',
    prefixes: ['user', 'profile'],
    reserved: [],
  },
  github: {
    host: /^(www\.)?github\.com$/,
    example: 'github.com/yourname',
    prefixes: [],
    reserved: ['settings', 'orgs', 'organizations', 'about', 'features', 'pricing', 'marketplace', 'explore', 'topics', 'trending', 'login', 'join', 'sponsors', 'notifications', 'pulls', 'issues', 'search', 'enterprise', 'collections', 'events', 'new'],
  },
}

// GitHub usernames: letters, digits and single hyphens, not at either end.
const GITHUB_USER = /^[A-Za-z0-9](?:-?[A-Za-z0-9]){0,38}$/

/** Turns a pasted profile link into a username, or explains the format we expect. */
export function parseProfileUrl(site: Site, input: string): { username: string } | { error: string } {
  const rule = RULES[site]
  const fail = { error: `Use a link like ${rule.example}` }
  const text = input.trim()
  if (!text) return fail
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
  } catch {
    return fail
  }
  if (!rule.host.test(url.hostname.toLowerCase())) return fail
  const parts = url.pathname.split('/').filter(Boolean)
  if (site === 'github') {
    // github.com/<user> or any page under it, such as a repository.
    const user = parts[0]
    return user && !rule.reserved.includes(user.toLowerCase()) && GITHUB_USER.test(user) ? { username: user } : fail
  }
  let username: string | undefined
  if (parts.length >= 2 && rule.prefixes.includes(parts[0].toLowerCase())) username = parts[1]
  else if (parts.length === 1 && site !== 'gfg' && !rule.reserved.includes(parts[0].toLowerCase()) && !rule.prefixes.includes(parts[0].toLowerCase())) username = parts[0]
  return username && USERNAME.test(username) ? { username } : fail
}

// LinkedIn's custom profile URLs: 3 to 100 letters, digits or hyphens.
export const LINKEDIN_USER = /^[A-Za-z0-9-]{3,100}$/

/** A LinkedIn profile link (linkedin.com/in/<name>) or the bare name, as the name. LinkedIn profiles cannot be read, only linked to. */
export function parseLinkedIn(input: string): { username: string } | { error: string } {
  const fail = { error: 'Use a link like linkedin.com/in/yourname' }
  const text = input.trim()
  if (LINKEDIN_USER.test(text)) return { username: text }
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
  } catch {
    return fail
  }
  if (!/^([a-z]{2,3}\.|www\.)?linkedin\.com$/.test(url.hostname.toLowerCase())) return fail
  const parts = url.pathname.split('/').filter(Boolean)
  return parts[0] === 'in' && parts[1] && LINKEDIN_USER.test(parts[1]) ? { username: parts[1] } : fail
}

export { GITHUB_USER }
