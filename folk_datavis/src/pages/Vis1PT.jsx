import React, { useState } from "react";
import NetworkDiagram from "../components/PT_VIS/network_rootsPT";
import PortugalMap from "../components/PT_VIS/map";
import TemaRegiaoVis from "../components/PT_VIS/dotplotPT";
import SpiralVis from "../components/PT_VIS/spiral";
import NavigationBar from "../components/nav";
import "../css/PTpages.css";

export default function VisPT() {
  const [currentVis, setCurrentVis] = useState(1);
  const [showLegend, setShowLegend] = useState(false);

  const handleNext = () => {
    if (currentVis < 4) setCurrentVis(currentVis + 1);
  };

  const handlePrev = () => {
    if (currentVis > 1) setCurrentVis(currentVis - 1);
  };

  const renderLegend = () => {
    if (!showLegend) return null;

    return (
      <div className="legend-overlay" onClick={() => setShowLegend(false)}>
        <div className="legend-modal" onClick={(e) => e.stopPropagation()}>
        
          {currentVis === 1 && (
            <div className="legend-content">
                <button
            className="legend-close"
            onClick={() => setShowLegend(false)}
          >
            ×
          </button>
              {/* Conteúdo da legenda do NetworkDiagram */}
              <h3>Legenda do gráfico</h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li>
                  <span style={{
                    display: "inline-block",
                    width: 18, height: 18,
                    background: "#C33512",
                    borderRadius: "50%",
                    marginRight: 8,
                    verticalAlign: "middle"
                  }}></span>
                  <b>Flor vermelha</b>: Tema (tamanho proporcional ao número de ocorrências)
                </li>
                <li>
                  <span style={{
                    display: "inline-block",
                    width: 18, height: 18,
                    background: "#E09D2C",
                    borderRadius: "50%",
                    marginRight: 8,
                    verticalAlign: "middle"
                  }}></span>
                  <b>Círculo amarelo</b>: Região
                </li>
                <li>
                  <span style={{
                    display: "inline-block",
                    width: 30, height: 4,
                    background: "#6B3F21",
                    marginRight: 8,
                    verticalAlign: "middle"
                  }}></span>
                  <b>Linha castanha</b>: Ligação entre tema e região (espessura = nº de ocorrências)
                </li>
              </ul>
              <p style={{ fontSize: "12px", color: "#555" }}>
                Clique numa flor para destacar as ligações.<br />
                Passe o rato sobre uma flor para ver detalhes.
              </p>
            </div>
          )}
          {currentVis === 2 && (
            <div className="legend-content">
                <button
            className="legend-close"
            onClick={() => setShowLegend(false)}
          >
            ×
          </button>
              {/* Conteúdo da legenda do Map */}
              <h3>Legenda</h3>
              <ul>
                <li><strong>Círculos:</strong> Representam a quantidade de temas por distrito.</li>
                <li><strong>Linhas curvas:</strong> Conexões entre distritos com temas em comum.</li>
                <li><strong>Tamanho do círculo:</strong> Proporcional ao número de temas.</li>
                <li><strong>Cor dos círculos:</strong> Fixa, com opacidade para sobreposição.</li>
              </ul>
            </div>
          )}
          {currentVis === 3 && (
            <div className="legend-content">
                <button
            className="legend-close"
            onClick={() => setShowLegend(false)}
          >
            ×
          </button>
              {/* Conteúdo da legenda do dotplot */}
              <h3 className="legenda-titulo">Legenda do Gráfico</h3>

              <div className="legenda-secao">
                <p><strong>O que este gráfico mostra:</strong></p>
                <p>Este gráfico de pontos mostra a distribuição de temas musicais folclóricos por regiões de Portugal. O tamanho de cada flor representa a quantidade de registros para cada combinação de tema e região.</p>
              </div>

              <div className="legenda-secao">
                <p><strong>Como interpretar:</strong></p>
                <ul>
                  <li>Cada flor representa um tema musical numa região específica</li>
                  <li>Quanto maior a flor, mais registros existem desse tema nessa região</li>
                  <li>Clique em qualquer flor para ver detalhes sobre os artistas, instrumentos e categorias</li>
                </ul>
              </div>

              <div className="legenda-secao">
                <p><strong>Navegação:</strong></p>
                <p>Use os botões de paginação para navegar entre diferentes temas e regiões, pois nem todos podem ser mostrados simultaneamente.</p>
              </div>

              <div className="legenda-exemplo">
                <svg width="80" height="80" viewBox="0 0 170 170">
                  <path
                    d="M84.11,83.26c-7.25-7.17-13.98-12.9-20.19-17.4-7.28-9.86-13.1-23.1-10.41-38.76C58.37-1.17,91.17-3.59,105.45,4.61c9.18,5.27,22.85,24.06-3.08,59.58-9.91,7.41-16.33,16.23-18.26,19.06ZM141.5,53.51c-15.86-2.73-29.24,3.28-39.14,10.68-4.44,6.08-10.05,12.66-17.03,19.74,2.87,1.95,11.87,8.51,19.34,18.63,35.35,25.66,54.05,12.03,59.31,2.88,8.2-14.27,5.79-47.08-22.48-51.94ZM63.92,65.85c-35.35-25.66-54.05-12.03-59.31-2.88-8.2,14.27-5.79,47.08,22.48,51.94,15.86,2.73,29.24-3.28,39.14-10.68,4.44-6.08,10.05-12.66,17.03-19.74-2.87-1.95-11.87-8.51-19.34-18.63ZM84.11,83.26c-.41.6-.61.93-.61.93.01.01.02.02.03.03.26-.26.51-.52.77-.78-.06-.06-.12-.12-.18-.18ZM66.23,104.23c-25.93,35.52-12.26,54.31-3.08,59.58,14.27,8.2,47.08,5.79,51.94-22.48,2.69-15.67-3.13-28.91-10.41-38.76-6.21-4.51-12.93-10.24-20.19-17.4-1.93,2.84-8.35,11.65-18.26,19.06ZM84.29,83.44c.26.26.52.51.78.77.09-.09.18-.18.27-.27-.59-.4-.93-.61-.93-.61-.04.04-.08.08-.11.12ZM83.26,84.49c.59.4.93.61.93.61.04-.04.08-.08.11-.12-.26-.26-.52-.51-.78-.77-.09.09-.18.18-.27.27ZM84.49,85.17c.41-.6.61-.93.61-.93-.01-.01-.02-.02-.03-.03-.26.26-.51.52-.77.78.06.06.12.12.18.18Z"
                    className="legenda-flor-exemplo"
                  />
                </svg>
                <span className="legenda-texto-exemplo">
                  <strong>Flor:</strong> Representa a presença de um tema musical numa região
                </span>
              </div>
            </div>
          )}
          {currentVis === 4 && (
            <div className="legend-content">
                <button
            className="legend-close"
            onClick={() => setShowLegend(false)}
          >
            ×
          </button>
              {/* Conteúdo da legenda do ChordDiagramABC */}
              <h3>Legenda - Strings of Connection</h3>
              <p>Descrição da legenda para o chord diagram...</p>
            </div>
          )}
        </div>
      </div>
    );
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
            {/* Legend button for VIS 1 */}
            <button
              className="legend-btn"
              onClick={() => setShowLegend(true)}
            >
              Ver legenda
            </button>
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
            {/* Legend button for VIS 2 */}
            <button
              className="legend-btn"
              onClick={() => setShowLegend(true)}
            >
              Ver legenda
            </button>
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
            {/* Legend button for VIS 3 */}
            <button
              className="legend-btn"
              onClick={() => setShowLegend(true)}
            >
              Ver legenda
            </button>
          </div>
          <div id="dotplot-section" className="visPT-dotplot">
            {currentVis === 3 && <TemaRegiaoVis active={true} />}
          </div>
        </div>

        {/* VIS 4 */}
        <div className="vis4" style={{ display: currentVis === 4 ? "grid" : "none" }}>

          <div className="spiral-description">
            <h2 className="spiral-title">The Spiral of Time</h2>
            <p className="spiral-text">
              Some songs endure across generations, reappearing throughout time with the same name but new voices.
              This spiral traces those songs over the years, connecting them chronologically and revealing patterns in how cultural memory is preserved through music.
            </p>
            {/* Legend button for VIS 4 */}
            <button
              className="legend-btn"
              onClick={() => setShowLegend(true)}
            >
              Ver legenda
            </button>
          </div>
          <div id="spiral-section" className="visPT-spiral">
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

      {/* Renderizar legenda */}
      {renderLegend()}
    </>
  );
}
