import React from "react";
import NetworkDiagram from "../components/PT_VIS/network_rootsPT";
import PortugalMap from "../components/PT_VIS/map";
import TemaRegiaoVis from "../components/PT_VIS/dotplotPT";
import SpiralVis from "../components/PT_VIS/spiral";
import NavigationBar from "../components/nav";
import VerticalNav from "../components/verticalnav";
import "../css/PTpages.css";

export default function visPT() {
  return (
    <>
      <NavigationBar />

      <div className="visPT-container">
        <VerticalNav />

        {/* Network Diagram */}
        <div id="network-section" className="vispt-roots">
          <NetworkDiagram />
        </div>

        {/* Descriptive Text */}
        <div className="roots-description">
          <h2 className="roots-title">
            Song variation and propagation through Portuguese territory
          </h2>
          <p className="roots-text">
            Lorem ipsum dolor sit amet consectetur. Pulvinar faucibus non
            pellentesque hac nisl. Potenti vel sit neque nunc sed fames urna.
            Tristique risus volutpat viverra nibh phasellus massa magna urna.
            Non mauris enim mus egestas.
            <br /><br />
            Lorem ipsum dolor sit amet consectetur. Pulvinar faucibus non
            pellentesque hac nisl. Potenti vel sit neque nunc sed fames urna.
            Tristique risus volutpat viverra nibh phasellus massa magna urna.
            Non mauris enim mus egestas.
          </p>
        </div>

        {/* Portugal Map */}
        <div className="map-description">
          <h2 className="map-title">
          Number of registers of folk music per district
          </h2>
        </div>
        <div id="map-section" className="visPT-map">
          <PortugalMap />
        </div>

        <div className="dotplot-PT-description">
          <h2 className="dotplot-PT-title">
         Frequency of songs throught the Portuguese Territory
          </h2>
        </div>
        {/* Dotplot */}
        <div id="dotplot-section" className="visPT-dotplot">
          <TemaRegiaoVis />
        </div>

        {/* Spiral */}
        <div id="spiral-section" className="visPT-spiral">
          <SpiralVis />
        </div>
      </div>
    </>
  );
}
