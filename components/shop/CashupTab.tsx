'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── Date helpers ────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function parseYMD(s: string): [number, number, number] {
  const [y, m, d] = s.split('-').map(Number)
  return [y, m, d]
}

function fmt(y: number, m: number, d: number): string {
  return String(d).padStart(2, '0') + ' ' + MONTHS[m - 1]
}

function getWeekStart(s: string): string {
  const [y, m, d] = parseYMD(s)
  const dow = new Date(y, m - 1, d).getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const mon = new Date(y, m - 1, d + diff)
  return String(mon.getFullYear()) + '-' +
    String(mon.getMonth() + 1).padStart(2, '0') + '-' +
    String(mon.getDate()).padStart(2, '0')
}

function addWeeks(s: string, n: number): string {
  const [y, m, d] = parseYMD(s)
  const r = new Date(y, m - 1, d + n * 7)
  return String(r.getFullYear()) + '-' +
    String(r.getMonth() + 1).padStart(2, '0') + '-' +
    String(r.getDate()).padStart(2, '0')
}

function fmtRange(ws: string) {
  const [y, m, d] = parseYMD(ws)
  const end = new Date(y, m - 1, d + 6)
  return { start: fmt(y, m, d), end: fmt(end.getFullYear(), end.getMonth() + 1, end.getDate()) }
}

function today(): string {
  const d = new Date()
  return String(d.getFullYear()) + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CashupTab({ shopId, refreshKey }: { shopId: string; refreshKey?: number }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Use URL param if valid, otherwise default to current week
  // This is read from URL on every render — no staleness possible
  const weekParam = searchParams.get('week')
  const weekStart = (weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam))
    ? weekParam
    : getWeekStart(today())

  const [cashups, setCashups] = useState<any[]>([])
  const [payouts, setPayouts] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Navigate to a specific week
  function navigateToWeek(ws: string) {
    const url = new URL(window.location.href)
    url.searchParams.set('week', ws)
    // Preserve tab=cashup
    url.searchParams.set('tab', 'cashup')
    router.push(url.pathname + '?' + url.searchParams.toString())
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      const supabase = await createClient()
      const end = addWeeks(weekStart, 1)
      const { data, error: err } = await supabase
        .from('cashups')
        .select('id, trn, z_cash, z_card, deliveroo, just_eat, tgtg')
        .eq('shop_id', shopId)
        .gte('trn', weekStart)
        .lt('trn', end)
        .order('trn', { ascending: true })

      if (err) { setError(err.message); setLoading(false); return }
      setCashups(data || [])

      if (data && data.length > 0) {
        const { data: rows } = await supabase
          .from('cashup_payouts')
          .select('trn, description, amount')
          .eq('shop_id', shopId)
          .in('trn', data.map((c: any) => c.trn))

        const map: Record<string, any[]> = {}
        ;(rows || []).forEach((p: any) => {
          if (!map[p.trn]) map[p.trn] = []
          map[p.trn].push(p)
        })
        setPayouts(map)
      } else {
        setPayouts({})
      }
      setLoading(false)
    }
    load()
  }, [shopId, weekStart, refreshKey])

  const totals = cashups.reduce((acc, c) => {
    const ps = payouts[c.trn] || []
    const pt = ps.reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0)
    return {
      z_cash: acc.z_cash + (parseFloat(c.z_cash) || 0),
      z_card: acc.z_card + (parseFloat(c.z_card) || 0),
      deliveroo: acc.deliveroo + (parseFloat(c.deliveroo) || 0),
      just_eat: acc.just_eat + (parseFloat(c.just_eat) || 0),
      tgtg: acc.tgtg + (parseFloat(c.tgtg) || 0),
      payouts: acc.payouts + pt,
      banking: acc.banking + (parseFloat(c.z_cash) || 0) - pt,
    }
  }, { z_cash: 0, z_card: 0, deliveroo: 0, just_eat: 0, tgtg: 0, payouts: 0, banking: 0 })

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">Error: {error}</div>

  return (
    <div className="space-y-4">
      {/* Week Navigator */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateToWeek(addWeeks(weekStart, -1))}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 font-medium">
          ← Prev
        </button>
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Week Commencing</p>
          <p className="text-base font-bold text-gray-900">{fmtRange(weekStart).start}</p>
          <p className="text-xs text-gray-400">– {fmtRange(weekStart).end}</p>
        </div>
        <button
          onClick={() => navigateToWeek(addWeeks(weekStart, 1))}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 font-medium">
          Next →
        </button>
      </div>

      {/* Record Cashup */}
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
                const pt = ps.reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0)
                const banking = (parseFloat(c.z_cash) || 0) - pt
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{c.trn}</td>
                    <td className="px-3 py-3 text-sm text-right">£{(parseFloat(c.z_cash) || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right">£{(parseFloat(c.z_card) || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right">£{(parseFloat(c.deliveroo) || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right">£{(parseFloat(c.just_eat) || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right">£{(parseFloat(c.tgtg) || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right text-red-600">-£{pt.toFixed(2)}</td>
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