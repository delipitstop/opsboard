'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CashupTab({ shopId }: { shopId: string }) {
  const [cashups, setCashups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = await createClient()
      const { data } = await supabase
        .from('cashups')
        .select('*')
        .eq('shop_id', shopId)
        .order('trn', { ascending: false })
        .limit(30)
      setCashups(data || [])
      setLoading(false)
    }
    load()
  }, [shopId])

  if (loading) return <div className="text-gray-500 py-8 text-center">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Cashup History</h2>
        <a href={`/shops/${shopId}/cashup/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Record Cashup
        </a>
      </div>

      {cashups.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-gray-500 mb-4">No cashups recorded yet.</p>
          <a href={`/shops/${shopId}/cashup/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Record First Cashup
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Gross</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Cash</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Card</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Deliveroo</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Just Eat</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">TGTG</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Wages</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Security</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cashups.map((c: any) => {
                const gross = (c.z_cash || 0) + (c.z_card || 0) + (c.deliveroo || 0) + (c.just_eat || 0) + (c.tgtg || 0)
                const date = new Date(c.trn + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{date}</td>
                    <td className="px-5 py-3.5 text-sm text-right font-semibold">£{gross.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-sm text-right text-gray-600">£{(c.z_cash || 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-sm text-right text-gray-600">£{(c.z_card || 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-sm text-right text-gray-600">£{(c.deliveroo || 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-sm text-right text-gray-600">£{(c.just_eat || 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-sm text-right text-gray-600">£{(c.tgtg || 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-sm text-right text-gray-600">£{(c.wage_total || 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-sm text-right text-gray-600">£{(c.security || 0).toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}