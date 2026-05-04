'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewShop() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ name: '', address: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabaseClient = await createClient()

    // Get current user and their business_id
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: userProfile } = await supabaseClient
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.business_id) {
      setError('No business found. Please contact support.')
      setLoading(false)
      return
    }

    const { error: shopError } = await supabaseClient.from('shops').insert({
      business_id: userProfile.business_id,
      name: form.name,
      address: form.address,
    })

    if (shopError) {
      setError(shopError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-xl mx-auto">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Back to dashboard</a>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Shop</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. Fleet Street"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. 123 Fleet Street, London"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <a href="/dashboard" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancel
            </a>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Shop'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}