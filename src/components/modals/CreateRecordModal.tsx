import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { blink } from '@/blink/client'
import type { Field, FieldOption } from '@/types'

interface CreateRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tableId: string
  onSuccess: () => void
}

export function CreateRecordModal({ open, onOpenChange, tableId, onSuccess }: CreateRecordModalProps) {
  const [fields, setFields] = useState<Field[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const loadFields = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const result = await blink.db.fields.list({
        where: { tableId, userId: user.id },
        orderBy: { position: 'asc' }
      })
      setFields(result)
      
      // Initialize form data
      const initialData: Record<string, any> = {}
      result.forEach(field => {
        initialData[field.id] = field.type === 'checkbox' ? false : ''
      })
      setFormData(initialData)
    } catch (error) {
      console.error('Failed to load fields:', error)
    }
  }, [tableId])

  useEffect(() => {
    if (open && tableId) {
      loadFields()
    }
  }, [open, tableId, loadFields])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tableId) return

    setLoading(true)
    try {
      const user = await blink.auth.me()
      
      const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await blink.db.records.create({
        id: recordId,
        tableId,
        data: JSON.stringify(formData),
        userId: user.id
      })

      setFormData({})
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Failed to create record:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFieldValue = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const renderFieldInput = (field: Field) => {
    const value = formData[field.id]

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        )
      
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
          />
        )
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked) => updateFieldValue(field.id, checked)}
            />
            <Label className="text-sm font-normal">
              {field.name}
            </Label>
          </div>
        )
      
      case 'select': {
        const options: FieldOption[] = field.options ? JSON.parse(field.options) : []
        return (
          <Select value={value || ''} onValueChange={(val) => updateFieldValue(field.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
      
      case 'url':
        return (
          <Input
            type="url"
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder="https://example.com"
          />
        )
      
      case 'email':
        return (
          <Input
            type="email"
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder="email@example.com"
          />
        )
      
      case 'phone':
        return (
          <Input
            type="tel"
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        )
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add new record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              {field.type !== 'checkbox' && (
                <Label htmlFor={field.id}>
                  {field.name}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
              )}
              {renderFieldInput(field)}
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No fields found. Add some fields to this table first.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fields.length === 0}>
              {loading ? 'Creating...' : 'Create record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}