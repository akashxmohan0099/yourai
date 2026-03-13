'use client'

import { useState } from 'react'
import { Plus, Tag, StickyNote, Calendar, X } from 'lucide-react'

interface ClientDetailEnhancedProps {
  client: any
  notes: any[]
  tags: any[]
  appointments: any[]
  tenantId: string
}

export function ClientDetailEnhanced({
  client,
  notes,
  tags,
  appointments,
  tenantId,
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
    <div className="space-y-6">
      {/* Tags */}
      <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-[#86868b]" />
          <h3 className="text-sm font-semibold text-[#1d1d1f]">Tags</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((t: any) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-[#f5f5f7] text-[#424245] text-sm font-medium"
            >
              {t.tag}
              <button
                onClick={() => removeTag(t.id)}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {tags.length === 0 && (
            <span className="text-sm text-[#86868b]">No tags yet</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            placeholder="Add tag..."
            className="flex-1 px-3 py-2 text-sm border border-[#d2d2d7] rounded-xl focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-[#1d1d1f] placeholder:text-[#86868b]"
          />
          <button
            onClick={addTag}
            disabled={saving}
            className="bg-[#1d1d1f] hover:bg-black text-white rounded-xl py-2 px-3 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <StickyNote className="w-4 h-4 text-[#86868b]" />
          <h3 className="text-sm font-semibold text-[#1d1d1f]">Notes</h3>
        </div>
        <div className="space-y-3 mb-4">
          {notes.length === 0 ? (
            <p className="text-sm text-[#86868b]">No notes yet</p>
          ) : (
            notes.map((n: any) => (
              <div
                key={n.id}
                className="bg-[#f5f5f7] rounded-xl px-4 py-3 text-sm"
              >
                <p className="text-[#424245] leading-relaxed">{n.note}</p>
                <p className="text-xs text-[#86868b] mt-1.5">
                  {n.source === 'ai' ? 'Added by AI' : 'Manual'} ·{' '}
                  {new Date(n.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="flex-1 px-3 py-2 text-sm border border-[#d2d2d7] rounded-xl resize-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-[#1d1d1f] placeholder:text-[#86868b]"
          />
          <button
            onClick={addNote}
            disabled={saving || !newNote.trim()}
            className="bg-[#1d1d1f] hover:bg-black text-white rounded-xl py-2.5 px-5 text-sm font-medium disabled:opacity-50 self-end transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-[#86868b]" />
          <h3 className="text-sm font-semibold text-[#1d1d1f]">Appointments</h3>
        </div>
        {appointments.length === 0 ? (
          <p className="text-sm text-[#86868b]">No appointments</p>
        ) : (
          <div className="space-y-2.5">
            {appointments.map((apt: any) => (
              <div
                key={apt.id}
                className="flex items-center gap-3 bg-[#f5f5f7] rounded-xl px-4 py-3"
              >
                <div className="min-w-[80px]">
                  <p className="text-xs font-semibold text-[#1d1d1f]">
                    {new Date(apt.starts_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    {new Date(apt.starts_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="w-px h-8 bg-[#d2d2d7]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#424245]">{apt.title}</p>
                  <p className="text-xs text-[#86868b] mt-0.5">{apt.services?.name}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    apt.status === 'confirmed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : apt.status === 'cancelled'
                      ? 'bg-red-50 text-red-700'
                      : apt.status === 'completed'
                      ? 'bg-[#f5f5f7] text-[#424245]'
                      : 'bg-[#f5f5f7] text-[#424245]'
                  }`}
                >
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
