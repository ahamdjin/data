import { useState, useEffect } from 'react'
import { BaseConnectorConfig } from '../types/connector'

export function useConnectorTest(cfg: BaseConnectorConfig) {
  const [status, setStatus] = useState<'idle'|'testing'|'ok'|'error'>('idle')
  const [error, setError] = useState<string>()
  async function test() {
    setStatus('testing')
    setError(undefined)
    try {
      await fetch('/api/connectors/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      }).then(res => {
        if (!res.ok) throw new Error(res.statusText)
      })
      setStatus('ok')
    } catch (e: any) {
      setStatus('error')
      setError(String(e))
    }
  }
  return { status, error, test }
}

export function useSyncProgress(id: string) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    if (!id) return
    const es = new EventSource(`/api/connectors/${id}/progress`)
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        setPct(data.percent ?? 0)
      } catch {
        setPct(0)
      }
    }
    return () => es.close()
  }, [id])
  return pct
}
