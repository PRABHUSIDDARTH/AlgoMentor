import { NavLink } from 'react-router'

const LINKS = [
  { to: '/learn/oop', label: 'OOP' },
  { to: '/learn/cn', label: 'Networks' },
  { to: '/learn/dbms', label: 'DBMS' },
  { to: '/git', label: 'Git' },
  { to: '/resume', label: 'Resume projects' },
]

/** The Learning hub's own sections, under the app navbar. */
export function LearnNav() {
  return (
    <nav aria-label="Learn" className="flex flex-wrap gap-x-5 gap-y-2 border-b border-line text-[13px]">
      <NavLink to="/learn" end className={({ isActive }) => (isActive ? 'pb-2 font-semibold shadow-[0_2px_0_var(--sage)]' : 'pb-2 text-ink-muted hover:text-ink')}>Overview</NavLink>
      {LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'pb-2 font-semibold shadow-[0_2px_0_var(--sage)]' : 'pb-2 text-ink-muted hover:text-ink')}>
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}
