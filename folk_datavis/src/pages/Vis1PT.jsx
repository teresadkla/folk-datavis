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
        <div className="vis1" style={{ display: currentVis === 1 ? "grid" : "none" }}>
          <div id="network-section" className="vispt-roots">
            <NetworkDiagram />
          </div>
          <div className="roots-description">
            <h2 className="roots-title">Portuguese Musical Roots</h2>
            <p className="roots-text">
              Portuguese folk music emerges like a deep echo of local communities. In this visualization, we trace some of the traditional songs with the most variations across the land, branching out like living roots.
              Each ramification represents a shared story, a sung tradition, a connection between people from the north to the south of the country.
            </p>
          </div>
        </div>

        {/* VIS 2 */}
        <div className="vis2" style={{ display: currentVis === 2 ? "grid" : "none" }}>
          <div className="map-description">
            <h2 className="map-title">Echoes Across the Land </h2>
            <p className="map-text">
              By mapping folk music recordings by district, we reveal the density and geographic spread of Portugal’s traditional repertoire.
              The connections between districts highlight songs that cross administrative borders — shared echoes that unite regions through common melodies.
            </p>
          </div>
          <div id="map-section" className="visPT-map">

            <PortugalMap key={currentVis === 2 ? Date.now() : "hidden"} active={currentVis === 2} />

          </div>
        </div>

        {/* VIS 3 */}
        <div className="vis3" style={{ display: currentVis === 3 ? "grid" : "none" }}>
          <div className="dotplot-PT-description">
            <h2 className="dotplot-PT-title">Wandering Melodies</h2>
            <p className="dotplot-PT-text">
              Which folk songs echo the most across Portugal? Who were the voices behind them, and what instruments carried their melodies?
              Explore the similiarities and patterns between the songs across the country’s cultural soundscape.

            </p>
          </div>
          <div id="dotplot-section" className="visPT-dotplot">
            {currentVis === 3 && <TemaRegiaoVis active={true} />}
          </div>
        </div>

        {/* VIS 4 */}
        <div className="vis4" style={{ display: currentVis === 4 ? "grid" : "none" }}>
          <div id="spiral-section" className="visPT-spiral">
            <h2 className="spiral-title">The Spiral of Time</h2>
            <p className="spiral-text">
              Some songs endure across generations, reappearing throughout time with the same name but new voices.
               This spiral traces those songs over the years, connecting them chronologically and revealing patterns in how cultural memory is preserved through music.
            </p>
            <SpiralVis active={currentVis === 4} />
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
