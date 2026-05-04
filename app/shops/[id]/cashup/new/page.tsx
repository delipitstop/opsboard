'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RecordCashup() {
  const router = useRouter()
  const params = useParams()
  const shopId = params.id as string
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    trn: today,
    z_cash: '',
    z_card: '',
    deliveroo: '',
    just_eat: '',
    tgtg: '',
    card_tipping: '',
    wage_total: '',
    security: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const gross = (['z_cash', 'z_card', 'deliveroo', 'just_eat', 'tgtg'] as const).reduce(
    (sum, f) => sum + (parseFloat(form[f]) || 0), 0
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = await createClient()

    const trnDate = new Date(form.trn + 'T00:00:00')

    const { error: cashupError } = await supabase.from('cashups').upsert({
      shop_id: shopId,
      trn: trnDate,
      z_cash: parseFloat(form.z_cash) || 0,
      z_card: parseFloat(form.z_card) || 0,
      deliveroo: parseFloat(form.deliveroo) || 0,
      just_eat: parseFloat(form.just_eat) || 0,
      tgtg: parseFloat(form.tgtg) || 0,
      card_tipping: parseFloat(form.card_tipping) || 0,
      wage_total: parseFloat(form.wage_total) || 0,
      security: parseFloat(form.security) || 0,
    }, { onConflict: 'shop_id,trn' })

    if (cashupError) {
      setError(cashupError.message)
      setLoading(false)
      return
    }

    // Also update daily sales
    await supabase.from('sales_daily').upsert({
      shop_id: shopId,
      date: trnDate,
      gross_takings: gross,
      cash_taken: parseFloat(form.z_cash) || 0,
      wage_bill: parseFloat(form.wage_total) || 0,
    }, { onConflict: 'shop_id,date' })

    router.push(`/shops/${shopId}?tab=cashup`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-xl mx-auto">
          <a href={`/shops/${shopId}?tab=cashup`} className="text-sm text-gray-500 hover:text-gray-700">← Back to Cashups</a>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Record Cashup</h1>
        <p className="text-gray-500 text-sm mb-6">Enter all income and costs for the day.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input type="date" value={form.trn} onChange={e => update('trn', e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Income Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Income</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Zettle Cash (£)</label>
                <input type="number" step="0.01" min="0" value={form.z_cash}
                  onChange={e => update('z_cash', e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Zettle Card (£)</label>
                <input type="number" step="0.01" min="0" value={form.z_card}
                  onChange={e => update('z_card', e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Deliveroo (£)</label>
                <input type="number" step="0.01" min="0" value={form.deliveroo}
                  onChange={e => update('deliveroo', e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Just Eat (£)</label>
                <input type="number" step="0.01" min="0" value={form.just_eat}
                  onChange={e => update('just_eat', e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">TooGoodToGo (£)</label>
                <input type="number" step="0.01" min="0" value={form.tgtg}
                  onChange={e => update('tgtg', e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Card Tipping (£)</label>
                <input type="number" step="0.01" min="0" value={form.card_tipping}
                  onChange={e => update('card_tipping', e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm text-blue-700 font-medium">Gross Takings</span>
              <span className="text-lg font-bold text-blue-900">£{gross.toFixed(2)}</span>
            </div>
          </div>

          {/* Costs Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Costs</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Wage Total (£)</label>
                <input type="number" step="0.01" min="0" value={form.wage_total}
                  onChange={e => update('wage_total', e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Security (£)</label>
                <input type="number" step="0.01" min="0" value={form.security}
                  onChange={e => update('security', e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <a href={`/shops/${shopId}?tab=cashup`} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</a>
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Cashup'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}