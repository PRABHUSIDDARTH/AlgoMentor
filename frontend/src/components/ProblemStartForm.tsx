import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  buttonLabel?: string
  placeholder?: string
  className?: string
  /** Called instead of navigating, when the form lives inside the workspace. */
  onSubmit?: (value: string) => void
}

/** Problem number, LeetCode link or pasted statement → /app?q=… */
export function ProblemStartForm({
  buttonLabel = 'Start solving',
  placeholder = 'Problem number or statement, e.g. 146',
  className,
  onSubmit,
}: Props) {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  function submit(e: FormEvent) {
    e.preventDefault()
    const v = value.trim()
    if (!v) return
    if (onSubmit) onSubmit(v)
    else navigate('/app?q=' + encodeURIComponent(v))
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        'flex w-full max-w-[440px] items-stretch overflow-hidden rounded-[7px] border border-ink bg-grey focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink',
        className,
      )}
    >
      <input
        aria-label="Problem number or statement"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-ink-muted"
      />
      <Button type="submit" className="h-auto rounded-none bg-sage px-5 font-semibold text-on-sage hover:bg-sage/90">
        {buttonLabel}
      </Button>
    </form>
  )
}
