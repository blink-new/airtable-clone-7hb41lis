import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Filter, 
  SortAsc, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { blink } from '@/blink/client'
import type { Field, Record, RecordData } from '@/types'

interface GridViewProps {
  tableId: string
  onAddRecord: () => void
  onEditRecord: (recordId: string) => void
}

export function GridView({ tableId, onAddRecord, onEditRecord }: GridViewProps) {
  const [fields, setFields] = useState<Field[]>([])
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{ recordId: string; fieldId: string } | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const loadData = useCallback(async () => {
    if (!user?.id || !tableId) return
    
    setLoading(true)
    try {
      // Load fields
      const fieldsResult = await blink.db.fields.list({
        where: { tableId, userId: user.id },
        orderBy: { position: 'asc' }
      })
      setFields(fieldsResult)

      // Load records
      const recordsResult = await blink.db.records.list({
        where: { tableId, userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setRecords(recordsResult)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, tableId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const parseRecordData = (dataString: string): RecordData => {
    try {
      return JSON.parse(dataString)
    } catch {
      return {}
    }
  }

  const updateCellValue = async (recordId: string, fieldId: string, value: any) => {
    try {
      const record = records.find(r => r.id === recordId)
      if (!record) return

      const currentData = parseRecordData(record.data)
      const newData = { ...currentData, [fieldId]: value }

      await blink.db.records.update(recordId, {
        data: JSON.stringify(newData)
      })

      // Update local state
      setRecords(prev => prev.map(r => 
        r.id === recordId 
          ? { ...r, data: JSON.stringify(newData) }
          : r
      ))
    } catch (error) {
      console.error('Failed to update cell:', error)
    }
  }

  const renderCellValue = (record: Record, field: Field) => {
    const data = parseRecordData(record.data)
    const value = data[field.id]

    switch (field.type) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => updateCellValue(record.id, field.id, e.target.checked)}
            className="w-4 h-4"
          />
        )
      case 'select': {
        const options = field.options ? JSON.parse(field.options) : []
        const selectedOption = options.find((opt: any) => opt.id === value)
        return selectedOption ? (
          <Badge variant="secondary" className="text-xs">
            {selectedOption.name}
          </Badge>
        ) : null
      }
      case 'date':
        return value ? new Date(value).toLocaleDateString() : ''
      case 'number':
        return value || ''
      default:
        return value || ''
    }
  }

  const renderEditableCell = (record: Record, field: Field) => {
    const data = parseRecordData(record.data)
    const value = data[field.id] || ''
    const isEditing = editingCell?.recordId === record.id && editingCell?.fieldId === field.id

    if (field.type === 'checkbox') {
      return renderCellValue(record, field)
    }

    if (isEditing) {
      return (
        <Input
          value={value}
          onChange={(e) => updateCellValue(record.id, field.id, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              setEditingCell(null)
            }
          }}
          className="h-6 text-xs border-0 p-1 bg-transparent"
          autoFocus
        />
      )
    }

    return (
      <div
        className="w-full h-full cursor-text flex items-center"
        onClick={() => setEditingCell({ recordId: record.id, fieldId: field.id })}
      >
        {renderCellValue(record, field)}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Toolbar */}
      <div className="h-12 border-b border-border bg-background flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onAddRecord}>
            <Plus className="w-4 h-4 mr-2" />
            Add record
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <SortAsc className="w-4 h-4 mr-2" />
            Sort
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Views
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full custom-scrollbar">
          <div className="min-w-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-muted/50 border-b border-border">
              <div className="flex">
                {/* Row number header */}
                <div className="w-12 grid-header flex items-center justify-center">
                  #
                </div>
                
                {/* Field headers */}
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="min-w-[150px] max-w-[300px] grid-header relative group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate">{field.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                    </div>
                    <div className="resize-handle" />
                  </div>
                ))}
                
                {/* Add field button */}
                <div className="min-w-[100px] grid-header">
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Field
                  </Button>
                </div>
              </div>
            </div>

            {/* Rows */}
            <div>
              {records.map((record, index) => (
                <div key={record.id} className="flex hover:bg-muted/30">
                  {/* Row number */}
                  <div className="w-12 grid-cell flex items-center justify-center text-muted-foreground">
                    {index + 1}
                  </div>
                  
                  {/* Data cells */}
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="min-w-[150px] max-w-[300px] grid-cell"
                    >
                      {renderEditableCell(record, field)}
                    </div>
                  ))}
                  
                  {/* Actions */}
                  <div className="min-w-[100px] grid-cell">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => onEditRecord(record.id)}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Empty state */}
              {records.length === 0 && (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="text-center">
                    <div className="text-lg mb-2">No records yet</div>
                    <div className="text-sm mb-4">Add your first record to get started</div>
                    <Button onClick={onAddRecord}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add record
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}