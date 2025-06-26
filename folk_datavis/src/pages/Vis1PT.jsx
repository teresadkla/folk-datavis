import React from "react";
import NetworkDiagram from "../components/PT_VIS/network_rootsPT";
import PortugalMap from "../components/PT_VIS/map";

import "../css/PTpages.css";

export default function Vis1PT() {
  return (
    <div className="vis1pt-container">
      <div className="vis1pt-header">
        <h5 className="vis1pt-title"> Portuguese Geographical FolkData</h5>
        <h5 className="vis1pt-subtitle">Irish Musical FolkData</h5>
      </div>

      {/* Conteúdo principal */}
      <div className="vis1pt-main">
        {/* Gráfico */}
        <div className="vis1pt-graph">
          <NetworkDiagram />
        </div>
        {/* Texto descritivo */}
        <div className="vis1pt-description">
          <h2 className="vis1pt-section-title">
            Song variation and propagation through Portuguese territory
          </h2>
          <p className="vis1pt-text">
            Lorem ipsum dolor sit amet consectetur. Pulvinar faucibus non
            pellentesque hac nisl. Potenti vel sit neque nunc sed fames urna.
            Tristique risus volutpat viverra nibh phasellus massa magna urna.
            Non mauris enim mus egestas.
          </p>
        </div>
      </div>
      {/* Setinha para scroll */}
      <div className="vis1pt-arrow">
        <span>↓</span>
      </div>
      {/* Mapa de Portugal */}
      <div className="vis1pt-map">
        <PortugalMap />
      </div>
        {/* Setinha para scroll */}
        <div className="vis1pt-arrow">
        <span>↓</span>
      </div>
    </div>
  );
}
