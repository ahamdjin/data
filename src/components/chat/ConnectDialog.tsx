"use client"

import React, { useEffect, useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const credSchema = z.object({
  url: z.string().url(),
  user: z.string(),
  pass: z.string()
})
type Creds = z.infer<typeof credSchema>

function ConnectorCard({ name, connected, onDone }: { name: string; connected: boolean; onDone: () => void }) {
  const { register, handleSubmit } = useForm<Creds>({ resolver: zodResolver(credSchema) })
  const submit = handleSubmit(async (data) => {
    const res = await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: name, creds: data })
    })
    if (res.ok) onDone()
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {name} {connected && <span className="text-green-500">✔</span>}
        </CardTitle>
      </CardHeader>
      {!connected && (
        <CardContent>
          <form onSubmit={submit} className="space-y-2">
            <input {...register('url')} placeholder="URL" className="border p-1 w-full" />
            <input {...register('user')} placeholder="User" className="border p-1 w-full" />
            <input {...register('pass')} type="password" placeholder="Password" className="border p-1 w-full" />
            <Button type="submit">Connect</Button>
          </form>
        </CardContent>
      )}
    </Card>
  )
}

/** Dialog to store connector credentials */
export function AddDatabaseDialog() {
  const [connected, setConnected] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/credentials')
      .then((res) => (res.ok ? res.json() : []))
      .then((active: string[]) => {
        const state: Record<string, boolean> = {}
        for (const name of active) state[name] = true
        setConnected(state)
      })
      .catch(() => {})
  }, [])

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
            <ConnectorCard
              key={name}
              name={name}
              connected={!!connected[name]}
              onDone={() => setConnected({ ...connected, [name]: true })}
            />
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
