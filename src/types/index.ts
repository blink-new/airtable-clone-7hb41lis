export interface Base {
  id: string
  name: string
  description?: string
  color: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Table {
  id: string
  baseId: string
  name: string
  description?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Field {
  id: string
  tableId: string
  name: string
  type: FieldType
  options?: string // JSON string
  required: boolean
  position: number
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Record {
  id: string
  tableId: string
  data: string // JSON string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface View {
  id: string
  tableId: string
  name: string
  type: ViewType
  config?: string // JSON string
  userId: string
  createdAt: string
  updatedAt: string
}

export type FieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'attachment'

export type ViewType = 'grid' | 'form' | 'calendar'

export interface FieldOption {
  id: string
  name: string
  color?: string
}

export interface RecordData {
  [fieldId: string]: any
}

export interface User {
  id: string
  email: string
  displayName?: string
}