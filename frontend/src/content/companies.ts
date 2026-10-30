import type { Target, Tier } from '@/practice/store'
import { directoryEntry, type DirectoryEntry } from './directory'
import type { StageGroupId, Weight } from './stageGroups'

export type Round = { name: string; detail: string }
export type Source = { label: string; url: string }

export type CompanyProfile = {
  id: string
  name: string
  tier: Tier
  /** One sentence on how the company hires. */
  summary: string
  rounds: Round[]
  /** Only set where the company's own guide names what it tests. Stage groups left out keep the tier's weight. */
  emphasis?: Partial<Record<StageGroupId, Weight>>
  notes?: string
  sources: Source[]
  /** The day the sources were last read. Hiring processes change, so check the pages before you rely on this. */
  checked: string
  /** True when the company publishes no round-by-round guide and this comes from candidate reports. */
  reported?: boolean
}

const CHECKED = '2026-10-22'

export const COMPANIES: CompanyProfile[] = [
  {
    id: 'google',
    name: 'Google',
    tier: 'maang',
    summary: 'Assessments and recruiter calls come first, then a panel of structured interviews; Google says the whole process usually takes about 6 to 8 weeks.',
    rounds: [
      { name: 'Assessments', detail: 'You may take the Google Hiring Assessment, which measures workstyle, and a role-related coding exercise where the role calls for one.' },
      { name: 'Recruiter conversations', detail: 'One or two shorter phone or video calls covering the skills the role needs, the team, and your location preferences.' },
      { name: 'Project work', detail: 'Depending on the role, a small project before the interviews, from a case study to writing or code samples.' },
      { name: 'Interview panel', detail: 'A panel of interviews over video or in person, scored against the same rubric for every candidate. Questions are open-ended and there are no brainteasers.' },
    ],
    notes: 'Google does not publish which topics its coding interviews cover, so this entry does not change your roadmap weights.',
    sources: [
      { label: 'Google Careers: our hiring process', url: 'https://www.google.com/about/careers/applications/how-we-hire/' },
      { label: 'Google Careers: interview prep', url: 'https://www.google.com/about/careers/applications/interview-tips' },
    ],
    checked: CHECKED,
  },
  {
    id: 'meta',
    name: 'Meta',
    tier: 'maang',
    summary: 'A coding-focused technical screen with a Meta engineer, then a full loop of coding, design and behavioral interviews.',
    rounds: [
      { name: 'Technical screen', detail: 'About 35 minutes of coding on two problems about computer science fundamentals such as algorithms, data structures, recursion and binary trees, with a few minutes for your questions.' },
      { name: 'Coding interviews', detail: 'General coding questions in the full loop. Meta suggests practising in a plain text editor with no syntax highlighting or autocompletion, and under time pressure.' },
      { name: 'Design interview', detail: 'Focused on either systems or product, depending on your background. Start from requirements: how many users, how many messages, how they are stored, and whether you push or pull.' },
      { name: 'Behavioral interview', detail: 'Forty-five minutes on your past work, what motivates you and the impact you want to have.' },
    ],
    emphasis: { foundations: 3, recursion: 3, trees: 3 },
    notes: 'The weights for foundations, recursion and trees come from Meta naming algorithms, data structures, recursion and binary trees for its screen.',
    sources: [
      { label: 'Meta Careers: preparing for your technical screen', url: 'https://www.metacareers.com/swe-prep-techscreen/' },
      { label: 'Meta Careers: preparing for your full loop interview', url: 'https://www.metacareers.com/swe-prep-onsite/' },
      { label: 'Meta Careers: preparing for your software engineering interview', url: 'https://www.metacareers.com/blog/preparing-for-your-software-engineering-interview-at-meta/' },
    ],
    checked: CHECKED,
  },
  {
    id: 'amazon',
    name: 'Amazon',
    tier: 'maang',
    summary: 'An online assessment, then a loop of four 55-minute interviews where coding and the Leadership Principles are both scored; the outcome comes within 5 business days.',
    rounds: [
      { name: 'Online assessment', detail: 'For SDE II: 90 minutes for two technical questions, then 20 minutes of systems design scenarios and an 8-minute work style survey tied to the Leadership Principles.' },
      { name: 'Interview loop', detail: 'Four 55-minute interviews with members of the software development community. Different interviewers are assigned to different competencies, technical and Leadership Principles.' },
      { name: 'Coding', detail: 'The main criteria are scalable, robust, well-tested code. Check edge cases and make sure bad input cannot slip through.' },
      { name: 'Behavioral', detail: 'Each interviewer typically asks two or three questions about successes or challenges. Use specific details and metrics, and say how you applied the Leadership Principles.' },
    ],
    notes: 'The published details are for SDE II. The loop for other levels can differ, so ask your recruiter.',
    sources: [
      { label: 'Amazon Jobs: SDE II interview prep', url: 'https://amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep' },
      { label: 'Amazon Jobs: interview loop', url: 'https://amazon.jobs/content/en/how-we-hire/interview-loop' },
      { label: 'Amazon Jobs: Leadership Principles', url: 'https://www.amazon.jobs/content/en/our-workplace/leadership-principles' },
    ],
    checked: CHECKED,
  },
  {
    id: 'apple',
    name: 'Apple',
    tier: 'maang',
    summary: 'Interviews are run team by team, so the shape varies; candidates report a recruiter call, a hiring manager call, technical phone screens and a long onsite.',
    rounds: [
      { name: 'Recruiter prescreen', detail: 'Candidates report a short call of about 15 to 30 minutes about your experience and why you want to work at Apple, with few technical questions.' },
      { name: 'Hiring manager conversation', detail: 'A conversation about your past projects and how they relate to what the team builds.' },
      { name: 'Technical phone interviews', detail: 'One or two interviews, each with a data structures and algorithms coding question, plus questions about your resume.' },
      { name: 'Onsite', detail: 'Several interviews of 45 to 60 minutes mixing coding, behavioral questions and knowledge of the team\'s domain. Experienced candidates report a system design round.' },
    ],
    notes: 'Apple publishes no round-by-round guide, so this entry is built from candidate reports and may not match your team. Treat it as a starting point.',
    sources: [
      { label: 'Glassdoor: Apple software engineer interviews', url: 'https://www.glassdoor.com/Interview/Apple-Software-Engineer-Interview-Questions-EI_IE1138.0,5_KO6,23.htm' },
      { label: 'Interview Kickstart: Apple software engineer interview', url: 'https://interviewkickstart.com/blogs/interview-questions/apple-software-engineer-interview-questions' },
    ],
    checked: CHECKED,
    reported: true,
  },
  {
    id: 'netflix',
    name: 'Netflix',
    tier: 'maang',
    summary: 'A take-home assessment followed by two rounds of interviews for new grads, or two to three for interns, with advancement decided on feedback at each stage.',
    rounds: [
      { name: 'Take-home assessment', detail: 'New grad and intern interviews both start with a take-home assessment.' },
      { name: 'Interview rounds', detail: 'Two rounds for new grads and about two to three for interns. Interviewers look at technical (where it applies), role-specific and behavioral skills.' },
      { name: 'Culture conversation', detail: 'Netflix encourages you to ask interviewers about its culture memo throughout the process.' },
    ],
    notes: 'Netflix publishes this for new grads and interns. Experienced hiring differs by team.',
    sources: [
      { label: 'Netflix Jobs: new grads', url: 'https://jobs.netflix.com/careers/new-grads' },
      { label: 'Netflix Jobs: internships', url: 'https://jobs.netflix.com/careers/internships' },
    ],
    checked: CHECKED,
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    tier: 'product',
    summary: 'Most interviews are two to four conversations of up to an hour with potential teammates, by phone, Teams or in person.',
    rounds: [
      { name: 'Interviews', detail: 'Two to four conversations with potential teammates and cross-functional colleagues, each up to an hour. Expect specific examples from your past work and how you would approach tasks in the role.' },
      { name: 'Technical interviews', detail: 'Assessed on technical principles and methods, how you solve problems and adapt to new challenges, and coding as part of the engineering lifecycle.' },
      { name: 'Growth mindset', detail: 'Microsoft says it looks for learn-it-alls rather than know-it-alls, so show curiosity and how you take feedback.' },
    ],
    notes: 'Student and recent graduate interviews have their own guidance on the Microsoft careers site.',
    sources: [
      { label: 'Microsoft Careers: how we hire', url: 'https://careers.microsoft.com/v2/global/en/hiring-tips.html' },
      { label: 'Microsoft Careers: technical interviews', url: 'https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing' },
      { label: 'Microsoft Careers: interview tips', url: 'https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips.html' },
    ],
    checked: CHECKED,
  },
  {
    id: 'adobe',
    name: 'Adobe',
    tier: 'product',
    summary: 'A talent conversation, a hiring manager interview, then team interviews with skills assessments where the function needs them.',
    rounds: [
      { name: 'Talent conversation', detail: 'An in-depth conversation about your background and goals, the role, team dynamics and what success looks like.' },
      { name: 'Hiring manager interview', detail: 'A deeper look at your background, your problem-solving and how your experience lines up with the role.' },
      { name: 'Skills assessments and team interviews', detail: 'Further interviews with potential team members, stakeholders and partners. Some functions are asked to complete other assessments.' },
    ],
    notes: 'Adobe does not say which topics its engineering interviews cover, so this entry does not change your roadmap weights.',
    sources: [{ label: 'Adobe Careers: how we hire', url: 'https://careers.adobe.com/us/en/hiring-process' }],
    checked: CHECKED,
  },
  {
    id: 'atlassian',
    name: 'Atlassian',
    tier: 'product',
    summary: 'Two coding interviews, a system design interview, a manager interview and a values interview, then an independent hiring committee.',
    rounds: [
      { name: 'Coding: data structures', detail: 'Sixty minutes. You choose the language, and how you think and weigh trade-offs matters more than perfect syntax.' },
      { name: 'Coding: code design', detail: 'Sixty minutes on designing code, from a different bank of questions.' },
      { name: 'System design', detail: 'Sixty minutes on a real engineering challenge. Questions ladder, so follow-ups get harder or change a constraint, and no code is needed.' },
      { name: 'Management interview', detail: 'Sixty minutes with the hiring manager or a senior manager about who you are, how you work and where you want to grow.' },
      { name: 'Values interview', detail: 'Forty-five minutes of behavioral questions against the five company values. Use the STAR method.' },
      { name: 'Hiring committee', detail: 'A committee that works independently from your interviewers reviews feedback and your CV and makes the decision.' },
    ],
    notes: 'Times are from the backend engineering guide. Other engineering roles use the same structure with role-specific prompts.',
    sources: [
      { label: 'Atlassian: engineering interview handbook', url: 'https://www.atlassian.com/company/careers/resources/interviewing/engineering' },
      { label: 'Atlassian: backend engineering interview guide (PDF)', url: 'https://wac-cdn.atlassian.com/dam/jcr:931efbe4-fa94-4988-9867-7ad172981257/Backend.pdf?cdnVersion=1210' },
    ],
    checked: CHECKED,
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    tier: 'startup',
    summary: 'Rounds are grouped into role fit, synergy and an AI edge round, rather than a fixed list of coding interviews.',
    rounds: [
      { name: 'Role fit', detail: 'Rounds that assess your skills, expertise and real-world thinking relevant to the role.' },
      { name: 'Synergy', detail: 'Rounds on communication, collaboration, ownership and how you work with others.' },
      { name: 'AI edge', detail: 'Rounds on how you bring AI into your workflow, your problem-solving and everyday execution.' },
    ],
    notes: 'Razorpay does not publish the content of each round. Treat DSA as likely but confirm with the recruiter.',
    sources: [{ label: 'Razorpay Careers: how we hire', url: 'https://razorpay.com/careers/' }],
    checked: CHECKED,
  },
  {
    id: 'tcs',
    name: 'TCS',
    tier: 'service',
    summary: 'The National Qualifier Test is a 190-minute integrated test, and your score decides whether you interview for Ninja, Digital or Prime.',
    rounds: [
      { name: 'Foundation section', detail: 'Seventy-five minutes covering numerical ability, verbal ability and reasoning ability.' },
      { name: 'Advanced section', detail: 'One hundred and fifteen minutes of advanced quantitative and reasoning questions and advanced coding. It is mandatory if you want a Digital or Prime offer.' },
      { name: 'Interviews', detail: 'Based on your test performance you qualify for Prime, Digital or Ninja interviews.' },
    ],
    notes: 'For the 2024 to 2026 batches TCS stated eligibility of 60% throughout, no pending backlogs, education gaps within 24 months and age 18 to 28. Check the current page, because eligibility changes each year.',
    sources: [{ label: 'TCS: All India NQT hiring', url: 'https://www.tcs.com/careers/india/tcs-all-india-nqt-hiring' }],
    checked: CHECKED,
  },
  {
    id: 'infosys',
    name: 'Infosys',
    tier: 'service',
    summary: 'Beyond the standard graduate route, Power Programmer and HackWithInfy are problem-solving routes into the Specialist Programmer role.',
    rounds: [
      { name: 'HackWithInfy', detail: 'A coding contest with online qualifiers; round 2 is a face-to-face coding challenge. It leads to Specialist Programmer and other roles in specialised units.' },
      { name: 'Power Programmer', detail: 'A rigorous vetting process with three technical interviews. Selected candidates go through an internship or job.' },
    ],
    notes: 'Infosys describes these two routes in the most detail. Its standard graduate hiring is campus and test based and is not described step by step on its site.',
    sources: [
      { label: 'Infosys: HackWithInfy', url: 'https://www.infosys.com/careers/hackwithinfy.html' },
      { label: 'Infosys: Power Programmers', url: 'https://www.infosys.com/careers/power-programmers.html' },
    ],
    checked: CHECKED,
  },
  {
    id: 'cognizant',
    name: 'Cognizant',
    tier: 'service',
    summary: 'The Generation Cognizant (GenC) route is application, screening, assessments, interviews and a result, though not everyone goes through every step.',
    rounds: [
      { name: 'Initial screening', detail: 'A recruiter who sees a fit reaches out through your placement officer or your registered email.' },
      { name: 'Assessments', detail: 'Depending on the role, one or more assessments of communication skills, aptitude and technical skills.' },
      { name: 'Interviews', detail: 'If you clear the assessments you meet the hiring team virtually or in person.' },
      { name: 'Result', detail: 'Shared with your placement officer for campus hiring, or with you for off-campus hiring.' },
    ],
    sources: [{ label: 'Cognizant Careers: GenC program', url: 'https://careers.cognizant.com/india-en/pathways-to-cognizant/genc-program/' }],
    checked: CHECKED,
  },
  {
    id: 'accenture',
    name: 'Accenture',
    tier: 'service',
    summary: 'An online technical assessment in a coding environment is scored automatically against test cases, and interviews follow if you pass.',
    rounds: [
      { name: 'Online technical assessment', detail: 'Done online in one sitting, typically within 72 hours of the invitation, and usually 30 to 90 minutes. You work in a coding environment that mirrors real engineering tasks.' },
      { name: 'Automatic scoring', detail: 'Responses are scored against predefined criteria such as test cases. Candidates who reach the threshold go on, and the decision is automated. If you do not pass, you wait at least 90 days before retaking the same assessment.' },
      { name: 'Interviews', detail: 'The assessment does not replace interviews. Recruiters and interviewers review the result alongside your experience.' },
    ],
    sources: [{ label: 'Accenture Careers: recruiting and hiring process', url: 'https://www.accenture.com/ch-en/careers/explore-careers/area-of-interest/journey-to-accenture' }],
    checked: CHECKED,
  },
  {
    id: 'capgemini',
    name: 'Capgemini',
    tier: 'service',
    summary: 'For freshers in India: an aptitude test, a coding or technical assessment, a group discussion for some roles, then technical and HR interviews.',
    rounds: [
      { name: 'Online aptitude test', detail: 'Logical reasoning, verbal ability and quantitative skills.' },
      { name: 'Coding or technical assessment', detail: 'Programming knowledge and problem-solving.' },
      { name: 'Group discussion', detail: 'For select roles. Tests communication, teamwork and analytical thinking.' },
      { name: 'Technical interview', detail: 'Domain-specific knowledge and how you apply it. Depending on the position there may be one or two.' },
      { name: 'HR interview', detail: 'Behavioral questions, your career aspirations and company fit.' },
    ],
    sources: [{ label: 'Capgemini India: recruitment process', url: 'https://www.capgemini.com/in-en/careers/join-capgemini/recruitment-process/' }],
    checked: CHECKED,
  },
]

const BY_ID = new Map(COMPANIES.map((c) => [c.id, c]))

export const companyById = (id: string): CompanyProfile | undefined => BY_ID.get(id)
export const companiesByTier = (tier: Tier): CompanyProfile[] => COMPANIES.filter((c) => c.tier === tier)

/** A directory company, with its hiring process when that has been checked against the company's own pages. */
export type Employer = DirectoryEntry & { profile?: CompanyProfile }

export function employerById(id: string): Employer | undefined {
  const entry = directoryEntry(id)
  return entry && { ...entry, profile: BY_ID.get(id) }
}

/** The chosen employer, only when it belongs to the chosen tier (so changing tier never leaves a stale employer in force). */
export function employerFor(target: Target): Employer | undefined {
  const e = target.employer ? employerById(target.employer) : undefined
  return e && e.tier === target.company ? e : undefined
}
