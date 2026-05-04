'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ShopDetail() {
  const router = useRouter()
  const params = useParams()
  const shopId = params.id as string
  const [shop, setShop] = useState<any>(null)
  const [workers, setWorkers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'rota' | 'cashup'>('overview')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const supabase = await createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/login'); return }
      setUser(u)

      const { data: shopData } = await supabase.from('shops').select('*').eq('id', shopId).single()
      if (!shopData) { router.push('/dashboard'); return }
      setShop(shopData)

      const { data: workersData } = await supabase.from('shop_workers').select('*').eq('shop_id', shopId).order('name')
      setWorkers(workersData || [])
      setLoading(false)
    }
    load()
  }, [shopId])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shop?.name}</h1>
            <p className="text-gray-500 text-sm">{shop?.address || 'No address set'}</p>
          </div>
          <div className="flex gap-2">
            <a href={`/shops/${shopId}/settings`} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
              Settings
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b mb-6">
          {(['overview', 'staff', 'rota', 'cashup'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Staff</h3>
                <p className="text-4xl font-bold text-gray-900 mt-2">{workers.length}</p>
                <p className="text-sm text-gray-500 mt-1">team members</p>
              </div>
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">This Week</h3>
                <p className="text-4xl font-bold text-gray-900 mt-2">—</p>
                <p className="text-sm text-gray-500 mt-1">view rota</p>
              </div>
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Last Cashup</h3>
                <p className="text-4xl font-bold text-gray-900 mt-2">—</p>
                <p className="text-sm text-gray-500 mt-1">no data yet</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="flex gap-3">
                <button onClick={() => setActiveTab('staff')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  + Add Staff Member
                </button>
                <button onClick={() => setActiveTab('cashup')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Record Cashup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                + Add Staff Member
              </button>
            </div>

            {workers.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center">
                <p className="text-gray-500 mb-4">No staff members yet.</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  + Add First Staff Member
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">PIN</th>
                      <th className="text-left px-6 py-3 text-sm font-sm font-medium text-gray-500">Hourly Rate</th>
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
                          <button className="text-blue-600 hover:underline text-sm">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Rota Tab */}
        {activeTab === 'rota' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Staff Rota</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                  ← Prev Week
                </button>
                <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                  Next Week →
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-8 text-center">
              <p className="text-gray-500">No rota set for this week.</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                + Create This Week's Rota
              </button>
            </div>
          </div>
        )}

        {/* Cashup Tab */}
        {activeTab === 'cashup' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Cashups</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                + Record Cashup
              </button>
            </div>
            <div className="bg-white rounded-xl border p-8 text-center">
              <p className="text-gray-500">No cashups recorded yet.</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                + Record First Cashup
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}