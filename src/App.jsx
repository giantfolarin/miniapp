import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { sdk } from '@farcaster/miniapp-sdk'
import HomePage from './pages/HomePage'
import SuccessPage from './pages/SuccessPage'
import MessagePage from './pages/MessagePage'
import DashboardPage from './pages/DashboardPage'

function App() {
  useEffect(() => {
    // Signal to Farcaster that the miniapp is ready
    sdk.actions.ready()
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/success/:uniqueId" element={<SuccessPage />} />
        <Route path="/u/:uniqueId" element={<MessagePage />} />
        <Route path="/u/:uniqueId/messages" element={<DashboardPage />} />
      </Routes>
    </Router>
  )
}

export default App
