import React from "react";
import NetworkDiagram from "../components/PT_VIS/network_rootsPT";
import PortugalMap from "../components/PT_VIS/map";
import TemaRegiaoVis from "../components/PT_VIS/dotplotPT";
import SpiralVis from "../components/PT_VIS/spiral";
import "../css/PTpages.css";

export default function visPT() {
  return (
    <div className="visPT-container">
      <div className="visPT-header">
        <h5 className="visPT-title"> Portuguese Geographical FolkData</h5>
        <h5 className="visPT-subtitle">Irish Musical FolkData</h5>
      </div>

      {/* Conteúdo principal */}
      
        {/* Gráfico */}
        <div className="vispt-roots">
          <NetworkDiagram />
        </div>
        {/* Texto descritivo */}
        <div className="roots-description">
          <h2 className="visPT-section-title">
            Song variation and propagation through Portuguese territory
          </h2>
          <p className="visPT-text">
            Lorem ipsum dolor sit amet consectetur. Pulvinar faucibus non
            pellentesque hac nisl. Potenti vel sit neque nunc sed fames urna.
            Tristique risus volutpat viverra nibh phasellus massa magna urna.
            Non mauris enim mus egestas.
            Lorem ipsum dolor sit amet consectetur. Pulvinar faucibus non
            pellentesque hac nisl. Potenti vel sit neque nunc sed fames urna.
            Tristique risus volutpat viverra nibh phasellus massa magna urna.
            Non mauris enim mus egestas.
            <br></br>
            Lorem ipsum dolor sit amet consectetur. Pulvinar faucibus non
            pellentesque hac nisl. Potenti vel sit neque nunc sed fames urna.
            Tristique risus volutpat viverra nibh phasellus massa magna urna.
            Non mauris enim mus egestas.
          </p>
        </div>
     
      {/* Setinha para scroll */}
      <div className="arrow">
        <span>↓</span>


      </div>
      {/* Mapa de Portugal */}
      <div className="visPT-map">
        <PortugalMap />
      </div>
        

        {/* Informação especifica sobre a tema em região */}
        <div className="visPT-dotplot">
        <TemaRegiaoVis />
      </div>
        
      
        {/* Informação especifica sobre a tema em região */}
        <div className="visPT-spiral">
        <SpiralVis />
      </div>
       
      
    </div>
  );
}
