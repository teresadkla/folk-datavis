import { Routes, Route } from 'react-router-dom'
import NavigationBar from './components/nav'
import Vis1PT from './pages/Vis1PT'
import VisIE from './pages/VisIE' // importa a página irlandesa
import './App.css'

function App() {
  return (
    <div className="app-container">
      <div className="visualizations">
        <Routes>
          <Route path="/portuguese" element={<Vis1PT />} />
          <Route path="/irish" element={<VisIE />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
