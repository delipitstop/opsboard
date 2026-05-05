'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function StaffTab({ shopId }: { shopId: string }) {
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = await createClient()
      const { data } = await supabase
        .from('shop_workers')
        .select('*')
        .eq('shop_id', shopId)
        .order('name')
      setWorkers(data || [])
      setLoading(false)
    }
    load()
  }, [shopId])

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
        <a href={`/shops/${shopId}/staff/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Staff Member
        </a>
      </div>

      {workers.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-gray-500 mb-4">No staff members yet.</p>
          <a href={`/shops/${shopId}/staff/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Add First Staff Member
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">PIN</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Hourly Rate</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {workers.map((worker: any) => (
                <tr key={worker.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{worker.name}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono">{worker.pin_code || '—'}</td>
                  <td className="px-6 py-4 text-gray-500">£{parseFloat(worker.hourly_rate || '0').toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      worker.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {worker.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a href={`/shops/${shopId}/staff/${worker.id}/edit`}
                      className="text-blue-600 hover:underline text-sm">
                      Edit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}