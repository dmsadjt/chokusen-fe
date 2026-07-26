import { Routes, Route } from 'react-router-dom'
import './App.css'
import HealthCheck from './HealthCheck'
import LoginScreen from './LoginScreen'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HealthCheck />} />
      <Route path="/login" element={<LoginScreen />} />
    </Routes>
  )
}

export default App
