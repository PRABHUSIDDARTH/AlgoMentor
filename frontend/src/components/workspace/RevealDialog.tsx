import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  open: boolean
  hintsLeft: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function RevealDialog({ open, hintsLeft, onOpenChange, onConfirm }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reveal the solution?</AlertDialogTitle>
          <AlertDialogDescription>
            Reveal now and skip {hintsLeft} {hintsLeft === 1 ? 'hint' : 'hints'}? You can still come back to them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-ink bg-transparent">Keep thinking</AlertDialogCancel>
          <AlertDialogAction className="bg-ink text-cream hover:bg-ink/90" onClick={onConfirm}>Reveal solution</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
