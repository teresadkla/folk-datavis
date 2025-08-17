import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as abcjs from "abcjs";
import Papa from "papaparse";
import ABCVisualizer from "./picthabc";
import MidiComparison from "./melodicline";
import "../../css/chord.css";

const ChordDiagramABC = () => {
  const svgRef = useRef();
  const [musicData, setMusicData] = useState([]);
  const [allTunes, setAllTunes] = useState([]); // Guarda todas as músicas carregadas
  const [selected, setSelected] = useState(null);
  const [selectedPair, setSelectedPair] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({
    mode: true,
    type: true,
    meter: true
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Estado de carregamento
  const [loadingText, setLoadingText] = useState("Carregando dados..."); // Texto do loading

  // Carrega todas as músicas apenas uma vez
  useEffect(() => {
    setIsLoading(true);
    setLoadingText("Carregando músicas...");

    Papa.parse("/sets.csv", {
      download: true,
      header: true,
      complete: (result) => {
        setLoadingText("Processando dados musicais...");

        setTimeout(() => {
          const tunes = result.data.filter(d => d.name && d.abc);
          setAllTunes(tunes);
          setMusicData(d3.shuffle(tunes).slice(0, 6));

          setLoadingText("Finalizando...");

          // Pequeno delay para mostrar que terminou
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
        }, 300);
      },
      error: (error) => {
        console.error("Erro ao carregar dados:", error);
        setLoadingText("Erro ao carregar dados");
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    });
  }, []);

  useEffect(() => {
    if (musicData.length < 6) return;

    // Função para extrair notas de uma string ABC
    const extractNotes = (abcText) => {
      let cleaned = abcText
        .replace(/~+/g, '')           // Remove ornaments
        .replace(/\(\d+\.[^)]*\)/g, '') // Remove triplets like (3.g.f.e
        .replace(/[|:]/g, '')         // Remove bar lines and repeat marks
        .replace(/\d+/g, '')          // Remove numbers (durations)
        .replace(/[.,]/g, '')         // Remove dots and commas
        .replace(/[\s\n]/g, '');      // Remove whitespace and newlines
      return cleaned.match(/[A-Ga-g]/g) || [];
    };

    // Calcula matriz de similaridade entre todas as músicas
    const similarity = Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => {
        if (i === j) return { value: 1, shared: [], notesA: [], notesB: [], sharedNotes: [], attributeMatches: { mode: true, type: true, meter: true } };
        const notesA = extractNotes(musicData[i].abc);
        const notesB = extractNotes(musicData[j].abc);
        const sharedNotes = notesA.filter(note => notesB.includes(note));
        const uniqueSharedNotes = [...new Set(sharedNotes)];
        const allUniqueNotes = [...new Set([...notesA, ...notesB])];
        const noteSimilarity = uniqueSharedNotes.length / allUniqueNotes.length;

        const tuneA = musicData[i];
        const tuneB = musicData[j];
        const attributeMatches = {
          mode: tuneA.mode === tuneB.mode,
          type: tuneA.type === tuneB.type,
          meter: tuneA.meter === tuneB.meter
        };

        // Calcula similaridade de atributos selecionados
        const selectedAttributesArray = Object.keys(selectedAttributes).filter(attr => selectedAttributes[attr]);
        const selectedAttributeMatches = selectedAttributesArray.filter(attr => attributeMatches[attr]).length;
        const attributeSimilarity = selectedAttributesArray.length > 0
          ? selectedAttributeMatches / selectedAttributesArray.length
          : 0;

        // Combina similaridade de notas e atributos (70% notas, 30% atributos)
        const combinedSimilarity = (noteSimilarity * 0.7) + (attributeSimilarity * 0.3);
        return {
          value: combinedSimilarity,
          shared: uniqueSharedNotes,
          notesA, notesB, sharedNotes,
          totalNotesA: notesA.length,
          totalNotesB: notesB.length,
          sharedCount: sharedNotes.length,
          uniqueNotesA: [...new Set(notesA)].length,
          uniqueNotesB: [...new Set(notesB)].length,
          noteSimilarity,
          attributeSimilarity,
          attributeMatches,
          selectedAttributes: selectedAttributesArray
        };
      })
    );

    // Matriz para o diagrama de acordes (sem auto-ligações)
    const matrix = similarity.map(row => row.map(cell => cell.value));
    for (let i = 0; i < matrix.length; i++) matrix[i][i] = 0;

    // Parâmetros do SVG e do diagrama
    const width = 500;
    const height = 500;
    const innerRadius = width / 2 - 50;
    const outerRadius = innerRadius + 15;

    // Escalas e geradores D3
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const ribbon = d3.ribbon().radius(innerRadius);
    const chords = chord(matrix);
    const filteredChords = chords.filter(d => d.source.index !== d.target.index);

    // Tooltip D3 para mostrar informações ao passar o mouse
    const tooltip = d3.select("body")
      .selectAll(".chord-tooltip")
      .data([0])
      .join("div")
      .attr("class", "chord-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("font-size", "12px")
      .style("max-width", "350px")
      .style("z-index", "1000");

    // Limpa SVG anterior e configura novo SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const svgWidth = 800;
    const svgHeight = 800;
    const translateX = (svgWidth - width) / 2 + width / 2;
    const translateY = (svgHeight - height) / 2 + height / 2;

    svg
      .attr("viewBox", [0, 0, svgWidth, svgHeight])
      .append("g")
      .attr("transform", `translate(${translateX},${translateY})`);

    const g = svg.select("g");

    // Desenha os arcos dos grupos (nós)
    const group = g
      .append("g")
      .selectAll("g")
      .data(chords.groups)
      .join("g");

    group
      .append("path")
      .attr("fill", "#82813E") // Cor dos nós
      .attr("stroke", "#82813E")
      .attr("stroke-width", 1)
      .attr("d", arc)
      .on("click", (event, d) => {
        setSelected(musicData[d.index]); // Mostra popup ao clicar no nó
      });

    // Adiciona nomes dos grupos (músicas)
    group
      .append("text")
      .each(d => {
        d.angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr("dy", ".35em")
      .attr("transform", d => `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${outerRadius + 8})${d.angle > Math.PI ? " rotate(180)" : ""}`)
      .attr("text-anchor", d => (d.angle > Math.PI ? "end" : "start"))
      .attr("font-size", "11px")
      .text(d => musicData[d.index].name);

    // Desenha as ligações (ribbons) entre os nós
    g.append("g")
      .attr("fill-opacity", 0.67)
      .selectAll("path")
      .data(filteredChords)
      .join("path")
      .attr("d", ribbon)
      .attr("fill", "#82813E") // Cor das ligações
      .attr("stroke", "#82813E") // Cor da borda das ligações
      .style("cursor", "pointer") // Cursor pointer nas ligações
      .attr("opacity", 1) // Opacidade padrão
      .on("mouseover", function (event, d) {
        // Destaca a ligação atual aumentando a opacidade
        d3.select(this).attr("opacity", 1);
        // Reduz a opacidade das outras ligações
        d3.select(this.parentNode)
          .selectAll("path")
          .filter(function (e) { return e !== d; })
          .attr("opacity", 0.3);

        // Tooltip com informações detalhadas de similaridade
        const sourceIdx = d.source.index;
        const targetIdx = d.target.index;
        const simData = similarity[sourceIdx][targetIdx];
        const sourceName = musicData[sourceIdx].name;
        const targetName = musicData[targetIdx].name;
        const tuneA = musicData[sourceIdx];
        const tuneB = musicData[targetIdx];

        // Mostra apenas atributos selecionados
        const attributeInfo = Object.keys(selectedAttributes)
          .filter(attr => selectedAttributes[attr])
          .map(attr => {
            const match = simData.attributeMatches[attr] ? '✓' : '✗';
            const valueA = tuneA[attr] || 'N/A';
            const valueB = tuneB[attr] || 'N/A';
            return `<strong>${attr.charAt(0).toUpperCase() + attr.slice(1)}:</strong> ${valueA} ${match} ${valueB}`;
          }).join('<br/>');

        const selectedAttributesText = simData.selectedAttributes.length > 0
          ? simData.selectedAttributes.join(', ')
          : 'Nenhum';

        const tooltipContent = `
<strong>${sourceName} ↔ ${targetName}</strong><br/>
<strong>Similaridade Total:</strong> ${(simData.value * 100).toFixed(1)}%<br/>
<strong>Similaridade de Notas:</strong> ${(simData.noteSimilarity * 100).toFixed(1)}%<br/>
<strong>Similaridade de Atributos:</strong> ${(simData.attributeSimilarity * 100).toFixed(1)}%<br/>
<hr style="margin: 5px 0; border: 0.5px solid #ccc;">
<strong>Atributos Selecionados:</strong> ${selectedAttributesText}<br/>
${attributeInfo ? attributeInfo + '<br/>' : ''}
<hr style="margin: 5px 0; border: 0.5px solid #ccc;">
<strong>Notas totais:</strong> ${simData.totalNotesA} ↔ ${simData.totalNotesB}<br/>
<strong>Notas únicas:</strong> ${simData.uniqueNotesA} ↔ ${simData.uniqueNotesB}<br/>
<strong>Notas únicas partilhadas:</strong><br/>
${simData.shared.join(', ') || 'Nenhuma'}<br/>
 <small><em>Similaridade: 70% notas + 30% atributos</em></small>
`;

        tooltip.html(tooltipContent)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .transition().duration(200).style("opacity", 1);
      })
      .on("mousemove", (event) => {
        // Atualiza posição do tooltip ao mover o mouse
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function () {
        // Restaura a opacidade de todas as ligações
        d3.select(this.parentNode)
          .selectAll("path")
          .attr("opacity", 1);
        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Remove tooltip ao desmontar componente
    return () => {
      d3.select("body").selectAll(".chord-tooltip").remove();
    };
  }, [musicData, selectedAttributes]);

  const handleAttributeChange = (attribute) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attribute]: !prev[attribute]
    }));
  };

  const resetToDefault = () => {
    setSelectedAttributes({
      mode: true,
      type: true,
      meter: true
    });
  };

  // Função para trocar as 6 músicas exibidas
  const handleShuffleTunes = () => {
    setIsLoading(true);
    setLoadingText("Selecionando novas músicas...");

    setTimeout(() => {
      setMusicData(d3.shuffle(allTunes).slice(0, 6));
      setLoadingText("Calculando similaridades...");

      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    }, 300);
  };

  return (
    <div className="chord-diagram-container">
      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">{loadingText}</div>
          </div>
        </div>
      )}

      <div className="controls-container">
        {/* Botão para trocar as 6 músicas */}
        <button
          onClick={handleShuffleTunes}
          disabled={isLoading}
          className={`shuffle-button ${isLoading ? 'disabled' : ''}`}
        >
          🔀 {isLoading ? 'Carregando...' : 'Trocar Músicas'}
        </button>

        <div className="filters-wrapper">
          <button
            onClick={() => setShowFilters(!showFilters)}
            disabled={isLoading}
            className={`filters-button ${isLoading ? 'disabled' : ''}`}
          >
            Atributos de similaridade {showFilters ? '▲' : '▼'}
          </button>

          {showFilters && !isLoading && (
            <div className="filters-dropdown">
              {Object.keys(selectedAttributes).map(attr => (
                <label key={attr} className="attribute-label">
                  <input
                    type="checkbox"
                    checked={selectedAttributes[attr]}
                    onChange={() => handleAttributeChange(attr)}
                    className="attribute-checkbox"
                  />
                  <span className="attribute-text">{attr}</span>
                </label>
              ))}

              <button
                onClick={resetToDefault}
                className="clear-filters-button"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      <svg ref={svgRef} width={800} height={800} />

      {selected && (
        <div className="popup-overlay">
          <div className="popup-content">
            <ABCVisualizer
              abc={selected.abc}
              name={selected.name}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>
      )}
      {selectedPair && (
        <div className="popup-overlay">
          <div className="popup-content">
            <MidiComparison
              pitchData={musicData}
              nameA={selectedPair.nameA}
              nameB={selectedPair.nameB}
              onClose={() => setSelectedPair(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChordDiagramABC;
