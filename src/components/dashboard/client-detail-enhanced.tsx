'use client'

import { Calendar, Plus, StickyNote, Tag, X } from 'lucide-react'
import { useState } from 'react'

interface ClientDetailEnhancedProps {
  client: { id: string }
  notes: Array<{
    id: string
    note: string
    source?: string | null
    created_at: string
  }>
  tags: Array<{
    id: string
    tag: string
  }>
  appointments: Array<{
    id: string
    title: string
    status: string
    starts_at: string
    services?: { name?: string | null } | null
  }>
}

export function ClientDetailEnhanced({
  client,
  notes,
  tags,
  appointments,
}: ClientDetailEnhancedProps) {
  const [newNote, setNewNote] = useState('')
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  const addNote = async () => {
    if (!newNote.trim()) return
    setSaving(true)
    try {
      await fetch('/api/clients/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          note: newNote,
        }),
      })
      setNewNote('')
      window.location.reload()
    } catch (err) {
      console.error('Failed to add note:', err)
    } finally {
      setSaving(false)
    }
  }

  const addTag = async () => {
    if (!newTag.trim()) return
    setSaving(true)
    try {
      await fetch('/api/clients/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          tag: newTag.toLowerCase(),
        }),
      })
      setNewTag('')
      window.location.reload()
    } catch (err) {
      console.error('Failed to add tag:', err)
    } finally {
      setSaving(false)
    }
  }

  const removeTag = async (tagId: string) => {
    try {
      await fetch(`/api/clients/tags?id=${tagId}`, { method: 'DELETE' })
      window.location.reload()
    } catch (err) {
      console.error('Failed to remove tag:', err)
    }
  }

  return (
    <div className="dashboard-stack">
      <div className="panel rounded-[32px] px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
            <Tag className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--ink)]">Tags</h3>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag.id} className="chip">
              {tag.tag}
              <button onClick={() => removeTag(tag.id)} className="text-[var(--ink-faint)] hover:text-[var(--error)]">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {tags.length === 0 ? <span className="text-sm text-[var(--ink-soft)]">No tags yet.</span> : null}
        </div>
        <div className="mt-5 flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            placeholder="Add tag..."
            className="field-input flex-1 text-sm"
          />
          <button onClick={addTag} disabled={saving} className="btn-primary h-12 w-12 rounded-2xl px-0">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="panel rounded-[32px] px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
            <StickyNote className="h-4 w-4 text-[var(--teal)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--ink)]">Notes</h3>
        </div>
        <div className="mt-5 space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-[24px] bg-white/45 px-4 py-4">
                <p className="text-sm leading-7 text-[var(--ink-soft)]">{note.note}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                  {note.source === 'ai' ? 'Added by AI' : 'Manual'} •{' '}
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="mt-5 flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="field-textarea flex-1 text-sm"
          />
          <button
            onClick={addNote}
            disabled={saving || !newNote.trim()}
            className="btn-primary self-end"
          >
            Add
          </button>
        </div>
      </div>

      <div className="panel rounded-[32px] px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(201,146,64,0.12)]">
            <Calendar className="h-4 w-4 text-[var(--gold)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--ink)]">Appointments</h3>
        </div>
        {appointments.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--ink-soft)]">No appointments yet.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col gap-3 rounded-[24px] bg-white/45 px-4 py-4 sm:flex-row sm:items-center">
                <div className="min-w-[94px]">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                    {new Date(appointment.starts_at).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                    {new Date(appointment.starts_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--ink)]">{appointment.title}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{appointment.services?.name}</p>
                </div>
                <span
                  className={`chip capitalize ${
                    appointment.status === 'confirmed'
                      ? 'chip-teal'
                      : appointment.status === 'cancelled'
                      ? 'chip-accent'
                      : ''
                  }`}
                >
                  {appointment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
