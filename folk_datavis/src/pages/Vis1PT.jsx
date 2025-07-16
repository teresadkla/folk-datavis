import React, { useState } from "react";
import NetworkDiagram from "../components/PT_VIS/network_rootsPT";
import PortugalMap from "../components/PT_VIS/map";
import TemaRegiaoVis from "../components/PT_VIS/dotplotPT";
import SpiralVis from "../components/PT_VIS/spiral";
import NavigationBar from "../components/nav";
import "../css/PTpages.css";

export default function VisPT() {
  const [currentVis, setCurrentVis] = useState(1);

  const handleNext = () => {
    if (currentVis < 4) setCurrentVis(currentVis + 1);
  };

  const handlePrev = () => {
    if (currentVis > 1) setCurrentVis(currentVis - 1);
  };

  return (
    <>
      <NavigationBar />
      <div className="visPT-container">

        {/* VIS 1 */}
        <div className="vis1" style={{ display: currentVis === 1 ? "contents" : "none" }}>
          <div id="network-section" className="vispt-roots">
            <NetworkDiagram />
          </div>
          <div className="roots-description">
            <h2 className="roots-title">Song variation and propagation through Portuguese territory</h2>
            <p className="roots-text">
              Lorem ipsum dolor sit amet consectetur. Pulvinar faucibus non pellentesque hac nisl. Potenti vel sit neque nunc sed fames urna.
              <br /><br />
              Tristique risus volutpat viverra nibh phasellus massa magna urna. Non mauris enim mus egestas.
            </p>
          </div>
        </div>

        {/* VIS 2 */}
        <div className="vis2" style={{ display: currentVis === 2 ? "contents" : "none" }}>
          <div className="map-description">
            <h2 className="map-title">Number of registers of folk music per district</h2>
          </div>
          <div id="map-section" className="visPT-map">
            <PortugalMap />
          </div>
        </div>

        {/* VIS 3 */}
        <div className="vis3" style={{ display: currentVis === 3 ? "contents" : "none" }}>
          <div className="dotplot-PT-description">
            <h2 className="dotplot-PT-title">Frequency of songs throughout the Portuguese Territory</h2>
          </div>
          <div id="dotplot-section" className="visPT-dotplot">
            <TemaRegiaoVis />
          </div>
        </div>

        {/* VIS 4 */}
        <div className="vis4" style={{ display: currentVis === 4 ? "contents" : "none" }}>
          <div id="spiral-section" className="visPT-spiral">
            <SpiralVis />
          </div>
        </div>

        {/* NAVIGATION BUTTONS */}
        <div className="nav-buttons">
          {currentVis > 1 && (
            <button onClick={handlePrev} className="nav-btn up">↑</button>
          )}
          {currentVis < 4 && (
            <button onClick={handleNext} className="nav-btn down">↓</button>
          )}
        </div>
      </div>
    </>
  );
}
