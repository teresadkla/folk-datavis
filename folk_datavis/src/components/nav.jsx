import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../App.css'

const NavigationBar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isContextOpen, setIsContextOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleContext = () => {
    setIsContextOpen(!isContextOpen)
  }

  return (
    <>
      {/* Hamburger Menu - separado da nav-container */}
      <div className="hamburger-menu" onClick={toggleContext}>
        <div className={`hamburger-icon ${isContextOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div className="nav-container">
        <div className={`nav-menu ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}>
          <button
            onClick={() => {
              navigate('/portuguese')
              setIsMenuOpen(false)
            }}
            className={`nav-button ${location.pathname === '/portuguese' ? 'active' : 'inactive'
              }`}
          >
            Portuguese Geographical FolkData
          </button>
          <button
            onClick={() => {
              navigate('/irish')
              setIsMenuOpen(false)
            }}
            className={`nav-button ${location.pathname === '/irish' ? 'active' : 'inactive'
              }`}
          >
            Irish Musical FolkData
          </button>
        </div>
      </div>

      {/* Context Panel */}
      <div className={`context-overlay ${isContextOpen ? 'show' : ''}`} onClick={toggleContext}>
        <div className="context-panel" onClick={(e) => e.stopPropagation()}>

          <div className="context-content">

            <div className="context-section">
                <h2>Context</h2>
              </div>

            <div className="context-section">
              <h2>Portuguese Geographical FolkData</h2>
              <ol>
                <li>Portuguese Musical Roots</li>
                <li>Echoes across the Land</li>
                <li>Wandering Melodies</li>
                <li>The Spiral of time</li>
              </ol>

            </div>
            <div className="context-section">
              <h2>Irish Musical FolkData</h2>

              <ol>
                <li>Irish Musical Roots</li>
                <li>Types of Irish Folk</li>
                <li>Heat of the Melody</li>
                <li>Strings of Connections</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default NavigationBar
