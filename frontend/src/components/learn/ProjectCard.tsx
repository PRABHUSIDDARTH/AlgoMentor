import { Link } from 'react-router'
import type { Project } from '@/content/learn/types'

const LEVEL: Record<Project['level'], string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

export function ProjectCard({ project }: { project: Project }) {
  return (
    <li className="grid content-start gap-2 rounded-lg border border-line bg-cream px-5 py-4">
      <p className="eyebrow">{LEVEL[project.level]}</p>
      <h3 className="text-[16px] font-semibold leading-snug">
        <Link to={`/projects/${project.id}`} className="hover:underline hover:underline-offset-[3px]">{project.title}</Link>
      </h3>
      <p className="line-clamp-3 text-[13px] leading-relaxed text-ink-muted">{project.goal}</p>
    </li>
  )
}
