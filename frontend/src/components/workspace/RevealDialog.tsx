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
  /** Where focus goes when the dialog closes (it isn't opened by a Radix trigger). */
  returnFocus?: () => void
}

export function RevealDialog({ open, hintsLeft, onOpenChange, onConfirm, returnFocus }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        onCloseAutoFocus={(e) => {
          if (!returnFocus) return
          e.preventDefault()
          returnFocus()
        }}
      >
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
