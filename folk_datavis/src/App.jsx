import { Routes, Route, Navigate } from 'react-router-dom'
import NavigationBar from './components/nav'
import Vis1PT from './pages/Vis1PT'
import VisIE from './pages/VisIE' 
import Home from './pages/Home'
import ScrollIntro from './pages/Intro'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <div className="visualizations">
        <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/portuguese" element={<Vis1PT />} />
          <Route path="/irish" element={<VisIE />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
