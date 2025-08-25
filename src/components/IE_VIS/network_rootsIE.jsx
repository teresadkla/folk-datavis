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

    // Adicionar a escala específica para as flores
    const flowerSizeScale = d3.scaleLinear().range([0.2, 0.5]);

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
      const minCount = d3.min(Object.values(temasFiltrados), d => d.totalOcorrencias);
      
      sizeScale.domain([1, maxCount]);
      
      // Definir domínio da escala das flores
      flowerSizeScale.domain([minCount, maxCount]);
      
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

      // Definir o flower path
      const flowerPath = "M67.39,57.82c-6.8-.16-12.45,5.22-12.62,12.02-.16,6.8,5.22,12.45,12.02,12.62,6.8.16,12.45-5.22,12.62-12.02.16-6.8-5.22-12.45-12.02-12.62ZM112.48,69.24c11.24-6.03,22.01-15.76,21.15-30.79-.23-4.07-1.9-8.02-4.99-10.68-3.89-3.35-10.8-5.67-22.48-.17,0,0,8.94-9.9.69-20.12-4.57-5.66-12.1-8.03-19.22-6.56-6.54,1.35-15.17,4.51-21.36,11.85-6.01-6.07-13.74-8.82-19.72-10.05-7.12-1.47-14.65.9-19.22,6.56-8.25,10.21.69,20.12.69,20.12-11.69-5.5-18.59-3.18-22.48.17-3.09,2.66-4.76,6.61-4.99,10.68-.86,15.03,9.9,24.75,21.15,30.79C10.45,77.07-.31,86.79.55,101.82c.23,4.07,1.9,8.02,4.99,10.68,3.89,3.35,10.79,5.67,22.48.17,0,0-8.94,9.9-.69,20.12,4.57,5.66,12.1,8.03,19.22,6.56,6.54-1.35,15.17-4.51,21.36-11.85,6.01,6.07,13.74,8.82,19.72,10.05,7.12,1.47,14.65-.9,19.22-6.56,8.25-10.21-.69-20.12-.69-20.12,11.69,5.5,18.59,3.18,22.48-.17,3.09-2.66,4.76-6.61,4.99-10.68.86-15.03-9.9-24.75-21.15-30.79ZM128.37,101.51c-4.52,13.95-20.14,3.6-20.14,3.6,3.81,1.85,17.55-3.93,7.43-13.16-10.12-9.24-15.06,4.51-15.06,4.51.14-13.57-6.54-14.26-11.52-12.9-3.93,1.08-7.13,4.18-7.84,8.2-1.53,8.62,9.03,11.55,9.03,11.55-11.01,8.94-2.16,15.12-2.16,15.12,10.25,5.46,13.53-4.98,13.53-4.98,4.96,20-12.02,17.82-12.02,17.82-8.24-.45-13.74-4.59-17.67-9.92,2.68-5.39,4.22-12.31,3.81-21.19-1.59.27-4.04,3.34-5.71,7.07-.8,1.8-1.67,3.94-2.68,6.21-1.27-2.74-2.32-5.49-3.26-8-1.28-3.42-4.11-6.8-5.71-7.07-.46,9.88,1.51,17.33,4.76,22.95-3.86,5.88-9.5,11-18.63,11.75,0,0-16.99,2.18-12.02-17.82,0,0,3.28,10.44,13.53,4.98,0,0,8.85-6.17-2.16-15.12,0,0,10.56-2.93,9.03-11.55-.71-4.02-3.91-7.12-7.84-8.2-4.98-1.36-11.66-.68-11.52,12.9,0,0-4.94-13.75-15.06-4.51-10.12,9.24,3.62,15.01,7.43,13.16,0,0-15.62,10.35-20.14-3.6-3-9.26,6.28-21.34,23.17-28.83,9.09,3.74,16.84,5.15,16.84,5.15-.27-3.98-3.03-7.34-6.87-8.43-.18-.05-.35-.11-.52-.16.18-.05.35-.11.52-.16,3.84-1.09,6.6-4.45,6.87-8.43,0,0-7.75,1.41-16.84,5.15C12.09,60.12,2.8,48.03,5.81,38.77c4.52-13.95,20.14-3.6,20.14-3.6-3.81-1.85-17.55,3.93-7.43,13.16,10.12,9.24,15.06-4.51,15.06-4.51-.14,13.57,6.54,14.26,11.52,12.9,3.93-1.08,7.13-4.18,7.84-8.2,1.53-8.62-9.03-11.55-9.03-11.55,11.01-8.94,2.16-15.12,2.16-15.12-10.25-5.46-13.53,4.98-13.53,4.98-4.96-20,12.02-17.82,12.02-17.82,8.05.65,13.85,4.57,17.92,9.46-2.82,5.46-4.48,12.51-4.05,21.64,1.59-.27,5.04-3.48,5.71-7.07.45-2.4,1.28-5.24,2.55-8.13,1.76,3.5,2.85,7.02,3.39,9.92.67,3.59,4.11,6.8,5.71,7.07.48-10.34-1.7-18.01-5.23-23.72,4.09-5.58,10.23-10.25,19.09-10.97,0,0,16.99-2.18,12.02,17.82,0,0-3.28-10.44-13.53-4.98,0,0-8.85,6.17,2.16,15.12,0,0-10.56,2.93-9.03,11.55.71,4.01,3.91,7.12,7.84,8.2,4.98,1.36,11.66.68,11.52-12.9,0,0,4.94,13.75,15.06,4.51,10.12-9.24-3.62-15.01-7.43-13.16,0,0,15.62-10.35,20.14,3.6,3,9.26-6.28,21.34-23.17,28.83-9.09-3.74-16.84-5.15-16.84-5.15.27,3.98,3.03,7.34,6.87,8.43.18.05.35.11.52.16-.18.05-.35.11-.52.16-3.84,1.09-6.6,4.45-6.87,8.43,0,0,7.75-1.41,16.84-5.15,16.89,7.49,26.18,19.57,23.17,28.83Z";

      const node = container.append("g")
        .attr("class", "nodes")
        .selectAll("path")
        .data(nodes)
        .join("path")
        .attr("class", d => `node ${d.type}`)
        .attr("d", d => {
          if (d.type === "name") {
            return flowerPath;
          } else {
            return d3.symbol().type(d3.symbolCircle).size(314)();
          }
        })
        .attr("fill", d => d.type === "mode" ? "#5193AE" : "#82813E")
        .attr("fill-opacity", 0.9)
        .attr("transform", d => {
          if (d.type === "name") {
            const scale = flowerSizeScale(d.count);
            const offset = -60 * scale;
            return `translate(${(d.x || 0) + offset}, ${(d.y || 0) + offset}) scale(${scale})`;
          } else {
            return `translate(${d.x || 0}, ${d.y || 0})`;
          }
        })
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

        node.attr("transform", d => {
          if (d.type === "name") {
            const scale = flowerSizeScale(d.count);
            const offset = -60 * scale;
            return `translate(${d.x + offset}, ${d.y + offset}) scale(${scale})`;
          } else {
            return `translate(${d.x}, ${d.y})`;
          }
        });
        
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
      {/* <button
        className="legend-btn-IE"
        onClick={() => setShowLegend(true)}
      >
        Ver legenda
      </button> */}
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
            <h3>Legenda do gráfico</h3>
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