import React, { useState } from "react";
import NetworkDiagramIE from "../components/IE_VIS/network_rootsIE";
import DotPlotTypes from "../components/IE_VIS/dotplottype";
import MidiHeatmapComparison from "../components/IE_VIS/heatmapcomparison";
// import ABCVisualizer from "../components/IE_VIS/pitchabc";
import ChordDiagramABC from "../components/IE_VIS/chorddiagram";
import NavigationBar from "../components/nav";
import VerticalNav from "../components/verticalnav";
import "../css/IEpages.css";

export default function VisIE() {
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
                    <button
                        className="legend-close"
                        onClick={() => setShowLegend(false)}
                    >
                        ×
                    </button>
                    {currentVis === 1 && (
                        <div className="legend-content">
                            {/* Conteúdo da legenda do NetworkDiagram */}
                            <h3>Legenda</h3>
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                <li>
                                    <span style={{
                                        display: "inline-block",
                                        width: 18, height: 18,
                                        background: "#5193AE",
                                        borderRadius: "50%",
                                        marginRight: 8,
                                        verticalAlign: "middle"
                                    }}></span>
                                    <b>Círculo azul</b>: Nome da música (tamanho proporcional ao número de ocorrências)
                                </li>
                                <li>
                                    <span style={{
                                        display: "inline-block",
                                        width: 18, height: 18,
                                        background: "#82813E",
                                        borderRadius: "50%",
                                        marginRight: 8,
                                        verticalAlign: "middle"
                                    }}></span>
                                    <b>Círculo verde</b>: Modo musical
                                </li>
                                <li>
                                    <span style={{
                                        display: "inline-block",
                                        width: 30, height: 4,
                                        background: "#6B3F21",
                                        marginRight: 8,
                                        verticalAlign: "middle"
                                    }}></span>
                                    <b>Linha castanha</b>: Ligação entre música e modo (espessura = nº de ocorrências)
                                </li>
                            </ul>
                            <p style={{ fontSize: "12px", color: "#555" }}>
                                Clique num círculo azul para destacar as ligações.<br />
                                Passe o rato sobre um círculo azul para ver detalhes.
                            </p>

                        </div>
                    )}
                    {currentVis === 2 && (
                        <div className="legend-content">
                            {/* Conteúdo da legenda do DotPlotTypes */}
                                <h3>Legenda do gráfico</h3>
            <div className="legend-section">
              <h4>Sobre o Gráfico:</h4>
              <p>Este é um <strong>Dot Plot</strong> que mostra a relação entre músicas folclóricas e seus tipos musicais.</p>
            </div>
            <div className="legend-section">
              <h4>Como Ler:</h4>
              <ul>
                <li><strong>Eixo Vertical (Y):</strong> Nomes das músicas</li>
                <li><strong>Eixo Horizontal (X):</strong> Tipos de música</li>
                <li><strong>Círculos:</strong> Indicam que uma música pertence a um tipo específico</li>
                <li><strong>Cor dos Círculos:</strong> Intensidade da cor representa o número de variações da música nesse tipo</li>
              </ul>
            </div>
            <div className="legend-section">
              <h4>Cores:</h4>
              <div className="color-legend">
                <div className="color-item">
                  <div className="color-box" style={{ backgroundColor: '#0d0887' }}></div>
                  <span>Poucas variações</span>
                </div>
                <div className="color-item">
                  <div className="color-box" style={{ backgroundColor: '#7e03a8' }}></div>
                  <span>Variações médias</span>
                </div>
                <div className="color-item">
                  <div className="color-box" style={{ backgroundColor: '#f0f921' }}></div>
                  <span>Muitas variações</span>
                </div>
              </div>

              <div className="legend-section">
                <h4>Controles:</h4>
                <ul>
                  <li><strong>Filtro:</strong> Mostra apenas músicas com múltiplos tipos</li>
                  <li><strong>Navegação (↑/↓):</strong> Navega entre páginas do gráfico</li>
                  <li><strong>Hover:</strong> Passe o mouse sobre os círculos para ver detalhes</li>
                </ul>
              </div>

            </div>
                        </div>
                    )}
                    {currentVis === 3 && (
                        <div className="legend-content">
                            {/* Conteúdo da legenda do MidiHeatmapComparison */}
                            <h3>Legenda - Heat of the Melody</h3>
                            <p>Descrição da legenda para o heatmap...</p>
                        </div>
                    )}
                    {currentVis === 4 && (
                        <div className="legend-content">
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

            <div className="visIE-container">
                {/* VIS 1 */}
                <div className="vis1" style={{ display: currentVis === 1 ? "grid" : "none" }}>
                    {/* Descriptive Text */}
                    <div className="roots-description-IE">
                        <h2 className="roots-title-IE">
                            Irish Musical Roots
                        </h2>
                        <p className="roots-text-IE">
                            Irish folk songs take shape not only through words and melodies, but through the ways they're sung.
                            This visualization uncovers how songs connect through shared musical modes and stylistic interpretations.
                        </p>
                        {/* Legend button for VIS 1 */}
                        <button
                            className="legend-btn"
                            onClick={() => setShowLegend(true)}
                        >
                            Ver legenda
                        </button>
                    </div>
                    {/* Network Diagram */}
                    <div id="network-IE-section" className="visIE-roots">
                        {currentVis === 1 && <NetworkDiagramIE />}
                    </div>
                </div>



                {/* VIS 2 */}
                <div className="vis2" style={{ display: currentVis === 2 ? "grid" : "none" }}>
                    {/* Heatmap dots */}
                    <div className="Types-description">
                        <h2 className="Types-title">
                            Types of Irish folk
                        </h2>
                        <p className="Types-text-IE">
                            Irish folk songs often exist in multiple forms, reshaped by the musical categories they belong to. This visualization explores how songs vary across styles — from dance tunes to laments — revealing the creative diversity that lives within shared traditions.
                            Each point is a variation, a window into how structure and expression intertwine in the folk repertoire.
                        </p>
                        {/* Legend button for VIS 2 */}
                        <button
                            className="legend-btn"
                            onClick={() => setShowLegend(true)}
                        >
                            Ver legenda
                        </button>
                    </div>
                    <div id="dptypes-section" className="dotplot-types">
                        {currentVis === 2 && <DotPlotTypes active={true} />}
                    </div>
                </div>


                {/* VIS 3 */}
                <div className="vis3" style={{ display: currentVis === 3 ? "grid" : "none" }}>
                    <div className="heatmap-comparison-description">
                        <h2 className="heatmap-comparison-title">Heat of the Melody</h2>
                        <p className="heatmap-comparison-text">
                            Every variation of a folk song tells a slightly different musical story. This heatmap uncovers those differences by highlighting the notes most frequently played across versions — revealing which tones anchor the melody, and where change happens.
                            As time unfolds, we see not just how songs shift, but how tradition evolves through subtle musical choices.
                        </p>
                        {/* Legend button for VIS 3 */}
                        <button
                            className="legend-btn"
                            onClick={() => setShowLegend(true)}
                        >
                            Ver legenda
                        </button>
                    </div>
                    <div id="heatmap-comparison-section" className="heatmap-comparison">
                        {/* {currentVis >= 2 && <MidiHeatmapComparison />}  */}
                        {currentVis === 3 && <MidiHeatmapComparison />}
                    </div>
                </div>


                {/* VIS 4 */}
                <div className="vis4" style={{ display: currentVis === 4 ? "grid" : "none" }}>
                    <div className="pitch-abc-description">
                        <h2 className="pitch-abc-title">Strings of Connection</h2>
                        <p className="pitch-abc-text">
                            Irish folk songs often share more than just a cultural heritage — they echo one another in notes, rhythms, and style.
                            This chord diagram maps those relationships, linking melodies by their similarities in pitch, meter, type, and mode.
                            The result is a tapestry of connections that shows how individual songs weave together into a larger musical tradition.
                        </p>
                        {/* Legend button for VIS 4 */}
                        <button
                            className="legend-btn"
                            onClick={() => setShowLegend(true)}
                        >
                            Ver legenda
                        </button>
                    </div>
                    <div id="picth-section" className="pitch-abc">
                        {currentVis === 4 && <ChordDiagramABC />}
                    </div>
                </div >
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
