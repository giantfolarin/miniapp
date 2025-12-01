import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const [name, setName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [waitingForWallet, setWaitingForWallet] = useState(false)
  const [error, setError] = useState('')
  const [checkingSession, setCheckingSession] = useState(true) // Add loading state for session check
  const navigate = useNavigate()
  const hasCheckedSession = useRef(false)

  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      console.error('Wallet connection error:', connectError)
      const errorMessage = connectError?.message || connectError?.toString() || 'Unknown error occurred'
      setError(`Failed to connect wallet: ${errorMessage}`)
      setWaitingForWallet(false)
    }
  }, [connectError])

  // Check for existing session on mount - runs once when wallet is connected
  useEffect(() => {
    console.log('Session restoration check - isConnected:', isConnected, 'address:', address, 'hasChecked:', hasCheckedSession.current)

    if (isConnected && address && !hasCheckedSession.current) {
      hasCheckedSession.current = true
      const savedSession = localStorage.getItem('secretMessageSession')
      console.log('Saved session from localStorage:', savedSession)

      if (savedSession) {
        try {
          const session = JSON.parse(savedSession)
          console.log('Parsed session:', session)

          // Compare addresses case-insensitively
          const addressMatch = session.walletAddress?.toLowerCase() === address.toLowerCase()
          console.log('Address match:', addressMatch, 'Session address:', session.walletAddress, 'Current address:', address)

          if (addressMatch && session.uniqueId) {
            console.log('✅ Found existing session! Redirecting to success page:', session.uniqueId)
            navigate(`/success/${session.uniqueId}`)
            // Don't set checkingSession to false here, let the redirect happen
            return
          } else {
            console.log('❌ Session exists but address does not match')
            // Clear mismatched session
            localStorage.removeItem('secretMessageSession')
          }
        } catch (err) {
          console.error('Error parsing session:', err)
          localStorage.removeItem('secretMessageSession')
        }
      } else {
        console.log('No saved session found in localStorage')
      }

      // Session check complete, show the form
      setCheckingSession(false)
    }
  }, [isConnected, address, navigate])

  // Timeout for session check - if wallet doesn't connect in 2 seconds, show the form
  useEffect(() => {
    const timer = setTimeout(() => {
      if (checkingSession && !hasCheckedSession.current) {
        console.log('Session check timeout - showing form')
        setCheckingSession(false)
        hasCheckedSession.current = true
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [checkingSession])

  // Auto-proceed with link creation after wallet connects
  useEffect(() => {
    if (isConnected && waitingForWallet && address) {
      createLink()
    }
  }, [isConnected, waitingForWallet, address])

  const createLink = async () => {
    setLoading(true)
    setWaitingForWallet(false)

    try {
      const uniqueId = nanoid(10)

      console.log('Creating user with data:', {
        unique_id: uniqueId,
        name: name.trim(),
        wallet_address: address
      })

      const { error: dbError } = await supabase
        .from('users')
        .insert([{ unique_id: uniqueId, name: name.trim(), wallet_address: address }])

      if (dbError) {
        console.error('Database error:', dbError)
        throw dbError
      }

      // Save session to localStorage for persistence
      const session = {
        uniqueId,
        walletAddress: address.toLowerCase(), // Store in lowercase for consistent comparison
        name: name.trim(),
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('secretMessageSession', JSON.stringify(session))
      console.log('Session saved to localStorage:', session)

      navigate(`/success/${uniqueId}`)
    } catch (err) {
      console.error('Error creating user:', err)
      const errorMessage = err?.message || err?.toString() || 'Please try again.'
      setError(`Failed to create your link: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!agreed) {
      setError('Please agree to the terms')
      return
    }

    // If wallet not connected, connect first
    if (!isConnected) {
      console.log('Attempting to connect wallet...')
      console.log('Available connectors:', connectors)

      if (!connectors || connectors.length === 0) {
        setError('No wallet connectors available. Please install MetaMask or Coinbase Wallet.')
        return
      }

      setWaitingForWallet(true)

      try {
        // Connect with the first available connector
        const connector = connectors[0]
        console.log('Connecting with connector:', connector.name)

        await connect({ connector })
      } catch (err) {
        console.error('Connect error:', err)
        const errorMessage = err?.message || err?.toString() || 'Failed to connect wallet'
        setError(errorMessage)
        setWaitingForWallet(false)
      }
      return
    }

    // Wallet is already connected, proceed with creating link
    await createLink()
  }

  // Show loading spinner while checking for existing session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking for existing session...</p>
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
              <h1 className="text-2xl font-bold text-white whitespace-nowrap">
                Secret Message
              </h1>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-3xl p-1 mt-6">
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-3xl p-6 pt-12">
              <div className="space-y-3 mb-6 text-white text-sm">
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Enter your Name, Connect Wallet and Create your link, also share it to your friend on X, WhatsApp, etc.</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Get anonymous response from anyone.</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Once someone sends you a message, you will see the message in your Inbox.</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-white text-gray-700 placeholder-gray-400 rounded-xl text-base
                           focus:outline-none focus:ring-4 focus:ring-purple-400/50 transition-all duration-300"
                  maxLength={50}
                  disabled={loading}
                />

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
                    disabled={loading}
                  />
                  <label htmlFor="terms" className="text-white text-sm cursor-pointer select-none">
                    I agree to{' '}
                    <span className="text-cyan-400 underline hover:text-cyan-300">
                      Terms and condition
                    </span>
                    {' '}of website.
                  </label>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-center text-sm">
                    {error}
                  </div>
                )}

                {isConnected && address && (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 text-green-200 text-center text-sm">
                    <span className="mr-2">✅</span>
                    Wallet Connected: {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                )}

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading || !name.trim() || !agreed || isPending || waitingForWallet}
                    className="bg-white text-purple-600 font-bold py-3 px-12 rounded-full text-lg
                             border-4 border-transparent hover:border-cyan-400
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                  >
                    {waitingForWallet || isPending ? 'Connecting Wallet...' : loading ? 'Creating...' : isConnected ? 'Create your Link' : 'Connect Wallet & Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
