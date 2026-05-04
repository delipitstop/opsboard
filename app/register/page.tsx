'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Register() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ businessName: '', email: '', password: '', shopName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = await createClient()
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Registration failed. Please try again.')
      setLoading(false)
      return
    }

    // Create the business record
    const { error: bizError } = await supabase.from('businesses').insert({
      id: authData.user.id,
      name: form.businessName,
      contact_email: form.email,
    })

    if (bizError) {
      setError(`Account created but business setup failed: ${bizError.message}`)
      setLoading(false)
      return
    }

    // Create the user record (links auth user to the business)
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      business_id: authData.user.id,
      name: form.businessName,
      role: 'owner',
    })

    if (userError) {
      setError(`Account created but user setup failed: ${userError.message}`)
      setLoading(false)
      return
    }

    // Create the first shop
    const { error: shopError } = await supabase.from('shops').insert({
      business_id: authData.user.id,
      name: form.shopName,
    })

    if (shopError) {
      setError(`Account and business created but first shop setup failed: ${shopError.message}`)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">OpsBoard</h1>
        <p className="text-sm text-gray-500 mb-8">Register your business</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              value={form.businessName}
              onChange={e => setForm({ ...form, businessName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. The Ale House Ltd"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Shop Name</label>
            <input
              type="text"
              value={form.shopName}
              onChange={e => setForm({ ...form, shopName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. London Bridge"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="you@business.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Min 8 characters"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}