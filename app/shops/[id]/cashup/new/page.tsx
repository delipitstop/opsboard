'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Payout = { description: string; amount: string }

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
  })

  const [payouts, setPayouts] = useState<Payout[]>( [
    { description: '', amount: '' },
  ])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const addPayout = () => setPayouts(p => [...p, { description: '', amount: '' }])

  const removePayout = (index: number) => setPayouts(p => p.filter((_, i) => i !== index))

  const updatePayout = (index: number, field: keyof Payout, value: string) => {
    setPayouts(p => p.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const gross = (['z_cash', 'z_card', 'deliveroo', 'just_eat', 'tgtg'] as const).reduce(
    (sum, f) => sum + (parseFloat(form[f]) || 0), 0
  )

  const totalPayouts = payouts.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const zCash = parseFloat(form.z_cash) || 0
  const banking = zCash - totalPayouts

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = await createClient()
    const trnDate = new Date(form.trn + 'T00:00:00')

    const { error: cashupError } = await supabase.from('cashups').upsert({
      shop_id: shopId,
      trn: trnDate,
      z_cash: zCash,
      z_card: parseFloat(form.z_card) || 0,
      deliveroo: parseFloat(form.deliveroo) || 0,
      just_eat: parseFloat(form.just_eat) || 0,
      tgtg: parseFloat(form.tgtg) || 0,
      card_tipping: parseFloat(form.card_tipping) || 0,
    }, { onConflict: 'shop_id,trn' })

    if (cashupError) {
      setError(cashupError.message)
      setLoading(false)
      return
    }

    // Save payouts — delete old ones for this date, re-insert
    const { error: deleteError } = await supabase
      .from('cashup_payouts')
      .delete()
      .eq('shop_id', shopId)
      .eq('trn', trnDate)

    const validPayouts = payouts.filter(p => p.description.trim() && parseFloat(p.amount) > 0)
    if (validPayouts.length > 0) {
      const payoutRows = validPayouts.map(p => ({
        shop_id: shopId,
        trn: trnDate,
        description: p.description.trim(),
        amount: parseFloat(p.amount),
      }))

      const { error: payoutError } = await supabase.from('cashup_payouts').insert(payoutRows)
      if (payoutError) {
        setError(payoutError.message)
        setLoading(false)
        return
      }
    }

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input type="date" value={form.trn} onChange={e => update('trn', e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Income */}
          <div className="bg-white rounded-xl border p-6 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Income</h3>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['z_cash', 'Zettle Cash (£)'],
                ['z_card', 'Zettle Card (£)'],
                ['deliveroo', 'Deliveroo (£)'],
                ['just_eat', 'Just Eat (£)'],
                ['tgtg', 'TooGoodToGo (£)'],
                ['card_tipping', 'Card Tipping (£)'],
              ] as const).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input type="number" step="0.01" min="0" value={form[field]}
                    onChange={e => update(field, e.target.value)} placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              ))}
            </div>
            <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm text-blue-700 font-medium">Gross Takings</span>
              <span className="text-lg font-bold text-blue-900">£{gross.toFixed(2)}</span>
            </div>
          </div>

          {/* Payouts */}
          <div className="bg-white rounded-xl border p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Payouts</h3>
              <button type="button" onClick={addPayout}
                className="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 font-medium">
                + Add Payout
              </button>
            </div>

            <div className="space-y-2">
              {payouts.map((payout, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input type="text" value={payout.description}
                    onChange={e => updatePayout(index, 'description', e.target.value)}
                    placeholder="Description (e.g. Cash, Tips, Supplies)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  <input type="number" step="0.01" min="0" value={payout.amount}
                    onChange={e => updatePayout(index, 'amount', e.target.value)}
                    placeholder="£0.00"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  {payouts.length > 1 && (
                    <button type="button" onClick={() => removePayout(index)}
                      className="text-red-400 hover:text-red-600 text-sm font-bold px-2">✕</button>
                  )}
                </div>
              ))}
            </div>

            {payouts.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-red-700 font-medium">Total Payouts</span>
                <span className="text-base font-bold text-red-900">£{totalPayouts.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Banking */}
          <div className="bg-white rounded-xl border p-6 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Banking</h3>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Zettle Cash</span>
              <span className="text-sm font-medium text-gray-800">£{zCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Payouts</span>
              <span className="text-sm font-medium text-red-600">-£{totalPayouts.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-semibold text-gray-900">Cash to Bank</span>
              <span className={`text-xl font-bold ${banking >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                £{banking.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <a href={`/shops/${shopId}?tab=cashup`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancel
            </a>
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