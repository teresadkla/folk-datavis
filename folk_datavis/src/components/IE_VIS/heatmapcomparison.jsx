import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import "../../css/comparison.css";

// Lê a variável CSS para a fonte secundária do tema atual
const fontText = getComputedStyle(document.documentElement)
  .getPropertyValue('--font-secondary')
  .trim();

const MidiHeatmapComparison = ({active}) => {
  const svgRef = useRef(); // Referência ao elemento SVG
  const [allNames, setAllNames] = useState([]); // Lista com os nomes com múltiplas versões
  const [pitchData, setPitchData] = useState([]); // Dados brutos carregados do JSON
  const [selectedName, setSelectedName] = useState(null); // Nome atualmente selecionado no dropdown
  const [zoomRange, setZoomRange] = useState([0, 100]); // Range de zoom em percentagem

  // Margens e dimensões do gráfico
  const margin = { top: 50, right: 140, bottom: 50, left: 70 }; // Voltou ao normal
  const width = 1500 - margin.left - margin.right;
  const height = 700 - margin.top - margin.bottom;

  // Carrega os dados na primeira renderização
  useEffect(() => {
    d3.json("pitch_compressed.json").then(jsonData => {
      // Conta quantas vezes cada nome aparece
      const nameCounts = d3.rollup(jsonData, v => v.length, d => d.name);

      // Filtra nomes que têm mais de uma versão (variações musicais)
      const multiVersionNames = Array.from(nameCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([name]) => name);

      setAllNames(multiVersionNames);
      setPitchData(jsonData);
      setSelectedName(multiVersionNames[0]); // Seleciona o primeiro nome por padrão
    });
  }, []);

  // Filtragem de dados memorizada
  const variations = useMemo(() => {
    if (!selectedName || pitchData.length === 0) return [];
    return pitchData.filter(d => d.name === selectedName);
  }, [selectedName, pitchData]);

  // Construção de heatmapData memorizada
  const heatmapData = useMemo(() => {
    if (variations.length === 0) return [];
    const data = [];
    variations.forEach(variation => {
      variation.midiValues.forEach((pitch, idx) => {
        data.push({ x: idx, y: pitch });
      });
    });
    return data;
  }, [variations]);

  // Outros cálculos memorizados
  const { xMax, yExtent, filteredHeatmapData } = useMemo(() => {
    if (heatmapData.length === 0) return { xMax: 0, yExtent: [0, 0], filteredHeatmapData: [] };
    
    const xMax = d3.max(heatmapData, d => d.x);
    const yExtent = d3.extent(heatmapData, d => d.y);
    
    const xStart = Math.floor((zoomRange[0] / 100) * xMax);
    const xEnd = Math.ceil((zoomRange[1] / 100) * xMax);
    
    const filteredData = heatmapData.filter(d => d.x >= xStart && d.x <= xEnd);
    
    return { xMax, yExtent, filteredHeatmapData: filteredData };
  }, [heatmapData, zoomRange]);

  // Atualiza o gráfico toda vez que o nome selecionado, os dados ou o zoom mudarem
  useEffect(() => {
    if (!selectedName || pitchData.length === 0) return;

    // Seleciona o SVG e define suas dimensões
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    svg.selectAll("*").remove(); // Limpa o SVG antes de redesenhar

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Filtra as variações do nome selecionado
    const variations = pitchData.filter(d => d.name === selectedName);

    // Constrói uma matriz com os dados de tempo (x) e pitch (y)
    const heatmapData = [];
    variations.forEach(variation => {
      variation.midiValues.forEach((pitch, idx) => {
        heatmapData.push({ x: idx, y: pitch });
      });
    });

    // Define escalas de eixos com base nos dados
    const xMax = d3.max(heatmapData, d => d.x);
    const yExtent = d3.extent(heatmapData, d => d.y);

    // Calcula o range de X baseado no zoom
    const xStart = Math.floor((zoomRange[0] / 100) * xMax);
    const xEnd = Math.ceil((zoomRange[1] / 100) * xMax);

    // Filtra dados do heatmap para o range de zoom
    const filteredHeatmapData = heatmapData.filter(d => d.x >= xStart && d.x <= xEnd);

    const xScale = d3.scaleLinear().domain([xStart, xEnd]).range([0, width]);
    const yScale = d3.scaleLinear().domain([yExtent[0], yExtent[1] + 1]).range([height, 0]);

    // Define o tamanho dos "bins" (caixas) para agregação
const desiredBinCount = 200; // ou outro valor que faça sentido visualmente
    const binSizeX = Math.max(1, Math.floor((xEnd - xStart) / desiredBinCount));
    const binSizeY = 1;

    // Agrupa os dados filtrados por bin e conta quantos pontos caem em cada um
    const bins = d3.rollup(
      filteredHeatmapData,
      v => v.length,
      d => Math.floor(d.x / binSizeX),
      d => Math.floor(d.y / binSizeY)
    );

    // Transforma os bins em um array de objetos com x, y e contagem
    const density = [];
    for (let [xBin, yMap] of bins.entries()) {
      for (let [yBin, count] of yMap.entries()) {
        density.push({
          x: xBin * binSizeX,
          y: yBin * binSizeY,
          count
        });
      }
    }

    // Define escala de cor com interpolação LAB para melhor percepção visual
    const maxCount = d3.max(density, d => d.count);
    const color = d3.scaleLinear()
      .domain([1, maxCount / 2, maxCount])
      .range(["#82813E", "#CC5C25"]) // Laranja e verde
      .interpolate(d3.interpolateLab);

    // Cria o tooltip (balão de informação)
    const tooltip = d3.select(".midi-chart-container")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("font-size", "12px");

    // Desenha os retângulos do heatmap
    g.selectAll("rect")
      .data(density)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.x))
      .attr("y", d => yScale(d.y + binSizeY))
      .attr("width", Math.max(1, xScale(binSizeX) - xScale(0)))
      .attr("height", yScale(yExtent[0]) - yScale(yExtent[0] + binSizeY))
      .attr("rx", 2) // Raio dos cantos arredondados horizontal
      .attr("ry", 2) // Raio dos cantos arredondados vertical
      .attr("fill", d => color(d.count))
      .attr("stroke", "none")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `Tempo (x): ${d.x}<br/>
             Pitch (y): ${d.y}<br/>
             Contagem: ${d.count}`
          );
      })
      .on("mousemove", event => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    // Adiciona linhas horizontais para cada valor de pitch (melhor leitura)
    for (let yVal = yExtent[0]; yVal <= yExtent[1]; yVal++) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", yScale(yVal))
        .attr("y2", yScale(yVal))
        .attr("stroke", "#888")
        .attr("stroke-opacity", 0.15)
        .attr("stroke-width", 1);
    }

    // Eixo X
    g.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-family", fontText)
      .style("font-size", "14px");

    // Eixo Y
    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-family", fontText)
      .style("font-size", "14px");



    // ============ LEGENDA DE CORES ============

    const legendHeight = 200;
    const legendWidth = 20;

    // Escala da legenda vertical - agora começando em 1
    const legendScale = d3.scaleLinear()
      .domain([1, maxCount])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
      .tickValues([1, ...d3.ticks(1, maxCount, 4), maxCount])
      .tickFormat(d3.format(".0f"));

    // Gradiente de cor para a legenda
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    // Adiciona stops (faixas de cor) ao gradiente - agora começando em 1
    const legendSteps = 10;
    for (let i = 0; i < legendSteps; i++) {
      const t = i / (legendSteps - 1); // t vai de 0 a 1
      const value = 1 + t * (maxCount - 1); // value vai de 1 a maxCount
      linearGradient.append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", color(value));
    }

    // Retângulo da legenda com gradiente
    svg.append("g")
      .attr("transform", `translate(${width + margin.left + 20}, ${margin.top})`)
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    // Eixo da legenda
    svg.append("g")
      .attr("transform", `translate(${width + margin.left + 20 + legendWidth}, ${margin.top})`)
      .call(legendAxis)
      .selectAll("text")
      .style("font-family", fontText)
      .style("font-size", "12px");

    // Título da legenda
    svg.append("text")
      .attr("x", width + margin.left + 10)
      .attr("y", margin.top - 10)
      .text("Frequência")
      .style("font-family", fontText)
      .style("font-size", "12px")
      .style("font-weight", "bold");

  }, [selectedName, pitchData, zoomRange]);

  return (
    <div className="midi-chart-container">
      {/* Dropdown de seleção de nome/música */}
      <select
        className="music-select"
        onChange={(e) => setSelectedName(e.target.value)}
        value={selectedName || ""}
      >
        {allNames.map((name, idx) => (
          <option key={idx} value={name}>{name}</option>
        ))}
      </select>

      {/* Número de variações disponíveis para o nome selecionado */}
      <div style={{ float: "right", marginLeft: "20px", fontWeight: "bold" }}>
        {selectedName && pitchData.length > 0 && (
          (() => {
            const variations = pitchData.filter(d => d.name === selectedName);
            return `Nº de variações: ${variations.length}`;
          })()
        )}
      </div>
      {/* Elemento SVG onde o gráfico será desenhado */}
      <svg ref={svgRef}></svg>
       {/* Controles de zoom simples */}
      <div style={{ clear: "both", marginTop: "20px", marginBottom: "20px" }}>
        <h4 style={{ margin: "0 0 10px 0", fontFamily: fontText }}>Zoom no Eixo X:</h4>
        
        <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontFamily: fontText, fontSize: "14px", minWidth: "60px" }}>Início:</label>
            <input
              type="range"
              min="0"
              max="99"
              value={zoomRange[0]}
              onChange={(e) => {
                const newStart = parseInt(e.target.value);
                if (newStart < zoomRange[1]) {
                  setZoomRange([newStart, zoomRange[1]]);
                }
              }}
              style={{ width: "200px" }}
            />
            <span style={{ fontFamily: fontText, fontSize: "14px", minWidth: "40px" }}>{zoomRange[0]}%</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontFamily: fontText, fontSize: "14px", minWidth: "60px" }}>Fim:</label>
            <input
              type="range"
              min="1"
              max="100"
              value={zoomRange[1]}
              onChange={(e) => {
                const newEnd = parseInt(e.target.value);
                if (newEnd > zoomRange[0]) {
                  setZoomRange([zoomRange[0], newEnd]);
                }
              }}
              style={{ width: "200px" }}
            />
            <span style={{ fontFamily: fontText, fontSize: "14px", minWidth: "40px" }}>{zoomRange[1]}%</span>
          </div>
          
          <button
            onClick={() => setZoomRange([0, 100])}
            style={{
              padding: "5px 15px",
              backgroundColor: "#CC5C25",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: fontText,
              fontSize: "12px"
            }}
          >
            Reset Zoom
          </button>
        </div>
      </div>
    </div>
  );
};

export default MidiHeatmapComparison;