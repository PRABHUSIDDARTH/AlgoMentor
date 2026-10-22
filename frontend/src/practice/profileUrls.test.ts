import { describe, expect, it } from 'vitest'
import { parseLinkedIn, parseProfileUrl } from './profileUrls'

describe('parseProfileUrl', () => {
  it.each([
    ['https://leetcode.com/u/Lee215/', 'Lee215'],
    ['leetcode.com/lee215?tab=submissions', 'lee215'],
    ['www.leetcode.com/u/lee215', 'lee215'],
    ['  https://leetcode.com/u/lee215  ', 'lee215'],
  ])('parsesProfileUrlVariants leetcode %s', (input, user) => {
    expect(parseProfileUrl('leetcode', input)).toEqual({ username: user })
  })

  it.each([
    ['https://www.hackerrank.com/profile/abc_1', 'abc_1'],
    ['hackerrank.com/abc', 'abc'],
  ])('parsesProfileUrlVariants hackerrank %s', (input, user) => {
    expect(parseProfileUrl('hackerrank', input)).toEqual({ username: user })
  })

  it.each([
    ['https://www.geeksforgeeks.org/user/nishant_raj/', 'nishant_raj'],
    ['geeksforgeeks.org/profile/x.y'],
    ['https://auth.geeksforgeeks.org/user/x.y/practice/'],
  ])('parsesProfileUrlVariants gfg %s', (input, user = 'x.y') => {
    expect(parseProfileUrl('gfg', input)).toEqual({ username: user })
  })

  it.each([
    ['leetcode', 'https://evil.com/u/x'],
    ['leetcode', 'not a url'],
    ['leetcode', 'https://leetcode.com/problems/two-sum/'],
    ['hackerrank', 'https://www.hackerrank.com/domains/algorithms'],
    ['gfg', 'https://www.geeksforgeeks.org/dsa/arrays/'],
    ['gfg', ''],
  ] as const)('rejects %s %s with the expected format', (site, input) => {
    const result = parseProfileUrl(site, input)
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toMatch(/Use a link like/)
  })

  it.each([
    ['https://github.com/octocat', 'octocat'],
    ['github.com/octo-cat/', 'octo-cat'],
    ['https://www.github.com/octocat?tab=repositories', 'octocat'],
    ['https://github.com/octocat/hello-world', 'octocat'],
  ])('parsesGitHubLinks %s', (input, user) => {
    expect(parseProfileUrl('github', input)).toEqual({ username: user })
  })

  it.each(['https://github.com/settings/profile', 'https://github.com/orgs/x', 'https://gitlab.com/octocat', 'https://github.com/'])('rejectsGitHubPagesThatAreNotUsers %s', (input) => {
    expect(parseProfileUrl('github', input)).toHaveProperty('error')
  })

  it.each([
    ['https://www.linkedin.com/in/ana-gomez-123/', 'ana-gomez-123'],
    ['linkedin.com/in/anagomez', 'anagomez'],
    ['https://in.linkedin.com/in/ana-gomez', 'ana-gomez'],
    ['ana-gomez', 'ana-gomez'],
  ])('parsesLinkedInProfiles %s', (input, user) => {
    expect(parseLinkedIn(input)).toEqual({ username: user })
  })

  it.each(['https://www.linkedin.com/company/acme', 'https://evil.com/in/ana', 'a', 'ana gomez'])('rejectsWhatIsNotALinkedInProfile %s', (input) => {
    expect(parseLinkedIn(input)).toHaveProperty('error')
  })
})
