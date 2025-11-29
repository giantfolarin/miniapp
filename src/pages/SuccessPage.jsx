import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SuccessPage() {
  const params = useParams()
  const navigate = useNavigate()
  const uniqueId = params.uniqueId
  const [user, setUser] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const shareUrl = `${window.location.origin}/u/${uniqueId}`

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

      setUser(data)
      setLoading(false)
    }

    fetchUser()
  }, [uniqueId, navigate])

  const copyToClipboard = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        return
      }

      // Fallback for iframe/miniapp contexts
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl
      textarea.style.position = 'fixed'
      textarea.style.left = '-999999px'
      textarea.style.top = '-999999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()

      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (execErr) {
        console.error('execCommand copy failed:', execErr)
        alert('Failed to copy. Please copy manually: ' + shareUrl)
      } finally {
        document.body.removeChild(textarea)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy. Please copy manually: ' + shareUrl)
    }
  }

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Drop me your honest thoughts anonymously! 💭\n${shareUrl}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  const shareToInstagram = () => {
    alert('Copy your link and share it in your Instagram story or bio!')
    copyToClipboard()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3">
      <div className="w-full max-w-md">
        <div className="relative">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 px-8 py-3 rounded-full shadow-2xl">
              <h1 className="text-2xl font-bold text-white whitespace-nowrap">Secret Message</h1>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-3xl p-1 mt-6">
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-3xl p-6 pt-12">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  🎉 Your Link has been Generated
                </h2>
                <p className="text-base text-white italic">
                  Share it and start receiving honest feedback:
                </p>
              </div>

              <div className="bg-white rounded-xl p-3 mb-4 break-all text-center">
                <span className="text-gray-700 font-mono text-xs">{shareUrl}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={shareToTwitter}
                  className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600
                           text-white font-bold py-3 px-4 rounded-xl text-sm
                           transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>𝕏</span>Share on X
                </button>

                <button
                  onClick={copyToClipboard}
                  className="bg-gradient-to-r from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500
                           text-gray-800 font-bold py-3 px-4 rounded-xl text-sm
                           transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>📋</span>{copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              <button
                onClick={shareToInstagram}
                className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-600
                         text-white font-bold py-3 px-4 rounded-xl text-sm
                         transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
              >
                <span>📸</span>Post to IG Story
              </button>

              <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-white/20">
                <button
                  onClick={() => navigate(`/u/${uniqueId}/messages`)}
                  className="w-full bg-white/10 hover:bg-white/20 border-2 border-white/30
                           text-white font-semibold py-2 px-4 rounded-xl text-sm
                           transform hover:scale-105 transition-all duration-300"
                >
                  📬 Check My Inbox
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="text-white hover:text-purple-200 text-center transition-colors text-sm"
                >
                  Generate new link →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
