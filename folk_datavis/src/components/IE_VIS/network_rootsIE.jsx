import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/ramification.css";

// Importar o script perlin.js do public
const script = document.createElement('script');
script.src = '/perlin.js';
document.head.appendChild(script);

const NetworkDiagramIE = () => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    const width = 1000;
    const height = 800;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const container = svg.append("g")
      .attr("transform", `scale(0.7) translate(${width * 0.10}, ${height * 0.10})`);

    const tooltip = d3.select(tooltipRef.current);
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const sizeScale = d3.scaleLinear().range([10, 35]);

    d3.json("rootsVis1.json").then(data => {
  const temasFiltrados = Object.fromEntries(
  Object.entries(data.temasFiltrados).filter(([_, tema]) => tema.totalOcorrencias > 800)
);

      const nodes = [];
      const links = [];
      const nodeById = {};
      const modeSet = new Set();

      // Get max occurrences to scale sizes
      const maxCount = d3.max(Object.values(temasFiltrados), d => d.totalOcorrencias);
      sizeScale.domain([1, maxCount]);

      // Criar nodes e links
      for (const temaKey in temasFiltrados) {
        const tema = temasFiltrados[temaKey];
        const nomeMusica = tema.nomeMusica;
        const count = tema.totalOcorrencias;

        // Node da música
        if (!nodeById[nomeMusica]) {
          const musicaNode = { id: nomeMusica, type: "name", count };
          nodes.push(musicaNode);
          nodeById[nomeMusica] = musicaNode;
        }

        // Nodes dos modos + links
        tema.ligacoes.forEach(lig => {
          const modo = lig.modo;
          modeSet.add(modo);

          if (!nodeById[modo]) {
            const modoNode = { id: modo, type: "mode" };
            nodes.push(modoNode);
            nodeById[modo] = modoNode;
          }

          links.push({
            source: nomeMusica,
            target: modo,
            value: lig.ocorrencias
          });
        });
      }

      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(150).strength(1))
        .force("charge", d3.forceManyBody().strength(-1000))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .alphaDecay(0.05); // Valor padrão é 0.022, maior = estabiliza mais rápido

      const link = container.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("stroke", "#6B3F21")
        .attr("stroke-width", d => Math.min(Math.sqrt(d.value), 8)) // Valor máximo de 8
        .attr("stroke-opacity", 0.6)
        .attr("fill", "none");
        // .attr("filter", "url(#linkTurbulence)");

      const node = container.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", d => d.type === "name" ? sizeScale(d.count) : 10)
        // .attr("fill", d => d.type === "mode" ? color(d.id) : "#5193AE")//Cor dos names e modes
        .attr("fill", d => d.type === "mode" ? "#82813E" : "#5193AE")//Cor dos names e modes
        .attr("fill-opacity", 0.9)
        .on("mouseover", (event, d) => {
          if (d.type === "name") {
            tooltip.style("display", "block")
              .html(`<strong>${d.id}</strong><br/>Ocorrências: ${d.count}`);
          }
        })
        .on("mousemove", (event) => {
          tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
          tooltip.style("display", "none");
        })
        .on("click", (event, d) => {
          if (d.type === "name") {
            highlightConnections(d.id);
          }
          event.stopPropagation();
        })
        .call(drag(simulation));

      const label = container.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text(d => d.type === "mode" ? d.id : "")
        .attr("font-size", "10px")
        .attr("dx", 10)
        .attr("dy", "0.35em")
        .style("opacity", 0);

      // Atualiza posições a cada tick da simulação
 simulation.on("tick", () => {
    link.attr("d", d => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Ponto de controle para a curva (ponto médio com offset perpendicular)
      const midX = (d.source.x + d.target.x) / 2;
      const midY = (d.source.y + d.target.y) / 2;
      
      // Criar offset perpendicular para a curva
      const perpX = -dy / distance;
      const perpY = dx / distance;
      
      // Intensidade da curva baseada na distância
      const curveIntensity = Math.min(distance * 0.5, 50);
      
      // Aplicar ruído de Perlin ao ponto de controle
      const time = Date.now() * 0.00001; // para animação suave
      const noiseScale = 0.02;
      const perlinOffset = noise.perlin3(midX * noiseScale, midY * noiseScale, time) * 100;
      
      // Ponto de controle final com ruído
      const controlX = midX + (perpX * curveIntensity) + perlinOffset;
      const controlY = midY + (perpY * curveIntensity) + perlinOffset;
      
      // Criar curva de Bézier quadrática com múltiplos pontos para aplicar ruído
      const segments = 50; // estava 15
      let path = `M ${d.source.x} ${d.source.y}`;
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const t2 = t * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        
        // Ponto na curva de Bézier
        const x = mt2 * d.source.x + 2 * mt * t * controlX + t2 * d.target.x;
        const y = mt2 * d.source.y + 2 * mt * t * controlY + t2 * d.target.y;
        
        // Aplicar ruído de Perlin adicional a cada segmento
        const segmentNoise = noise.perlin3(x * noiseScale * 2, y * noiseScale * 2, time) * 8;
        const segmentNoiseY = noise.perlin3(y * noiseScale * 2, x * noiseScale * 2, time + 100) * 8;
        
        path += ` L ${x + segmentNoise} ${y + segmentNoiseY}`;
      }
      
      return path;
    });

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
  });


         // Função para permitir arrastar nós
      function drag(simulation) {
        return d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          });
      }

      function highlightConnections(selectedId) {
        node.style("opacity", n =>
          n.id === selectedId || links.some(l =>
            (l.source.id === selectedId && l.target.id === n.id) ||
            (l.target.id === selectedId && l.source.id === n.id)
          ) ? 1 : 0.1
        );

        link.style("opacity", l =>
          l.source.id === selectedId || l.target.id === selectedId ? 1 : 0.1
        );

        label.style("opacity", n =>
          n.type === "mode" && links.some(l =>
            (l.source.id === selectedId && l.target.id === n.id) ||
            (l.target.id === selectedId && l.source.id === n.id)
          ) ? 1 : 0
        );
      }

      svg.on("click", () => {
        node.style("opacity", 1);
        link.style("opacity", 0.6);
        label.style("opacity", 0);
      });
    });
  }, []);

  return (
    <div>
      <svg ref={svgRef}></svg>
      <div ref={tooltipRef} className="tooltipIE" style={{ position: "absolute", display: "none" }}></div>
      <button
        className="legend-btn-IE"
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
        </div>
      )}
    </div>
  );
};

export default NetworkDiagramIE;