import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('*, businesses(name)')
    .eq('id', user.id)
    .single()

  const { data: shops } = await supabase
    .from('shops')
    .select('*')
    .eq('business_id', userProfile?.business_id)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">OpsBoard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm text-red-600 hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {userProfile?.businesses?.name || 'Your Business'}
        </h2>
        <p className="text-gray-500 mb-8">
          Welcome back — here's your overview.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Shops</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">{shops?.length ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">active locations</p>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">This Week</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">—</p>
            <p className="text-sm text-gray-500 mt-1">view rota to see</p>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Last Cashup</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">—</p>
            <p className="text-sm text-gray-500 mt-1">no data yet</p>
          </div>
        </div>

        {shops && shops.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Shops</h3>
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Address</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shops.map((shop: any) => (
                    <tr key={shop.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{shop.name}</td>
                      <td className="px-6 py-4 text-gray-500">{shop.address || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <a href={`/shops/${shop.id}`} className="text-blue-600 hover:underline text-sm">
                          Manage →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(!shops || shops.length === 0) && (
          <div className="mt-8 bg-white rounded-xl border p-8 text-center">
            <p className="text-gray-500 mb-4">No shops yet — add your first location.</p>
            <a href="/shops/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              + Add Shop
            </a>
          </div>
        )}
      </main>
    </div>
  )
}