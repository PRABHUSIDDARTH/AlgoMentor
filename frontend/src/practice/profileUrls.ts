export type Site = 'leetcode' | 'hackerrank' | 'gfg'

export const SITE_NAMES: Record<Site, string> = { leetcode: 'LeetCode', hackerrank: 'HackerRank', gfg: 'GeeksforGeeks' }

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
    host: /^(www\.)?geeksforgeeks\.org$/,
    example: 'geeksforgeeks.org/user/yourname',
    prefixes: ['user', 'profile'],
    reserved: [],
  },
}

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
  let username: string | undefined
  if (parts.length >= 2 && rule.prefixes.includes(parts[0].toLowerCase())) username = parts[1]
  else if (parts.length === 1 && site !== 'gfg' && !rule.reserved.includes(parts[0].toLowerCase()) && !rule.prefixes.includes(parts[0].toLowerCase())) username = parts[0]
  return username && USERNAME.test(username) ? { username } : fail
}
