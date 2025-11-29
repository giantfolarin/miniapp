import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function MessagePage() {
  const params = useParams()
  const navigate = useNavigate()
  const uniqueId = params.uniqueId
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('unique_id', uniqueId)
        .single()

      if (error || !data) {
        navigate('/')
        return
      }

      console.log('Fetched user data:', data)
      console.log('User name from database:', `"${data.name}"`)

      setUser(data)
      setLoading(false)
    }

    fetchUser()
  }, [uniqueId, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!message.trim()) return

    setSubmitting(true)

    try {
      console.log('Saving anonymous message to database')

      const { data, error: dbError } = await supabase
        .from('messages')
        .insert([{
          user_id: user.id,
          message: message.trim(),
          tx_hash: null,
          sender_address: null
        }])
        .select()

      if (dbError) {
        console.error('Database error:', dbError)
        alert(`Failed to send message: ${dbError.message}`)
        setSubmitting(false)
        return
      }

      console.log('✅ Message sent successfully:', data)
      setSubmitted(true)
      setMessage('')
      setSubmitting(false)
    } catch (err) {
      console.error('Error sending message:', err)
      alert(`Failed to send message: ${err.message}`)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 px-8 py-3 rounded-full shadow-2xl">
                <h1 className="text-2xl font-bold text-white whitespace-nowrap">Message Board</h1>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-3xl p-1 mt-6">
              <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-3xl p-6 pt-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-white mb-3">Submitted Successfully!</h2>
                <p className="text-white/80 mb-6">Your thoughts have been delivered anonymously to {user?.name}.</p>

                <button
                  onClick={() => setSubmitted(false)}
                  className="glow-button py-3 px-8 rounded-xl text-white font-semibold"
                >
                  Drop Another Thought
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="block w-full text-white hover:text-purple-200 text-center transition-colors text-sm mt-4"
                >
                  Get your own link →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3">
      <div className="w-full max-w-md">
        <div className="relative">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 px-8 py-3 rounded-full shadow-2xl">
              <h1 className="text-2xl font-bold text-white whitespace-nowrap">Message Board</h1>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-3xl p-1 mt-6">
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-3xl p-6 pt-16">
              <div className="space-y-3 mb-6 text-white text-sm">
                <p>• Share whatever you have in mind with <span className="font-semibold">{user?.name}</span> without revealing yourself.</p>
                <p>• Drop a confession, compliment, or question, your identity stays completely hidden.</p>
                <p>• <span className="font-semibold">{user?.name}</span> will never know who message.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter Your Thought"
                    className="w-full px-4 py-3 bg-white text-gray-700 placeholder-gray-400 rounded-xl
                             focus:outline-none focus:ring-4 focus:ring-purple-400/50 transition-all duration-300
                             min-h-[120px] resize-none"
                    maxLength={1000}
                    disabled={submitting}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {message.length}/1000
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!message.trim() || submitting}
                  className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600
                           text-white font-bold py-3 px-6 rounded-xl text-lg
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transform hover:scale-105 transition-all duration-300 shadow-xl"
                >
                  {submitting ? 'Sending...' : 'Submit Anonymously'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/20 text-center">
                <p className="text-white/60 text-xs flex items-center justify-center gap-2">
                  <span>🔒</span>Fully Anonymous & Secure
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="text-white hover:text-purple-200 text-center transition-colors text-sm mt-3"
                >
                  Get your own link →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
