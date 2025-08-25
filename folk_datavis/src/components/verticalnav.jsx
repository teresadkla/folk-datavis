// components/verticalnav.jsx
import React from "react";
import '../App.css';


export default function VerticalNav() {
  const sections = [
    { id: "network-section", label: "icon" },
    { id: "map-section", label: "icon" },
    { id: "dotplot-section", label: "icon" },
    { id: "spiral-section", label: "icon" },
  ];

  return (
    <div className="vertical-nav">
      {sections.map((sec, index) => (
        <a key={index} href={`#${sec.id}`} className="nav-dot">
          <div className="nav-icon">{sec.label}</div>
        </a>
      ))}
    </div>
  );
}
