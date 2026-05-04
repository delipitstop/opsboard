'use client'

import { useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Payout = { description: string; amount: string }

const DELIVERY_SERVICES = [
  { key: 'deliveroo', label: 'Deliveroo' },
  { key: 'just_eat', label: 'Just Eat' },
  { key: 'tgtg', label: 'TooGoodToGo' },
]

export default function RecordCashup() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const shopId = params.id as string
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    trn: searchParams.get('week') || today,
    z_cash: '',
    z_card: '',
    deliveroo: '',
    just_eat: '',
    tgtg: '',
  })

  const [enabledServices, setEnabledServices] = useState<Record<string, boolean>>({
    deliveroo: true,
    just_eat: true,
    tgtg: true,
  })

  const [payouts, setPayouts] = useState<Payout[]>([{ description: '', amount: '' }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const toggleService = (key: string) =>
    setEnabledServices(s => ({ ...s, [key]: !s[key] }))

  const addPayout = () => setPayouts(p => [...p, { description: '', amount: '' }])

  const removePayout = (index: number) => setPayouts(p => p.filter((_, i) => i !== index))

  const updatePayout = (index: number, field: keyof Payout, value: string) => {
    setPayouts(p => p.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const zCash = parseFloat(form.z_cash) || 0
  const zCard = parseFloat(form.z_card) || 0
  const totalPayouts = payouts.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const banking = zCash - totalPayouts

  const deliveryIncome = DELIVERY_SERVICES.reduce((sum, s) => {
    if (enabledServices[s.key]) return sum + (parseFloat(form[s.key as keyof typeof form] as string) || 0)
    return sum
  }, 0)

  const gross = zCash + zCard + deliveryIncome

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const trnStr = form.trn // already YYYY-MM-DD
    const trnDate = new Date(trnStr + 'T00:00:00')

    const { error: cashupError } = await supabase.from('cashups').upsert({
      shop_id: shopId,
      trn: trnDate,
      z_cash: zCash,
      z_card: zCard,
      deliveroo: enabledServices.deliveroo ? (parseFloat(form.deliveroo) || 0) : 0,
      just_eat: enabledServices.just_eat ? (parseFloat(form.just_eat) || 0) : 0,
      tgtg: enabledServices.tgtg ? (parseFloat(form.tgtg) || 0) : 0,
    }, { onConflict: 'shop_id,trn' })

    if (cashupError) {
      setError(cashupError.message)
      setLoading(false)
      return
    }

    // Replace payouts
    await supabase.from('cashup_payouts').delete().eq('shop_id', shopId).eq('trn', trnStr)
    const validPayouts = payouts.filter(p => p.description.trim() && parseFloat(p.amount) > 0)
    if (validPayouts.length > 0) {
      const payoutRows = validPayouts.map(p => ({
        shop_id: shopId,
        trn: trnStr,
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
          <a href={`/shops/${shopId}?tab=cashup`} className="text-sm text-gray-500 hover:text-gray-700">← Back</a>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Record Cashup</h1>
          <p className="text-gray-500 text-sm">Enter income and payouts for the day.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
          )}

          {/* Date */}
          <div className="bg-white rounded-xl border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
            <input type="date" value={form.trn} onChange={e => update('trn', e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Income */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Income</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Z Cash (£)</label>
                <input type="number" step="0.01" min="0" value={form.z_cash}
                  onChange={e => update('z_cash', e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Z Card (£)</label>
                <input type="number" step="0.01" min="0" value={form.z_card}
                  onChange={e => update('z_card', e.target.value)} placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Delivery Platforms</h4>
                <button type="button" onClick={() => setEnabledServices({ deliveroo: true, just_eat: true, tgtg: true })}
                  className="text-xs text-blue-600 hover:underline">Enable all</button>
              </div>

              {DELIVERY_SERVICES.map(service => (
                <div key={service.key} className="flex items-center gap-3 mb-2">
                  <input type="checkbox"
                    checked={enabledServices[service.key]}
                    onChange={() => toggleService(service.key)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label className="text-sm text-gray-700 flex-1">{service.label}</label>
                  {enabledServices[service.key] ? (
                    <input type="number" step="0.01" min="0"
                      value={form[service.key as keyof typeof form]}
                      onChange={e => update(service.key, e.target.value)} placeholder="£0.00"
                      className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  ) : (
                    <span className="w-28 text-xs text-gray-400 text-right">Disabled</span>
                  )}
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
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  {payouts.length > 1 && (
                    <button type="button" onClick={() => removePayout(index)}
                      className="text-red-400 hover:text-red-600 text-sm font-bold px-2">✕</button>
                  )}
                </div>
              ))}
            </div>

            {totalPayouts > 0 && (
              <div className="bg-red-50 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-red-700 font-medium">Total Payouts</span>
                <span className="text-base font-bold text-red-900">-£{totalPayouts.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Banking */}
          <div className="bg-white rounded-xl border p-6 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Banking</h3>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Z Cash</span>
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

          {/* Actions */}
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