import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { nextThemeChoice } from '@/lib/theme'
import { useThemeChoice } from '@/lib/useTheme'
import { cn } from '@/lib/utils'

/** Switches between light and dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const [choice, setChoice] = useThemeChoice()
  const next = nextThemeChoice(choice)
  const Icon = choice === 'dark' ? Moon : Sun

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Theme"
          aria-description={`Switch to ${next} theme`}
          className={cn('text-current hover:bg-current/10', className)}
          onClick={() => setChoice(next)}
        >
          <Icon className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Switch to {next} theme</TooltipContent>
    </Tooltip>
  )
}
