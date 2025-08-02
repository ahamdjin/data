import { create } from 'zustand'

interface ConnectorStatus {
  status: 'not_connected' | 'connected'
}

interface Store {
  connectors: Record<string, ConnectorStatus>
  setConnected(name: string, connected: boolean): void
}

export const useConnectorStore = create<Store>((set) => ({
  connectors: {},
  setConnected: (name, connected) =>
    set((s) => ({ connectors: { ...s.connectors, [name]: { status: connected ? 'connected' : 'not_connected' } } }))
}))
