import { Routes, Route } from 'react-router-dom'
import './App.css'
import HealthCheck from './HealthCheck'
import HomeScreen from './HomeScreen'
import LoginScreen from './LoginScreen'
import ThemeToggle from './ThemeToggle'
import { PublicOnly, RequireAuth } from './auth/RouteGuards'

function App() {
  return (
    <>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<RequireAuth><HomeScreen /></RequireAuth>} />
        <Route path="/login" element={<PublicOnly><LoginScreen /></PublicOnly>} />
        <Route path="/health" element={<HealthCheck />} />
      </Routes>
    </>
  )
}

export default App
