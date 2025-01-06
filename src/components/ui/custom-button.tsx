import { Button } from "@/components/ui/button"
import { LucideTrash, LucidePencil, LucideEye } from 'lucide-react'

export function ViewButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button onClick={onClick} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
      <LucideEye className="h-4 w-4" />
    </Button>
  )
}

export function EditButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button onClick={onClick} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
      <LucidePencil className="h-4 w-4" />
    </Button>
  )
}

export function TrashButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button onClick={onClick} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
      <LucideTrash className="h-4 w-4" />
    </Button>
  )
}