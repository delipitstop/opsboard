'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekStart(d: Date): string {
  return d.toISOString().split('T')[0]
}

export default function CashupTab({ shopId }: { shopId: string }) {
  const [cashups, setCashups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<Date>(() => getWeekStart(new Date()))

  const weekStartStr = formatWeekStart(selectedWeek)

  useEffect(() => {
    async function load() {
      const supabase = await createClient()
      const { data } = await supabase
        .from('cashups')
        .select('*, cashup_payouts(description, amount)')
        .eq('shop_id', shopId)
        .order('trn', { ascending: false })
      setCashups(data || [])
      setLoading(false)
    }
    load()
  }, [shopId])

  const weekEnd = new Date(selectedWeek)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const weekCashups = cashups.filter(c => {
    const d = new Date(c.trn + 'T00:00:00')
    const ws = selectedWeek.getTime()
    const we = weekEnd.getTime() + 86400000
    return d.getTime() >= ws && d.getTime() < we
  })

  const prevWeek = () => {
    const d = new Date(selectedWeek)
    d.setDate(d.getDate() - 7)
    setSelectedWeek(d)
  }

  const nextWeek = () => {
    const d = new Date(selectedWeek)
    d.setDate(d.getDate() + 7)
    setSelectedWeek(d)
  }

  const totals = weekCashups.reduce((acc, c) => {
    const payoutTotal = (c.cashup_payouts || []).reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0)
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

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const weekLabel = `${formatDate(selectedWeek)} – ${formatDate(weekEnd)}`

  if (loading) return <div className="text-gray-500 py-8 text-center">Loading...</div>

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center gap-4">
        <button onClick={prevWeek}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 font-medium">
          ← Prev
        </button>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Week Commencing</p>
          <p className="text-base font-semibold text-gray-900">{weekLabel}</p>
        </div>
        <button onClick={nextWeek}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 font-medium">
          Next →
        </button>
      </div>

      <div className="flex justify-end">
        <a href={`/shops/${shopId}/cashup/new?week=${weekStartStr}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Record Cashup
        </a>
      </div>

      {weekCashups.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-gray-500 mb-4">No cashups for this week.</p>
          <a href={`/shops/${shopId}/cashup/new?week=${weekStartStr}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Record Cashup
          </a>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Cash</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Card</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Deliveroo</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Just Eat</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">TGTG</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Payouts</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Banking</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {weekCashups.map((c: any) => {
                  const payoutTotal = (c.cashup_payouts || []).reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0)
                  const banking = (parseFloat(c.z_cash) || 0) - payoutTotal
                  const date = new Date(c.trn + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{date}</td>
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
                  <td className="px-4 py-3 text-sm font-bold text-green-800">Week Total</td>
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
        </>
      )}
    </div>
  )
}