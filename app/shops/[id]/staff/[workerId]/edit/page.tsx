'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditStaff() {
  const router = useRouter()
  const params = useParams()
  const shopId = params.id as string
  const workerId = params.workerId as string
  const [form, setForm] = useState({ name: '', pin_code: '', hourly_rate: '12.00', active: true })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = await createClient()
      const { data } = await supabase.from('shop_workers').select('*').eq('id', workerId).single()
      if (data) {
        setForm({
          name: data.name || '',
          pin_code: data.pin_code || '',
          hourly_rate: parseFloat(data.hourly_rate || '12.00').toFixed(2),
          active: data.active !== false,
        })
      }
    }
    load()
  }, [workerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = await createClient()

    const { error: updateError } = await supabase.from('shop_workers').update({
      name: form.name,
      pin_code: form.pin_code || null,
      hourly_rate: parseFloat(form.hourly_rate),
      active: form.active,
    }).eq('id', workerId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      router.push(`/shops/${shopId}?tab=staff`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-xl mx-auto">
          <a href={`/shops/${shopId}?tab=staff`} className="text-sm text-gray-500 hover:text-gray-700">← Back to Staff</a>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Staff Member</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. Jamie Smith"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
            <input
              type="text"
              value={form.pin_code}
              onChange={e => setForm({ ...form, pin_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="4-digit code for clock-in/out"
              maxLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Optional — used by staff to clock in/out</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (£) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.hourly_rate}
              onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={e => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm text-gray-700">Active (can be scheduled)</label>
          </div>

          <div className="flex gap-3 pt-2">
            <a href={`/shops/${shopId}?tab=staff`} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancel
            </a>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}