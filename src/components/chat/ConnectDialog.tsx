"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { connectorRegistry } from '@/connectors/registry'

/** Dialog to store connector credentials */
export function AddDatabaseDialog() {
  const [connected, setConnected] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(false)

  async function onConnect(e: React.FormEvent<HTMLFormElement>, name: string) {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const url = (form.elements.namedItem('url') as HTMLInputElement).value
    const user = (form.elements.namedItem('user') as HTMLInputElement).value
    const pass = (form.elements.namedItem('pass') as HTMLInputElement).value
    const res = await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: name, key: url, value: `${user}:${pass}` })
    })
    if (res.ok) setConnected({ ...connected, [name]: true })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full text-xs">
          Connect
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connectors</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {Object.keys(connectorRegistry).map((name) => (
            <form key={name} onSubmit={(e) => onConnect(e, name)} className="border p-2 rounded">
              <p className="font-semibold mb-2">
                {name} {connected[name] && <span className="text-green-500">Connected</span>}
              </p>
              {!connected[name] && (
                <div className="space-y-2">
                  <input name="url" required placeholder="URL" className="border p-1 w-full" />
                  <input name="user" required placeholder="User" className="border p-1 w-full" />
                  <input name="pass" required type="password" placeholder="Password" className="border p-1 w-full" />
                  <Button type="submit" disabled={connected[name]}>Connect</Button>
                </div>
              )}
            </form>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
