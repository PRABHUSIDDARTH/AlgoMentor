import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { nextThemeChoice } from '@/lib/theme'
import { useThemeChoice } from '@/lib/useTheme'
import { cn } from '@/lib/utils'

const LABELS = { light: 'Light theme', dark: 'Dark theme', system: 'System theme' } as const

/** Cycles light → dark → system. */
export function ThemeToggle({ className }: { className?: string }) {
  const [choice, setChoice] = useThemeChoice()
  const Icon = choice === 'light' ? Sun : choice === 'dark' ? Moon : Monitor

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Theme"
          aria-description={LABELS[choice]}
          className={cn('text-current hover:bg-current/10', className)}
          onClick={() => setChoice(nextThemeChoice(choice))}
        >
          <Icon className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{LABELS[choice]}</TooltipContent>
    </Tooltip>
  )
}
