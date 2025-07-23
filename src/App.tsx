import { useState, useEffect, useCallback } from 'react'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { GridView } from '@/components/grid/GridView'
import { CreateBaseModal } from '@/components/modals/CreateBaseModal'
import { CreateTableModal } from '@/components/modals/CreateTableModal'
import { CreateRecordModal } from '@/components/modals/CreateRecordModal'
import { blink } from '@/blink/client'
import type { Base, Table } from '@/types'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Selected items
  const [selectedBaseId, setSelectedBaseId] = useState<string>()
  const [selectedTableId, setSelectedTableId] = useState<string>()
  const [selectedViewId, setSelectedViewId] = useState<string>()
  
  // Current data
  const [currentBase, setCurrentBase] = useState<Base>()
  const [currentTable, setCurrentTable] = useState<Table>()
  
  // Modal states
  const [createBaseModalOpen, setCreateBaseModalOpen] = useState(false)
  const [createTableModalOpen, setCreateTableModalOpen] = useState(false)
  const [createRecordModalOpen, setCreateRecordModalOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadCurrentBase = useCallback(async () => {
    if (!selectedBaseId || !user?.id) return
    try {
      const bases = await blink.db.bases.list({
        where: { id: selectedBaseId, userId: user.id }
      })
      if (bases.length > 0) {
        setCurrentBase(bases[0])
      }
    } catch (error) {
      console.error('Failed to load current base:', error)
    }
  }, [selectedBaseId, user?.id])

  const loadCurrentTable = useCallback(async () => {
    if (!selectedTableId || !user?.id) return
    try {
      const tables = await blink.db.tables.list({
        where: { id: selectedTableId, userId: user.id }
      })
      if (tables.length > 0) {
        setCurrentTable(tables[0])
      }
    } catch (error) {
      console.error('Failed to load current table:', error)
    }
  }, [selectedTableId, user?.id])

  useEffect(() => {
    if (selectedBaseId && user?.id) {
      loadCurrentBase()
    }
  }, [selectedBaseId, user?.id, loadCurrentBase])

  useEffect(() => {
    if (selectedTableId && user?.id) {
      loadCurrentTable()
    }
  }, [selectedTableId, user?.id, loadCurrentTable])

  const handleBaseSelect = (baseId: string) => {
    setSelectedBaseId(baseId)
    setSelectedTableId(undefined)
    setSelectedViewId(undefined)
    setCurrentTable(undefined)
  }

  const handleTableSelect = (tableId: string) => {
    setSelectedTableId(tableId)
    setSelectedViewId(undefined)
  }

  const handleViewSelect = (viewId: string) => {
    setSelectedViewId(viewId)
  }

  const handleCreateBase = () => {
    setCreateBaseModalOpen(true)
  }

  const handleCreateTable = () => {
    if (!selectedBaseId) return
    setCreateTableModalOpen(true)
  }

  const handleAddRecord = () => {
    if (!selectedTableId) return
    setCreateRecordModalOpen(true)
  }

  const handleEditRecord = (recordId: string) => {
    // TODO: Implement record editing
    console.log('Edit record:', recordId)
  }

  const refreshData = () => {
    // This will trigger re-renders in child components
    setSelectedBaseId(prev => prev)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Loading AirClone...</div>
          <div className="text-sm text-muted-foreground">Please wait while we set up your workspace</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Welcome to AirClone</div>
          <div className="text-sm text-muted-foreground">Please sign in to continue</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <TopNavigation currentBase={currentBase} />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          selectedBaseId={selectedBaseId}
          selectedTableId={selectedTableId}
          selectedViewId={selectedViewId}
          onBaseSelect={handleBaseSelect}
          onTableSelect={handleTableSelect}
          onViewSelect={handleViewSelect}
          onCreateBase={handleCreateBase}
          onCreateTable={handleCreateTable}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {selectedTableId ? (
            <GridView
              tableId={selectedTableId}
              onAddRecord={handleAddRecord}
              onEditRecord={handleEditRecord}
            />
          ) : selectedBaseId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Select a table</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Choose a table from the sidebar to view its data
                </div>
                <button
                  onClick={handleCreateTable}
                  className="text-primary hover:underline"
                >
                  Or create a new table
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Welcome to AirClone</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Create your first base to get started with organizing your data
                </div>
                <button
                  onClick={handleCreateBase}
                  className="text-primary hover:underline"
                >
                  Create your first base
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateBaseModal
        open={createBaseModalOpen}
        onOpenChange={setCreateBaseModalOpen}
        onSuccess={refreshData}
      />
      
      <CreateTableModal
        open={createTableModalOpen}
        onOpenChange={setCreateTableModalOpen}
        baseId={selectedBaseId || ''}
        onSuccess={refreshData}
      />
      
      <CreateRecordModal
        open={createRecordModalOpen}
        onOpenChange={setCreateRecordModalOpen}
        tableId={selectedTableId || ''}
        onSuccess={refreshData}
      />
    </div>
  )
}

export default App