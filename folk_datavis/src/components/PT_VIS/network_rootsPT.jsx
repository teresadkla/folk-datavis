import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/ramification.css";

// Importar o script perlin.js do public
const script = document.createElement('script');
script.src = '/perlin.js';
document.head.appendChild(script);

const NetworkDiagram = () => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [showLegend, setShowLegend] = useState(false); // Estado para o pop-up

  useEffect(() => {
    const width = 1000;
    const height = 800;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const container = svg.append("g")
      .attr("transform", `scale(0.8) translate(${width * 0.10}, ${height * 0.10})`);

    const tooltip = d3.select(tooltipRef.current);
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Escala para o tamanho das flores baseado no número de ocorrências
    const flowerSizeScale = d3.scaleLinear().range([0.2, 0.7]); // escala de 0.3x a 1.5x do tamanho original
    const regionSizeScale = d3.scaleLinear().range([100, 400]); // escala para círculos das regiões

    //Path SVG da "flor"
    const flowerPath = "M36.77,21.76c1.26-2.07,4.77-1.66,6.08.38s.73,4.85-.72,6.8c-.86,1.16-2.04,2.13-3.43,2.52-3.64,1.04-7.21-2.07-8.91-5.45-1.04-2.06-1.7-4.33-1.73-6.63-.08-5.4,3.38-10.4,7.88-13.38s9.92-4.23,15.28-4.94c4.98-.66,10.09-.89,15.01.14,4.92,1.03,9.67,3.43,12.85,7.32s4.57,9.39,2.92,14.14c-.97,2.8-2.97,5.24-5.52,6.75-2.72,1.61-6.68,1.92-8.66-.54-.71-.89-1.06-2.03-1.19-3.16-.26-2.39.67-5.12,2.87-6.09,2.2-.97,5.33.97,4.78,3.31,1.49-4.66-1.12-9.94-5.2-12.63s-9.26-3.2-14.13-2.68c-3.43.37-6.85,1.22-9.85,2.91-3.58,2.01-6.48,5.19-8.16,8.93-.55,1.23-.64,3.09-.16,2.3ZM59.9,49.42,93.64,34.81c3.74,1.68,6.92,4.58,8.93,8.16,1.69,3.01,2.54,6.43,2.91,9.85.52,4.86.02,10.04-2.68,14.13-2.69,4.08-7.97,6.69-12.63,5.2,2.34.55,4.28-2.58,3.31-4.78s-3.7-3.13-6.09-2.87c-1.13.12-2.27.47-3.16,1.19-2.46,1.97-2.15,5.94-.54,8.66,1.51,2.55,3.94,4.54,6.75,5.52,4.75,1.65,10.24.26,14.14-2.92s6.29-7.93,7.32-12.85.8-10.02.14-15.01c-.71-5.35-1.96-10.78-4.94-15.28s-7.98-7.95-13.38-7.88c-2.3.03-4.57.7-6.63,1.73-3.38,1.7-6.48,5.28-5.45,8.91.4,1.39,1.36,2.57,2.52,3.43,1.94,1.45,4.75,2.03,6.8.72s2.45-4.82.38-6.08c-.78-.48,1.07-.39,2.3.16ZM76.09,93.99c-1.68,3.74-4.58,6.92-8.16,8.93-3.01,1.69-6.43,2.54-9.85,2.91-4.86.52-10.04.02-14.13-2.68s-6.69-7.97-5.2-12.63c-.55,2.34,2.58,4.28,4.78,3.31s3.13-3.7,2.87-6.09c-.12-1.13-.47-2.27-1.19-3.16-1.97-2.46-5.94-2.15-8.66-.54-2.55,1.51-4.54,3.94-5.52,6.75-1.65,4.75-.26,10.24,2.92,14.14s7.93,6.29,12.85,7.32,10.02.8,15.01.14c5.35-.71,10.78-1.96,15.28-4.94,4.5-2.98,7.95-7.98,7.88-13.38-.03-2.3-.7-4.57-1.73-6.63-1.7-3.38-5.28-6.48-8.91-5.45-1.39.4-2.57,1.36-3.43,2.52-1.45,1.94-2.03,4.75-.72,6.8,1.31,2.04,4.82,2.45,6.08.38.48-.78.39,1.07-.16,2.3ZM19.46,73.2c-3.74-1.68-6.92-4.58-8.93-8.16-1.69-3.01-2.54-6.43-2.91-9.85-.52-4.86-.02-10.04,2.68-14.13s7.97-6.69,12.63-5.2c-2.34-.55-4.28,2.58-3.31,4.78s3.7,3.13,6.09,2.87c1.13-.12,2.27-.47,3.16-1.19,2.46-1.97,2.15-5.94.54-8.66-1.51-2.55-3.94-4.54-6.75-5.52-4.75-1.65-10.24-.26-14.14,2.92-3.89,3.18-6.29,7.93-7.32,12.85s-.8,10.02-.14,15.01c.71,5.35,1.96,10.78,4.94,15.28,2.98,4.5,7.98,7.95,13.38,7.88,2.3-.03,4.57-.7,6.63-1.73,3.38-1.7,6.48-5.28,5.45-8.91-.4-1.39-1.36-2.57-2.52-3.43-1.94-1.45-4.75-2.03-6.8-.72s-2.45,4.82-.38,6.08c.78.48-1.07.39-2.3-.16ZM59.9,45.99c0-9.14-5.85-14.32-5.85-14.32-8.23,12.03-4.57,15.24-4.57,15.24,4.27-9.9,10.42-.91,10.42-.91ZM62.6,59.91c9.14,0,14.32-5.85,14.32-5.85-12.03-8.23-15.24-4.57-15.24-4.57,9.9,4.27.91,10.42.91,10.42ZM50.93,64.14c0,9.14,5.85,14.32,5.85,14.32,8.23-12.03,4.57-15.24,4.57-15.24-4.27,9.9-10.42.91-10.42.91ZM46.61,51.11c-9.14,0-14.32,5.85-14.32,5.85,12.03,8.23,15.24,4.57,15.24,4.57-9.9-4.27-.91-10.42-.91-10.42ZM54.6,49.32c-3.37,0-6.09,2.73-6.09,6.09s2.73,6.09,6.09,6.09,6.09-2.73,6.09-6.09-2.73-6.09-6.09-6.09ZM81.43,5.3s8.15,3.38,6.79,15.25c0,0,11.55-4.52,19.07,2.61,0,0,2.23-4.79-3.7-10.46,0,0,4.09-4.03,2.89-10.68,0,0-6.54-1.96-12.53,3.87,0,0-5.19-5.23-12.51-.6ZM88.19,21.71,58.28,50.5l29.94-29.94M104.66,82.63s-3.38,8.15-15.25,6.79c0,0,4.52,11.55-2.61,19.07,0,0,4.79,2.23,10.46-3.7,0,0,4.03,4.09,10.68,2.89,0,0,1.96-6.54-3.87-12.53,0,0,5.23-5.19.6-12.51ZM89.41,89.42l-29.94-29.94M27.78,105.74s-8.15-3.38-6.79-15.25c0,0-11.55,4.52-19.07-2.61,0,0-2.23,4.79,3.7,10.46,0,0-4.09,4.03-2.89,10.68,0,0,6.54,1.96,12.53-3.87,0,0,5.19,5.23,12.51.6ZM20.99,90.49l29.94-29.94M5.1,27.49s3.38-8.15,15.25-6.79c0,0-4.52-11.55,2.61-19.07,0,0-4.79-2.23-10.46,3.7,0,0-4.03-4.09-10.68-2.89,0,0-1.96,6.54,3.87,12.53,0,0-5.23,5.19-.6,12.51ZM50.3,50.64l-29.94-29.94";

    d3.csv("VIMEO_V8.csv").then(data => {
      const themeCounts = {};
      const themeRegionCounts = {};
      const regionSet = new Set();

      data.forEach(d => {
        const tema = d.Tema;
        const regiao = d.Região;
        regionSet.add(regiao);
        if (!themeCounts[tema]) themeCounts[tema] = 0;
        themeCounts[tema]++;
        const key = `${tema}||${regiao}`;
        if (!themeRegionCounts[key]) themeRegionCounts[key] = 0;
        themeRegionCounts[key]++;
      });

      const repeatedThemes = Object.keys(themeCounts).filter(t => themeCounts[t] > 13);
      const nodes = [];
      const links = [];
      const nodeByName = {};

      // Definir domínios das escalas baseado nos dados
      const maxThemeCount = d3.max(Object.values(themeCounts));
      const minThemeCount = d3.min(Object.values(themeCounts));
      
      flowerSizeScale.domain([minThemeCount, maxThemeCount]);
      regionSizeScale.domain([1, d3.max(Object.values(themeRegionCounts))]);

      repeatedThemes.forEach(theme => {
        const node = { id: theme, type: "tema", count: themeCounts[theme] };
        nodes.push(node);
        nodeByName[theme] = node;
      });

      regionSet.forEach(region => {
        const node = { id: region, type: "regiao" };
        nodes.push(node);
        nodeByName[region] = node;
      });

      Object.entries(themeRegionCounts).forEach(([key, count]) => {
        const [tema, regiao] = key.split("||");
        if (repeatedThemes.includes(tema)) {
          links.push({ source: tema, target: regiao, value: count });
        }
      });

      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(90).strength(1))
        .force("charge", d3.forceManyBody().strength(-1500))
        .force("center", d3.forceCenter(width / 2, height / 2));

      const link = container.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("stroke", "#6B3F21")
        .attr("stroke-width", d => Math.sqrt(d.value))
        .attr("stroke-opacity", 0.6)
        .attr("fill", "none");

      const node = container.append("g")
        .attr("class", "nodes")
        .selectAll("path")
        .data(nodes)
        .join("path")
        .attr("class", d => `node ${d.type}`)
        .attr("d", d => {
          if (d.type === "tema") {
            return flowerPath;
          } else {
            return d3.symbol().type(d3.symbolCircle).size(regionSizeScale(1))();
          }
        })
        .attr("fill", d => d.type === "regiao" ? "#E09D2C" : "#C33512")
        .attr("fill-opacity", 0.9)
        .on("mouseover", (event, d) => {
          if (d.type === "tema") {
            tooltip
              .style("display", "block")
              .html(`<strong>${d.id}</strong><br/>Ocorrências: ${d.count}`);
          }
        })
        .on("mousemove", event => {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", () => {
          tooltip.style("display", "none");
        })
        .on("click", (event, d) => {
          if (d.type === "tema") highlightConnections(d.id);
          event.stopPropagation();
        })
        .call(drag(simulation));

      const label = container.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text(d => d.type === "regiao" ? d.id : "")
        .attr("font-size", "10px")
        .attr("dx", 10)
        .attr("dy", "0.35em")
        .style("opacity", 0);

      simulation.on("tick", () => {
        link.attr("d", d => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const midX = (d.source.x + d.target.x) / 2;
          const midY = (d.source.y + d.target.y) / 2;
          const perpX = -dy / distance;
          const perpY = dx / distance;
          const curveIntensity = Math.min(distance * 0.5, 50);
          const time = Date.now() * 0.0001;
          const noiseScale = 0.02;
          const perlinOffset = noise.perlin3(midX * noiseScale, midY * noiseScale, time) * 100;
          const controlX = midX + (perpX * curveIntensity) + perlinOffset;
          const controlY = midY + (perpY * curveIntensity) + perlinOffset;

          const segments = 300;
          let path = `M ${d.source.x} ${d.source.y}`;

          for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const t2 = t * t;
            const mt = 1 - t;
            const mt2 = mt * mt;

            const x = mt2 * d.source.x + 2 * mt * t * controlX + t2 * d.target.x;
            const y = mt2 * d.source.y + 2 * mt * t * controlY + t2 * d.target.y;

            const segmentNoise = noise.perlin3(x * noiseScale * 2, y * noiseScale * 2, time) * 8;
            const segmentNoiseY = noise.perlin3(y * noiseScale * 2, x * noiseScale * 2, time + 100) * 8;

            path += ` L ${x + segmentNoise} ${y + segmentNoiseY}`;
          }

          return path;
        });

        node.attr("transform", d => {
          if (d.type === "tema") {
            const scale = flowerSizeScale(d.count);
            const offset = -60 * scale; // ajustar offset baseado na escala
            return `translate(${d.x + offset}, ${d.y + offset}) scale(${scale})`;
          } else {
            return `translate(${d.x}, ${d.y})`;
          }
        });

        label.attr("x", d => d.x).attr("y", d => d.y);
      });

      function drag(simulation) {
        function dragstarted(event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }

        function dragged(event, d) {
          d.fx = event.x;
          d.fy = event.y;
        }

        function dragended(event, d) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }

        return d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      }

      function highlightConnections(selectedId) {
        node.style("opacity", n =>
          n.id === selectedId || links.some(l =>
            (l.source.id === selectedId && l.target.id === n.id) ||
            (l.target.id === selectedId && l.source.id === n.id)) ? 1 : 0.1
        );
        link.style("opacity", l =>
          l.source.id === selectedId || l.target.id === selectedId ? 1 : 0.1
        );
        label.style("opacity", n =>
          n.type === "regiao" && links.some(l =>
            (l.source.id === selectedId && l.target.id === n.id) ||
            (l.target.id === selectedId && l.source.id === n.id)) ? 1 : 0
        );
      }

      svg.on("click", () => resetHighlight());

      function resetHighlight() {
        node.style("opacity", 1);
        link.style("opacity", 0.6);
        label.style("opacity", 0);
      }
    });
  }, []);

  return (
    <div>
        <svg ref={svgRef}></svg>
      <div ref={tooltipRef} className="tooltip_roots" />
      <button
        className="legend-btn"
        onClick={() => setShowLegend(true)}
      >
        Ver legenda
      </button>
      {showLegend && (
        <div
          className="legend-popup-overlay"
          onClick={() => setShowLegend(false)}
        >
          <div
            className="legend-popup-content"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="legend-popup-close"
              onClick={() => setShowLegend(false)}
              aria-label="Fechar legenda"
            >
              ×
            </button>
            <h3>Legenda</h3>
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
        </div>
      )}
    
    </div>
  );
};

export default NetworkDiagram;