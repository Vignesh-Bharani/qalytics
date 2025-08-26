import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import PnLs from './pages/PnLs'
import PnLDetails from './pages/PnLDetails'
import SubPnLs from './pages/SubPnLs'
import SubPnLDetails from './pages/SubPnLDetails'
import SubPnLMetrics from './pages/SubPnLMetrics'
import MetricsHistory from './pages/MetricsHistory'

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Public Route wrapper (redirects to dashboard if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
      </div>
    )
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

// App Routes Component
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } 
      />
      
      {/* Protected routes with Layout */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pnls" element={<PnLs />} />
        <Route path="pnls/:pnlId" element={<PnLDetails />} />
        <Route path="pnls/:pnlId/sub-pnls" element={<SubPnLs />} />
        <Route path="sub-pnl-details/:subPnlId" element={<SubPnLDetails />} />
        <Route path="sub-pnls/:subPnlId/metrics" element={<SubPnLMetrics />} />
        <Route path="metrics-history" element={<MetricsHistory />} />
        <Route path="pnls/:pnlId/metrics-history" element={<MetricsHistory />} />
        <Route path="sub-pnls/:subPnlId/metrics-history" element={<MetricsHistory />} />
      </Route>
      
      {/* Catch all - redirect based on auth status */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App