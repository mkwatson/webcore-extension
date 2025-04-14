// Re-export types from other files in the shared package
export * from './messaging-types'

// Keep existing exports if they are intended to be shared
export const SHARED_CONSTANT = 'Hello from shared package!'

export type SharedType = {
  id: string
  value: number
}
