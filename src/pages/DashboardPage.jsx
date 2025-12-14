import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import html2canvas from 'html2canvas'

// App URL for shared links
const BASE_APP_URL = 'https://secret-message-miniapp.vercel.app'

export default function DashboardPage() {
  const params = useParams()
  const navigate = useNavigate()
  const uniqueId = params.uniqueId
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [shareModal, setShareModal] = useState(false)
  const [shareImageUrl, setShareImageUrl] = useState(null)

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('unique_id', uniqueId)
        .single()

      if (userError || !userData) {
        navigate('/')
        return
      }

      setUser(userData)

      console.log('Fetching messages for user_id:', userData.id)

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })

      console.log('Messages fetched:', messagesData)
      console.log('Messages error:', messagesError)

      if (!messagesError && messagesData) {
        setMessages(messagesData)
      }

      setLoading(false)
    }

    fetchUserAndMessages()

    // Auto-refresh messages every 3 seconds
    const interval = setInterval(fetchUserAndMessages, 3000)
    return () => clearInterval(interval)
  }, [uniqueId, navigate])

  const handleDelete = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    setDeleting(messageId)

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (!error) {
        setMessages(messages.filter(m => m.id !== messageId))
      }
    } catch (err) {
      console.error('Error deleting message:', err)
      alert('Failed to delete message.')
    } finally {
      setDeleting(null)
    }
  }

  const handleCopy = async (message) => {
    const input = document.createElement('input')
    input.value = message
    input.style.position = 'absolute'
    input.style.left = '0'
    input.style.top = '0'
    input.style.opacity = '0'
    input.style.pointerEvents = 'none'

    document.body.appendChild(input)

    try {
      input.focus()
      input.select()
      input.setSelectionRange(0, input.value.length)

      let success = false

      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(message)
          success = true
        } catch (e) {
          console.log('Clipboard API failed:', e)
        }
      }

      if (!success) {
        try {
          success = document.execCommand('copy')
        } catch (e) {
          console.log('execCommand failed:', e)
        }
      }

      if (success) {
        alert('Message copied!')
      } else {
        prompt('Copy this message:', message)
      }
    } finally {
      document.body.removeChild(input)
    }
  }

  const handleDownload = async (message) => {
    const cardElement = document.getElementById(`card-${message.id}`)
    if (!cardElement) {
      alert('❌ Card element not found')
      return
    }

    try {
      // Generate image from card
      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#7c3aed',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      // Convert canvas directly to data URL (simpler and faster)
      const dataUrl = canvas.toDataURL('image/png', 1.0)

      // Open new window with HTML page containing the image
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Secret Message - Save Image</title>
                <style>
                  body {
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-family: system-ui, -apple-system, sans-serif;
                  }
                  .instructions {
                    background: white;
                    padding: 20px;
                    border-radius: 16px;
                    margin-bottom: 20px;
                    text-align: center;
                    max-width: 500px;
                  }
                  .instructions h2 {
                    margin: 0 0 10px 0;
                    color: #667eea;
                    font-size: 20px;
                  }
                  .instructions p {
                    margin: 8px 0;
                    color: #333;
                    line-height: 1.5;
                    font-size: 14px;
                  }
                  img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                  }
                </style>
              </head>
              <body>
                <div class="instructions">
                  <h2>📱 Save to Your Phone</h2>
                  <p><strong>On Mobile:</strong> Long press the image below → Tap "Save Image" or "Download Image"</p>
                  <p><strong>On Desktop:</strong> Right-click → "Save image as..."</p>
                </div>
                <img src="${dataUrl}" alt="Secret Message" />
              </body>
            </html>
          `)
          newWindow.document.close()
          alert('✅ Image opened! Long-press to save.')
      } else {
        alert('❌ Please allow popups and try again')
      }

    } catch (err) {
      console.error('Error downloading message:', err)
      alert(`❌ Download failed: ${err.message}`)
    }
  }

  const handleShare = async (message) => {
    const cardElement = document.getElementById(`card-${message.id}`)
    if (!cardElement) return

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      // Convert canvas to data URL and show in modal
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      setShareImageUrl(dataUrl)
      setShareModal(true)
    } catch (err) {
      console.error('Error generating image:', err)
      alert('Failed to generate image.')
    }
  }

  const shareNow = () => {
    if (!shareImageUrl) return

    try {
      // Open new window with HTML page containing the image
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Secret Message - Save & Share</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                .instructions {
                  background: white;
                  padding: 20px;
                  border-radius: 16px;
                  margin-bottom: 20px;
                  text-align: center;
                  max-width: 500px;
                }
                .instructions h2 {
                  margin: 0 0 10px 0;
                  color: #667eea;
                  font-size: 20px;
                }
                .instructions p {
                  margin: 8px 0;
                  color: #333;
                  line-height: 1.5;
                  font-size: 14px;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 16px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
              </style>
            </head>
            <body>
              <div class="instructions">
                <h2>📱 Save & Share</h2>
                <p><strong>Step 1:</strong> Long press the image below → Tap "Save Image"</p>
                <p><strong>Step 2:</strong> Open your Photos/Gallery app</p>
                <p><strong>Step 3:</strong> Share to WhatsApp, Instagram, Telegram, or any app!</p>
              </div>
              <img src="${shareImageUrl}" alt="Secret Message" />
            </body>
          </html>
        `)
        newWindow.document.close()
        setShareModal(false)
        setTimeout(() => {
          alert('✅ Image opened! Long-press to save.')
        }, 500)
      } else {
        alert('❌ Please allow popups and try again')
      }
    } catch (err) {
      console.error('Share error:', err)
      alert('❌ Failed to share. Please screenshot the image.')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-3 pb-6">
      <div className="w-full max-w-md mx-auto">
        <div className="relative mb-6">
          <button
            onClick={() => navigate(`/success/${uniqueId}`)}
            className="absolute -top-8 left-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-300"
            title="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 px-6 py-2 rounded-full shadow-2xl">
              <h1 className="text-xl font-bold text-white whitespace-nowrap">Message Board</h1>
            </div>
          </div>
        </div>

        <div className="neon-card rounded-2xl p-4 mb-4 mt-24">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-white font-semibold text-sm">{user?.name}'s Messages</p>
              <p className="text-purple-200 text-xs">{messages.length} total</p>
            </div>
            <button
              onClick={async () => {
                const url = `${BASE_APP_URL}/u/${uniqueId}`
                const input = document.createElement('input')
                input.value = url
                input.style.position = 'absolute'
                input.style.left = '0'
                input.style.top = '0'
                input.style.opacity = '0'
                input.style.pointerEvents = 'none'

                document.body.appendChild(input)

                try {
                  input.focus()
                  input.select()
                  input.setSelectionRange(0, input.value.length)

                  let success = false

                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    try {
                      await navigator.clipboard.writeText(url)
                      success = true
                    } catch (e) {
                      console.log('Clipboard API failed:', e)
                    }
                  }

                  if (!success) {
                    try {
                      success = document.execCommand('copy')
                    } catch (e) {
                      console.log('execCommand failed:', e)
                    }
                  }

                  if (success) {
                    alert('Link copied!')
                  } else {
                    prompt('Copy this link:', url)
                  }
                } finally {
                  document.body.removeChild(input)
                }
              }}
              className="glow-button text-white font-semibold py-2 px-4 rounded-lg text-xs"
            >
              📋 Copy Link
            </button>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="neon-card rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="text-lg font-bold text-white mb-2">Inbox Empty</h2>
            <p className="text-purple-200 text-sm mb-4">
              Distribute your link to start collecting anonymous thoughts!
            </p>
            <button
              onClick={() => navigate(`/success/${uniqueId}`)}
              className="glow-button text-white font-semibold py-2 px-6 rounded-lg text-sm"
            >
              Share Your Link
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className="message-card">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-purple-300 text-xs font-medium">{formatDate(msg.created_at)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleCopy(msg.message)} className="text-purple-300 hover:text-purple-200 p-1" title="Copy">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                      <button onClick={() => handleDownload(msg)} className="text-purple-300 hover:text-purple-200 p-1" title="Download">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                      <button onClick={() => handleShare(msg)} className="text-purple-300 hover:text-purple-200 p-1" title="Share">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  <div className="mt-3 pt-3 border-t border-purple-300/20 flex items-center gap-2 text-purple-300 text-xs">
                    <span>🔒</span><span>100% Anonymous</span>
                  </div>
                </div>

                <div id={`card-${msg.id}`} className="fixed -left-[9999px] w-[600px] h-[900px] bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 rounded-3xl flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-center gap-3 pt-8 pb-6">
                    <div className="bg-white p-3 rounded-2xl shadow-lg">
                      <svg className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'cursive' }}>Secret Message</h1>
                  </div>

                  {/* Message Container - Centered */}
                  <div className="flex-1 flex items-center justify-center px-8">
                    <div className="relative w-full max-w-lg">
                      {/* Opening Quote */}
                      <div className="absolute -top-8 -left-4 text-white/40 text-8xl font-serif leading-none">"</div>

                      {/* Message Text */}
                      <div className="relative z-10 px-12 py-8">
                        <p className="text-white text-3xl leading-relaxed text-center font-medium break-words">
                          {msg.message}
                        </p>
                      </div>

                      {/* Closing Quote */}
                      <div className="absolute -bottom-12 -right-4 text-white/40 text-8xl font-serif leading-none">"</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pb-8 px-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-yellow-300">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-lg font-semibold">100% anonymous</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-6">
          <button onClick={() => navigate('/')} className="text-purple-300 hover:text-purple-200 underline text-sm">
            Generate your own link →
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShareModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Share the Result using the <span className="text-purple-600">Share Now</span> button below now!</h3>
            </div>

            {shareImageUrl && (
              <div className="mb-6">
                <img src={shareImageUrl} alt="Share preview" className="w-full rounded-2xl shadow-lg" />
              </div>
            )}

            <button
              onClick={shareNow}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-full text-base hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              Share Now
            </button>

            <button
              onClick={() => setShareModal(false)}
              className="mt-4 w-full text-gray-500 hover:text-gray-700 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
