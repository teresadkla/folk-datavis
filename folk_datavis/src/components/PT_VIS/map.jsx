import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/mapstyles.css";

// Carrega o script do Perlin noise a partir da pasta public
const script = document.createElement('script');
script.src = '/perlin.js';
document.head.appendChild(script);

const width = 1500;
const height = 900;

// Extrai o ano a partir de uma string no formato "15 de março de 1980"
const extractYear = (dateString) => {
  const match = dateString.match(/(\d{1,2})\s+de\s+([a-zA-Z]+)\s+de\s+(\d{4})/);
  return match ? match[3] : null;
};

const PortugalMap = ({ active }) => {
  const svgRef = useRef(); // Referência ao SVG
  const [year, setYear] = useState(""); // Ano selecionado
  const [data, setData] = useState([]); // CSV com os registos
  const [geojson, setGeojson] = useState(null); // GeoJSON de Portugal
  const [selectedDistrictData, setSelectedDistrictData] = useState(null); // Info do distrito clicado
  const [clickedDistrict, setClickedDistrict] = useState(null); // Distrito clicado

  // Inicializa o mapa e carrega dados
  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Cria grupos para elementos do mapa
    const g = svg.append("g");
    g.append("g").attr("class", "map-group");
    g.append("g").attr("class", "labels-group");
    g.append("g").attr("class", "circles-group");
    g.append("g").attr("class", "lines-group");

    // Projeções para o continente e ilhas
    const projectionMainland = d3.geoMercator().center([-8, 39.5]).scale(6000).translate([width / 2, height / 2]);
    const projectionAzores = d3.geoMercator().center([-28, 38]).scale(12000).translate([300, 780]);
    const projectionMadeira = d3.geoMercator().center([-17, 32.6]).scale(14000).translate([480, 800]);

    // Funções de caminho (path) para desenhar distritos
    const pathMainland = d3.geoPath().projection(projectionMainland);
    const pathAzores = d3.geoPath().projection(projectionAzores);
    const pathMadeira = d3.geoPath().projection(projectionMadeira);

    // Carrega os dados GeoJSON e CSV
    Promise.all([
      d3.json("/Portugal.json"),
      d3.csv("VIMEO_V8.csv")
    ]).then(([geojsonData, csvData]) => {
      setGeojson(geojsonData);
      setData(csvData);

      // Desenha os distritos com animação
      g.select(".map-group")
        .selectAll("path")
        .data(geojsonData.features)
        .enter()
        .append("path")
        .attr("class", "distrito")
        .attr("opacity", 0)
        .attr("d", d => {
          const name = d.properties.name;
          if (name === "Azores") return pathAzores(d);
          if (name === "Madeira") return pathMadeira(d);
          return pathMainland(d);
        })
        .transition()
        .duration(1000)
        .attr("opacity", 0.6);

      // Adiciona os nomes dos distritos
      g.select(".labels-group")
        .selectAll("text")
        .data(geojsonData.features)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("transform", d => {
          const name = d.properties.name;
          const centroid =
            name === "Azores" ? pathAzores.centroid(d) :
            name === "Madeira" ? pathMadeira.centroid(d) :
            pathMainland.centroid(d);
          return `translate(${centroid})`;
        })
        .text(d => d.properties.name);
    });

    // Cleanup ao desmontar
    return () => {
      svg.selectAll("*").remove();
    };
  }, []);

  // Anima o fade-in do mapa quando a visualização se torna ativa
  useEffect(() => {
    if (!active) return;
    const svg = d3.select(svgRef.current);
    svg.style("opacity", 0);
    svg.transition().duration(1000).style("opacity", 1);
  }, [active]);

  // Gera linhas curvas com ruído Perlin entre distritos
  const createPerlinLine = (sourceX, sourceY, targetX, targetY) => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const curveIntensity = Math.min(distance * 0.5, 50);
    const time = Date.now() * 0.0001;
    const noiseScale = 0.02;
    const perlinOffset = window.noise ? window.noise.perlin3(midX * noiseScale, midY * noiseScale, time) * 100 : 0;
    const controlX = midX + (perpX * curveIntensity) + perlinOffset;
    const controlY = midY + (perpY * curveIntensity) + perlinOffset;

    // Cria caminho com Bezier + ruído
    const segments = 300;
    let path = `M ${sourceX} ${sourceY}`;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const mt = 1 - t;
      const x = mt * mt * sourceX + 2 * mt * t * controlX + t * t * targetX;
      const y = mt * mt * sourceY + 2 * mt * t * controlY + t * t * targetY;
      const segmentNoise = window.noise ? window.noise.perlin3(x * noiseScale * 2, y * noiseScale * 2, time) * 8 : 0;
      const segmentNoiseY = window.noise ? window.noise.perlin3(y * noiseScale * 2, x * noiseScale * 2, time + 100) * 8 : 0;
      path += ` L ${x + segmentNoise} ${y + segmentNoiseY}`;
    }

    return path;
  };

  // Atualiza o mapa quando muda o ano, dados ou distrito clicado
  useEffect(() => {
    if (!geojson || !data.length) return;

    const filtered = year ? data.filter(d => extractYear(d["Data"]) === year) : data;
    const svg = d3.select(svgRef.current);
    const g = svg.select("g");

    // Projeções
    const projectionMainland = d3.geoMercator().center([-8, 39.5]).scale(6000).translate([width / 2, height / 2]);
    const projectionAzores = d3.geoMercator().center([-28, 38]).scale(12000).translate([300, 780]);
    const projectionMadeira = d3.geoMercator().center([-17, 32.6]).scale(14000).translate([480, 800]);

    const pathMainland = d3.geoPath().projection(projectionMainland);
    const pathAzores = d3.geoPath().projection(projectionAzores);
    const pathMadeira = d3.geoPath().projection(projectionMadeira);

    // Calcula os círculos com temas por distrito
    const circles = geojson.features.map(d => {
      const name = d.properties.name;
      const centroid =
        name === "Azores" ? pathAzores.centroid(d) :
        name === "Madeira" ? pathMadeira.centroid(d) :
        pathMainland.centroid(d);

      return {
        distrito: name,
        cx: centroid[0],
        cy: centroid[1],
        temas: filtered
          .filter(item => item["Distrito/Ilha"] === name)
          .map(item => item["Tema"])
      };
    });

    // Renderiza os círculos nos distritos
    g.select(".circles-group")
      .selectAll("circle")
      .data(circles)
      .join(
        enter => enter.append("circle")
          .attr("cx", d => d.cx)
          .attr("cy", d => d.cy)
          .attr("r", 0)
          .attr("fill", "#DB8671")
          .attr("fill-opacity", 0.5)
          .style("cursor", "pointer")
          .on("click", (event, d) => {
            setSelectedDistrictData({
              distrito: d.distrito,
              totalTemas: d.temas.length,
              temas: d.temas,
              ano: year
            });
            setClickedDistrict(d);
          })
          .transition()
          .duration(800)
          .attr("r", d => Math.sqrt(d.temas.length) * 2),
        update => update.transition().duration(800).attr("r", d => Math.sqrt(d.temas.length) * 2)
      );

    // Remove linhas anteriores
    g.select(".lines-group").selectAll("path").remove();

    if (clickedDistrict) {
      // Identifica distritos com temas comuns ao clicado
      const temasSelecionados = new Set(clickedDistrict.temas);
      const relatedCoords = circles.filter(d => {
        if (d.distrito === clickedDistrict.distrito) return false;
        return d.temas.some(t => temasSelecionados.has(t));
      });

      const newLines = relatedCoords.map(d => ({
        sourceX: clickedDistrict.cx,
        sourceY: clickedDistrict.cy,
        targetX: d.cx,
        targetY: d.cy,
        temasComuns: d.temas.filter(t => temasSelecionados.has(t)),
      }));

      // Cria tooltip para os temas em comum
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip-line")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "6px 10px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "6px")
        .style("font-size", "14px")
        .style("pointer-events", "none")
        .style("opacity", 0);

      // Desenha as linhas animadas com ruído Perlin
      g.select(".lines-group")
        .selectAll("path")
        .data(newLines)
        .join("path")
        .attr("d", d => createPerlinLine(d.sourceX, d.sourceY, d.targetX, d.targetY))
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 1.8)
        .attr("fill", "none")
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 0.95);
          tooltip
            .html(`<strong>Temas comuns:</strong><br>${[...new Set(d.temasComuns)].join("<br>")}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mousemove", (event) => {
          tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => {
          tooltip.transition().duration(300).style("opacity", 0);
        });

      // Animação contínua das linhas com Perlin
      if (window.noise) {
        const animateLines = () => {
          g.select(".lines-group")
            .selectAll("path")
            .attr("d", d => createPerlinLine(d.sourceX, d.sourceY, d.targetX, d.targetY));
          requestAnimationFrame(animateLines);
        };
        animateLines();
      }
    }
  }, [year, geojson, data, clickedDistrict]);

  // Lista única e ordenada dos anos disponíveis
  const anosUnicos = [...new Set(data.map(d => extractYear(d["Data"])))].filter(Boolean).sort();

  return (
    <div className="map-info">
      <div className="map-timeline-container">
        {/* Mapa */}
        <svg ref={svgRef}></svg>

        {/* Botões de timeline */}
        <div className="timeline-container">
          <button className="timeline-button" onClick={() => {
            setYear("");
            setClickedDistrict(null);
          }}>Mostrar todos os anos</button>

          {anosUnicos.map((ano, index) => (
            <button
              className="timeline-button"
              key={index}
              onClick={() => {
                setYear(ano);
                setClickedDistrict(null);
              }}
            >
              {ano}
            </button>
          ))}
        </div>
      </div>

      {/* Caixa de informação ao clicar num distrito */}
      {selectedDistrictData && (
        <div className="info-section-map">
          <button
            className="close-button"
            onClick={() => {
              setSelectedDistrictData(null);
              setClickedDistrict(null);
            }}
          >
            ×
          </button>
          <h2>{selectedDistrictData.distrito}</h2>
          <p><strong>{selectedDistrictData.totalTemas}</strong> temas {selectedDistrictData.ano ? `em ${selectedDistrictData.ano}` : "no total"}</p>
          <h4>Temas:</h4>
          <ul>
            {selectedDistrictData.temas.map((tema, i) => (
              <li key={i}>{tema}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PortugalMap;
