import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../App.css'

const NavigationBar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="nav-container">
      <button
        onClick={() => navigate('/portuguese')}
        className={`nav-button ${
          location.pathname === '/portuguese' ? 'active' : 'inactive'
        }`}
      >
        Portuguese Geographical FolkData
      </button>
      <button
        onClick={() => navigate('/irish')}
        className={`nav-button ${
          location.pathname === '/irish' ? 'active' : 'inactive'
        }`}
      >
        Irish Musical FolkData
      </button>
    </div>
  )
}

export default NavigationBar
