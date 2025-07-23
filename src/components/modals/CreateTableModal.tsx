import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { blink } from '@/blink/client'

interface CreateTableModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  baseId: string
  onSuccess: () => void
}

export function CreateTableModal({ open, onOpenChange, baseId, onSuccess }: CreateTableModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !baseId) return

    setLoading(true)
    try {
      const user = await blink.auth.me()
      
      const tableId = `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      console.log('Creating table with data:', {
        id: tableId,
        baseId,
        name: name.trim(),
        description: description.trim() || null,
        userId: user.id
      })
      
      // Create the table
      const tableResult = await blink.db.tables.create({
        id: tableId,
        baseId,
        name: name.trim(),
        description: description.trim() || null,
        userId: user.id
      })
      
      console.log('Table created successfully:', tableResult)

      // Create default fields
      const fields = [
        { name: 'Name', type: 'text', position: 0 },
        { name: 'Notes', type: 'text', position: 1 }
      ]

      for (let i = 0; i < fields.length; i++) {
        const field = fields[i]
        const fieldId = `field_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`
        
        console.log('Creating field:', {
          id: fieldId,
          tableId,
          name: field.name,
          type: field.type,
          position: field.position,
          required: false,
          userId: user.id
        })
        
        await blink.db.fields.create({
          id: fieldId,
          tableId,
          name: field.name,
          type: field.type,
          position: field.position,
          required: false,
          userId: user.id
        })
        
        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Create default view
      const viewId = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      console.log('Creating view:', {
        id: viewId,
        tableId,
        name: 'Grid view',
        type: 'grid',
        userId: user.id
      })
      
      await blink.db.views.create({
        id: viewId,
        tableId,
        name: 'Grid view',
        type: 'grid',
        userId: user.id
      })

      console.log('All components created successfully')

      // Clear form and close modal
      setName('')
      setDescription('')
      onOpenChange(false)
      
      // Trigger refresh after a short delay to ensure data is saved
      setTimeout(() => {
        onSuccess()
      }, 100)
      
    } catch (error) {
      console.error('Failed to create table:', error)
      // Show more detailed error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to create table: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new table</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Table name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My table"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this table for?"
              rows={3}
            />
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
              {loading ? 'Creating...' : 'Create table'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}