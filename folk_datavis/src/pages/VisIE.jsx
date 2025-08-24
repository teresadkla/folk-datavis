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

                    {currentVis === 1 && (
                        <div className="legend-content">
                            <button
                                className="legend-close"
                                onClick={() => setShowLegend(false)}
                            >
                                ×
                            </button>
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
                            <button
                                className="legend-close"
                                onClick={() => setShowLegend(false)}
                            >
                                ×
                            </button>
                            {/* Conteúdo da legenda do DotPlotTypes */}
                            <h3>Legenda do gráfico</h3>
                            <div className="legend-section">
                                <h4>Sobre o Gráfico:</h4>
                                <p>Este é um <strong>Dot Plot</strong> que mostra a relação entre músicas folk e seus tipos musicais.</p>
                            </div>
                            <div className="legend-section">
                                <h4>Como Ler:</h4>
                                <ul>
                                    <li><strong>Eixo Vertical (Y):</strong> Nomes das músicas</li>
                                    <li><strong>Eixo Horizontal (X):</strong> Tipos de música</li>
                                    <li><strong>Círculos:</strong> Indicam que uma música pertence a um tipo específico</li>
                                    <li><strong>Tamanho dos Círculos:</strong> Círculos maiores representam mais variações da música nesse tipo</li>
                                </ul>
                            </div>
                            <div className="legend-section">
                                <h4>Tamanhos:</h4>
                                <div className="size-legend">
                                    <div className="size-item">
                                        <div className="size-circle small" style={{
                                            width: '6px',
                                            height: '6px',
                                            backgroundColor: '#4a90e2',
                                            borderRadius: '50%',
                                            border: '1px solid #2c5aa0'
                                        }}></div>
                                        <span>Poucas variações</span>
                                    </div>
                                    <div className="size-item">
                                        <div className="size-circle medium" style={{
                                            width: '16px',
                                            height: '16px',
                                            backgroundColor: '#4a90e2',
                                            borderRadius: '50%',
                                            border: '1px solid #2c5aa0'
                                        }}></div>
                                        <span>Variações médias</span>
                                    </div>
                                    <div className="size-item">
                                        <div className="size-circle large" style={{
                                            width: '24px',
                                            height: '24px',
                                            backgroundColor: '#4a90e2',
                                            borderRadius: '50%',
                                            border: '1px solid #2c5aa0'
                                        }}></div>
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
                            <button
                                className="legend-close"
                                onClick={() => setShowLegend(false)}
                            >
                                ×
                            </button>
                            {/* Conteúdo da legenda do MidiHeatmapComparison */}
                            <h3>Legenda - Heat of the Melody</h3>

                            {/* Legenda de cores */}
                            <div className="legend-section">
                                <h4>Legenda de Cores</h4>
                                <div className="color-legend">
                                    <div className="color-bar">
                                        <div className="color-gradient"></div>
                                    </div>
                                    <div className="color-labels">
                                        <span>Baixa frequência</span>
                                        <span>Alta frequência</span>
                                    </div>
                                </div>
                                <p>As cores representam quantas vezes cada combinação de tempo (X) e pitch (Y) aparece nas variações da música.</p>
                            </div>

                            {/* Explicação do heatmap */}
                            <div className="legend-section">
                                <h4>O que é o Heatmap?</h4>
                                <p>
                                    Este heatmap mostra a densidade de pitches (notas musicais) ao longo do tempo para todas as variações de uma música.
                                    Cada célula representa uma combinação específica de momento temporal (eixo X) e altura do som (eixo Y).
                                </p>
                            </div>

                            {/* Instruções de uso */}
                            <div className="legend-section">
                                <h4>Como Usar</h4>
                                <ul>
                                    <li><strong>Zoom:</strong> Arraste uma área no gráfico principal para ampliá-la</li>
                                    <li><strong>Navegação:</strong> Use o minimap para ajustar a área visualizada</li>
                                    <li><strong>Filtros:</strong> Filtre músicas por compasso, modo ou tipo musical</li>
                                    <li><strong>Alta frequência:</strong> Destaque os padrões mais comuns da música</li>
                                    <li><strong>Tooltip:</strong> Passe o rato sobre as células para ver detalhes</li>
                                </ul>
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
            
            {/* Explicação geral */}
            <div className="legend-section">
              <h4>O que é um Chord Diagram?</h4>
              <p>
                O Chord Diagram mostra as relações de similaridade entre 6 músicas folk irlandesas. 
                Cada música é representada por um arco, e as ligações mostram o quão similares são entre si.
              </p>
            </div>

            {/* Elementos visuais */}
            <div className="legend-section">
              <h4>Elementos Visuais</h4>
              <div className="legend-item">
                <div className="legend-symbol arc-symbol"></div>
                <div className="legend-text">
                  <strong>Arcos (nós):</strong> Cada arco representa uma música folk. 
                  Clique num arco para ver a partitura da música.
                </div>
              </div>
              
              <div className="legend-item">
                <div className="legend-symbol ribbon-symbol"></div>
                <div className="legend-text">
                  <strong>Ligações (ribbons):</strong> Mostram a similaridade entre duas músicas. 
                  Ligações mais grossas = maior similaridade.
                </div>
              </div>
            </div>

            {/* Como interpretar */}
            <div className="legend-section">
              <h4>Como Interpretar a Similaridade</h4>
              <p>A similaridade é calculada com base em:</p>
              <ul>
                <li><strong>70% Notas Musicais:</strong> Notas comuns entre as melodias</li>
                <li><strong>30% Atributos:</strong> Modo, tipo e compasso (meter)</li>
              </ul>
            </div>

            {/* Interações */}
            <div className="legend-section">
              <h4>Interações</h4>
              <ul>
                <li><strong>Hover sobre ligações:</strong> Vê detalhes da similaridade</li>
                <li><strong>Clique nos arcos:</strong> Abre a partitura musical</li>
                <li><strong>Filtros de atributos:</strong> Personaliza o cálculo da similaridade</li>
                <li><strong>Trocar músicas:</strong> Seleciona 6 novas músicas aleatórias</li>
              </ul>
            </div>

            {/* Cores */}
            <div className="legend-section">
              <h4>Cores</h4>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: '#82813E'}}></div>
                <span>Cor principal para arcos e ligações</span>
              </div>
            </div>

                            
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
