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
    const width = 900;
    const height = 700;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const container = svg.append("g")
      .attr("transform", `scale(0.9) translate(${width * 0.5}, ${height * 0.6})`);//controla a posição da visualização noo svg viewbox

    const tooltip = d3.select(tooltipRef.current);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Escala para o tamanho das flores baseado no número de ocorrências
    const flowerSizeScale = d3.scaleLinear().range([0.2, 0.5]); // escala de 0.3x a 1.5x do tamanho original
    const regionSizeScale = d3.scaleLinear().range([100, 500]); // escala para círculos das regiões

    //Path SVG da "flor"
    const flowerPath = "M142.54,71.27c0,39.36-31.91,71.27-71.27,71.27S0,110.64,0,71.27,31.91,0,71.27,0s71.27,31.91,71.27,71.27Z"
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
        .force("center", d3.forceCenter(0, 0));

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
      {/* Botão de legenda */}
      <button className="legend-btn" onClick={() => setShowLegend(true)}> Ver legenda </button>
    
      {/* Pop up com a informação da legenda */}
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