'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function getWeekStart(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date.toISOString().split('T')[0]
}

function prevWeek(weekStr: string): string {
  const d = new Date(weekStr + 'T00:00:00')
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}

function nextWeek(weekStr: string): string {
  const d = new Date(weekStr + 'T00:00:00')
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CashupTab({ shopId }: { shopId: string }) {
  const [cashups, setCashups] = useState<any[]>([])
  const [payouts, setPayouts] = useState<Record<string, any[]>>({})
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const weekEnd = new Date(weekStart + 'T00:00:00')
  weekEnd.setDate(weekEnd.getDate() + 6)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      const supabase = await createClient()

      const end = new Date(weekStart + 'T00:00:00')
      end.setDate(end.getDate() + 7)

      const { data, error: err } = await supabase
        .from('cashups')
        .select('id, trn, z_cash, z_card, deliveroo, just_eat, tgtg')
        .eq('shop_id', shopId)
        .gte('trn', weekStart)
        .lt('trn', end.toISOString().split('T')[0])
        .order('trn', { ascending: true })

      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      setCashups(data || [])

      // Load payouts for these cashups
      if (data && data.length > 0) {
        const trnDates = data.map((c: any) => c.trn)
        const { data: payoutRows } = await supabase
          .from('cashup_payouts')
          .select('trn, description, amount')
          .eq('shop_id', shopId)
          .in('trn', trnDates)

        const payoutMap: Record<string, any[]> = {}
        ;(payoutRows || []).forEach((p: any) => {
          if (!payoutMap[p.trn]) payoutMap[p.trn] = []
          payoutMap[p.trn].push(p)
        })
        setPayouts(payoutMap)
      } else {
        setPayouts({})
      }

      setLoading(false)
    }
    load()
  }, [shopId, weekStart])

  const totals = cashups.reduce((acc, c) => {
    const ps = payouts[c.trn] || []
    const payoutTotal = ps.reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0)
    return {
      z_cash: acc.z_cash + (parseFloat(c.z_cash) || 0),
      z_card: acc.z_card + (parseFloat(c.z_card) || 0),
      deliveroo: acc.deliveroo + (parseFloat(c.deliveroo) || 0),
      just_eat: acc.just_eat + (parseFloat(c.just_eat) || 0),
      tgtg: acc.tgtg + (parseFloat(c.tgtg) || 0),
      payouts: acc.payouts + payoutTotal,
      banking: acc.banking + (parseFloat(c.z_cash) || 0) - payoutTotal,
    }
  }, { z_cash: 0, z_card: 0, deliveroo: 0, just_eat: 0, tgtg: 0, payouts: 0, banking: 0 })

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">Error: {error}</div>

  return (
    <div className="space-y-4">
      {/* Week Navigator */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekStart(prevWeek(weekStart))}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 font-medium">
          ← Prev
        </button>
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Week Commencing</p>
          <p className="text-base font-bold text-gray-900">{fmtDate(new Date(weekStart + 'T00:00:00'))}</p>
          <p className="text-xs text-gray-400">– {fmtDate(weekEnd)}</p>
        </div>
        <button onClick={() => setWeekStart(nextWeek(weekStart))}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 font-medium">
          Next →
        </button>
      </div>

      {/* Add Cashup */}
      <div className="flex justify-end">
        <a href={`/shops/${shopId}/cashup/new?date=${weekStart}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Record Cashup
        </a>
      </div>

      {/* Empty State */}
      {cashups.length === 0 && (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-gray-500 mb-4">No cashups for this week.</p>
          <a href={`/shops/${shopId}/cashup/new?date=${weekStart}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Record Cashup
          </a>
        </div>
      )}

      {/* Cashup Table */}
      {cashups.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Date', 'Z', 'Z Card', 'Deliveroo', 'Just Eat', 'TGTG', 'Payouts', 'Banking'].map(h => (
                  <th key={h} className={`px-3 py-3 text-xs font-medium text-gray-500 uppercase ${h === 'Date' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {cashups.map((c: any) => {
                const ps = payouts[c.trn] || []
                const payoutTotal = ps.reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0)
                const banking = (parseFloat(c.z_cash) || 0) - payoutTotal
                const d = new Date(c.trn + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{d}</td>
                    <td className="px-3 py-3 text-sm text-right">£{(parseFloat(c.z_cash) || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right">£{(parseFloat(c.z_card) || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right">£{(parseFloat(c.deliveroo) || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right">£{(parseFloat(c.just_eat) || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right">£{(parseFloat(c.tgtg) || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right text-red-600">-£{payoutTotal.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right font-semibold text-gray-900">£{banking.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-green-50 border-t-2 border-green-200">
                <td className="px-3 py-3 text-sm font-bold text-green-800">Week Total</td>
                <td className="px-3 py-3 text-sm text-right font-bold text-green-800">£{totals.z_cash.toFixed(2)}</td>
                <td className="px-3 py-3 text-sm text-right font-bold text-green-800">£{totals.z_card.toFixed(2)}</td>
                <td className="px-3 py-3 text-sm text-right font-bold text-green-800">£{totals.deliveroo.toFixed(2)}</td>
                <td className="px-3 py-3 text-sm text-right font-bold text-green-800">£{totals.just_eat.toFixed(2)}</td>
                <td className="px-3 py-3 text-sm text-right font-bold text-green-800">£{totals.tgtg.toFixed(2)}</td>
                <td className="px-3 py-3 text-sm text-right font-bold text-green-800">-£{totals.payouts.toFixed(2)}</td>
                <td className="px-3 py-3 text-sm text-right font-bold text-green-800">£{totals.banking.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}