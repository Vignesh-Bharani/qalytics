import { useState } from 'react'
import { authAPI } from '../services/api'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setIsLoading(true)
    try {
      const response = await authAPI.signup({ email, password, username, full_name: fullName })
      setSuccessMsg('Signup successful! You can now log in.')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Signup failed. Please check your details.')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      <form onSubmit={submit} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-900 rounded-xl mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold">Sign Up for QAlytics</h2>
          <p className="text-gray-600 mt-2">Quality Analytics & Metrics Platform</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input type="text" value={username} onChange={e=>setUsername(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required/>
          </div>
          {error && (<div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>)}
          {successMsg && (<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{successMsg}</div>)}
          <button type="submit" disabled={isLoading} className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl py-3 transition-colors flex items-center justify-center">
            {isLoading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Signing Up...</>) : 'Sign Up'}
          </button>
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <a href="/login" className="text-blue-700 underline">Sign In</a>
        </div>
      </form>
    </div>
  )
}