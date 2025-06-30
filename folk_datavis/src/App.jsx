import { useState } from 'react'
import NetworkDiagram from './components/PT_VIS/network_rootsPT'
import Vis1PT from './pages/Vis1PT' 
import './App.css'

function App() {
  return (
    <div className="app-container">
      {/* <h1>Folk Data Visualization</h1> */}
      <div className="visualizations">
        <Vis1PT />
      </div>
    </div>
  )
}

export default App
