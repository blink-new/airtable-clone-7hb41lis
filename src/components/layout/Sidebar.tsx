import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Database, 
  Table, 
  Grid3X3, 
  FileText, 
  Calendar,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { blink } from '@/blink/client'
import type { Base, Table as TableType, View } from '@/types'

interface SidebarProps {
  selectedBaseId?: string
  selectedTableId?: string
  selectedViewId?: string
  onBaseSelect: (baseId: string) => void
  onTableSelect: (tableId: string) => void
  onViewSelect: (viewId: string) => void
  onCreateBase: () => void
  onCreateTable: () => void
}

export function Sidebar({
  selectedBaseId,
  selectedTableId,
  selectedViewId,
  onBaseSelect,
  onTableSelect,
  onViewSelect,
  onCreateBase,
  onCreateTable
}: SidebarProps) {
  const [bases, setBases] = useState<Base[]>([])
  const [tables, setTables] = useState<TableType[]>([])
  const [views, setViews] = useState<View[]>([])
  const [expandedBases, setExpandedBases] = useState<Set<string>>(new Set())
  const [user, setUser] = useState<any>(null)

  const loadBases = useCallback(async () => {
    if (!user?.id) return
    try {
      const result = await blink.db.bases.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setBases(result)
    } catch (error) {
      console.error('Failed to load bases:', error)
    }
  }, [user?.id])

  const loadTables = useCallback(async (baseId: string) => {
    if (!user?.id) return
    try {
      const result = await blink.db.tables.list({
        where: { baseId, userId: user.id },
        orderBy: { createdAt: 'asc' }
      })
      setTables(result)
    } catch (error) {
      console.error('Failed to load tables:', error)
    }
  }, [user?.id])

  const loadViews = useCallback(async (tableId: string) => {
    if (!user?.id) return
    try {
      const result = await blink.db.views.list({
        where: { tableId, userId: user.id },
        orderBy: { createdAt: 'asc' }
      })
      setViews(result)
    } catch (error) {
      console.error('Failed to load views:', error)
    }
  }, [user?.id])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadBases()
      }
    })
    return unsubscribe
  }, [loadBases])

  useEffect(() => {
    if (selectedBaseId) {
      loadTables(selectedBaseId)
      setExpandedBases(prev => new Set([...prev, selectedBaseId]))
    }
  }, [selectedBaseId, loadTables])

  useEffect(() => {
    if (selectedTableId) {
      loadViews(selectedTableId)
    }
  }, [selectedTableId, loadViews])

  const toggleBaseExpansion = (baseId: string) => {
    setExpandedBases(prev => {
      const newSet = new Set(prev)
      if (newSet.has(baseId)) {
        newSet.delete(baseId)
      } else {
        newSet.add(baseId)
      }
      return newSet
    })
  }

  const getViewIcon = (type: string) => {
    switch (type) {
      case 'grid': return Grid3X3
      case 'form': return FileText
      case 'calendar': return Calendar
      default: return Grid3X3
    }
  }

  return (
    <div className="w-64 border-r border-border bg-muted/20 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button 
          onClick={onCreateBase}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          Create base
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-2">
          {bases.map((base) => {
            const isExpanded = expandedBases.has(base.id)
            const isSelected = selectedBaseId === base.id
            const baseTables = tables.filter(t => t.baseId === base.id)

            return (
              <div key={base.id} className="mb-2">
                {/* Base item */}
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start gap-2 h-8 px-2"
                    onClick={() => {
                      onBaseSelect(base.id)
                      toggleBaseExpansion(base.id)
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: base.color }}
                      />
                      <span className="text-sm truncate">{base.name}</span>
                    </div>
                  </Button>
                </div>

                {/* Tables */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {baseTables.map((table) => {
                      const isTableSelected = selectedTableId === table.id
                      const tableViews = views.filter(v => v.tableId === table.id)

                      return (
                        <div key={table.id}>
                          <Button
                            variant={isTableSelected ? "secondary" : "ghost"}
                            size="sm"
                            className="w-full justify-start gap-2 h-7 px-2 text-xs"
                            onClick={() => onTableSelect(table.id)}
                          >
                            <Table className="w-3 h-3" />
                            <span className="truncate">{table.name}</span>
                          </Button>

                          {/* Views */}
                          {isTableSelected && tableViews.length > 0 && (
                            <div className="ml-4 mt-1 space-y-1">
                              {tableViews.map((view) => {
                                const ViewIcon = getViewIcon(view.type)
                                const isViewSelected = selectedViewId === view.id

                                return (
                                  <Button
                                    key={view.id}
                                    variant={isViewSelected ? "secondary" : "ghost"}
                                    size="sm"
                                    className="w-full justify-start gap-2 h-6 px-2 text-xs"
                                    onClick={() => onViewSelect(view.id)}
                                  >
                                    <ViewIcon className="w-3 h-3" />
                                    <span className="truncate">{view.name}</span>
                                  </Button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Add table button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 h-7 px-2 text-xs text-muted-foreground"
                      onClick={onCreateTable}
                    >
                      <Plus className="w-3 h-3" />
                      Add table
                    </Button>
                  </div>
                )}
              </div>
            )
          })}

          {bases.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No bases yet</p>
              <p className="text-xs">Create your first base to get started</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}