import React, { useState } from 'react';
import '../App.css';

const NavigationBar = () => {
  const [selected, setSelected] = useState('portuguese');

  return (
    <div className="nav-container">
      <button
        onClick={() => setSelected('portuguese')}
        className={`nav-button ${
          selected === 'portuguese' ? 'active' : 'inactive'
        }`}
      >
        Portuguese Geographical FolkData
      </button>
      <button
        onClick={() => setSelected('irish')}
        className={`nav-button ${
          selected === 'irish' ? 'active' : 'inactive'
        }`}
      >
        Irish Musical FolkData
      </button>
    </div>
  );
};

export default NavigationBar;
