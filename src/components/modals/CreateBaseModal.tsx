import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { blink } from '@/blink/client'

interface CreateBaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const BASE_COLORS = [
  '#2563EB', '#7C3AED', '#DC2626', '#EA580C', 
  '#CA8A04', '#16A34A', '#0891B2', '#C2410C'
]

export function CreateBaseModal({ open, onOpenChange, onSuccess }: CreateBaseModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState(BASE_COLORS[0])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const user = await blink.auth.me()
      
      const baseId = `base_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await blink.db.bases.create({
        id: baseId,
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        userId: user.id
      })

      // Create a default table
      const tableId = `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await blink.db.tables.create({
        id: tableId,
        baseId,
        name: 'Table 1',
        userId: user.id
      })

      // Create default fields
      const fields = [
        { name: 'Name', type: 'text', position: 0 },
        { name: 'Notes', type: 'text', position: 1 },
        { name: 'Status', type: 'select', position: 2, options: JSON.stringify([
          { id: 'todo', name: 'To do', color: '#EF4444' },
          { id: 'in_progress', name: 'In progress', color: '#F59E0B' },
          { id: 'done', name: 'Done', color: '#10B981' }
        ])}
      ]

      for (const field of fields) {
        const fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await blink.db.fields.create({
          id: fieldId,
          tableId,
          name: field.name,
          type: field.type,
          options: field.options,
          position: field.position,
          required: false,
          userId: user.id
        })
      }

      // Create default view
      const viewId = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await blink.db.views.create({
        id: viewId,
        tableId,
        name: 'Grid view',
        type: 'grid',
        userId: user.id
      })

      setName('')
      setDescription('')
      setSelectedColor(BASE_COLORS[0])
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Failed to create base:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new base</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Base name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this base for?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {BASE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color ? 'border-foreground' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create base'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}