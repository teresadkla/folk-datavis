import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../../css/mapstyles.css";

// Carrega o script do Perlin noise a partir da pasta public (usado para animar linhas curvas)
const script = document.createElement('script');
script.src = '/perlin.js';
document.head.appendChild(script);

const width = 1500;
const height = 900;

// Função auxiliar para extrair o ano de uma string de data no formato "12 de Março de 2023"
const extractYear = (dateString) => {
  const match = dateString.match(/(\d{1,2})\s+de\s+([a-zA-Z]+)\s+de\s+(\d{4})/);
  return match ? match[3] : null;
};

const PortugalMap = ({ active }) => {
  const svgRef = useRef();
  const [year, setYear] = useState(""); // Ano selecionado na timeline
  const [data, setData] = useState([]); // Dados do CSV
  const [geojson, setGeojson] = useState(null); // Dados GeoJSON do mapa
  const [selectedDistrictData, setSelectedDistrictData] = useState(null); // Dados do distrito selecionado
  const [clickedDistrict, setClickedDistrict] = useState(null); // Distrito clicado
  const [showLegend, setShowLegend] = useState(false); // Estado para mostrar/ocultar legenda

  // Efeito para desenhar o mapa e carregar dados iniciais
  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Cria grupos para diferentes elementos do SVG
    const g = svg.append("g");
    g.append("g").attr("class", "map-group");
    g.append("g").attr("class", "labels-group");
    g.append("g").attr("class", "circles-group");
    g.append("g").attr("class", "lines-group");

    // Projeções diferentes para Portugal Continental, Açores e Madeira
    const projectionMainland = d3.geoMercator().center([-8, 39.5]).scale(6000).translate([width / 2, height / 2]);
    const projectionAzores = d3.geoMercator().center([-28, 38]).scale(12000).translate([300, 780]);
    const projectionMadeira = d3.geoMercator().center([-17, 32.6]).scale(14000).translate([480, 800]);

    const pathMainland = d3.geoPath().projection(projectionMainland);
    const pathAzores = d3.geoPath().projection(projectionAzores);
    const pathMadeira = d3.geoPath().projection(projectionMadeira);

    // Carrega dados GeoJSON e CSV em paralelo
    Promise.all([
      d3.json("/Portugal.json"),
      d3.csv("VIMEO_V8.csv")
    ]).then(([geojsonData, csvData]) => {
      setGeojson(geojsonData);
      setData(csvData);

      // Desenha os distritos/ilhas no mapa
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

      // Adiciona os nomes dos distritos/ilhas
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

    // Limpa o SVG ao desmontar o componente
    return () => {
      svg.selectAll("*").remove();
    };
  }, []);

  // Efeito para animar a opacidade do mapa quando o componente fica ativo
  useEffect(() => {
    if (!active) return;
    const svg = d3.select(svgRef.current);
    svg.style("opacity", 0);
    svg.transition().duration(1000).style("opacity", 1);
  }, [active]);

  // Função para criar linhas curvas com Perlin noise entre distritos
  const createPerlinLine = (sourceX, sourceY, targetX, targetY) => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const curveIntensity = Math.min(distance * 0.5, 50);
    const time = Date.now() * 0.00001;
    const noiseScale = 0.02;
    // Aplica Perlin noise ao ponto de controlo da curva
    const perlinOffset = window.noise ? window.noise.perlin3(midX * noiseScale, midY * noiseScale, time) * 100 : 0;
    const controlX = midX + (perpX * curveIntensity) + perlinOffset;
    const controlY = midY + (perpY * curveIntensity) + perlinOffset;

    // Gera a linha curva com vários segmentos e ruído
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

  // Efeito para desenhar círculos e linhas de ligação entre distritos com temas em comum
  useEffect(() => {
    if (!geojson || !data.length) return;

    // Filtra dados pelo ano selecionado (se houver)
    const filtered = year ? data.filter(d => extractYear(d["Data"]) === year) : data;
    const svg = d3.select(svgRef.current);
    const g = svg.select("g");

    // Projeções para cada região
    const projectionMainland = d3.geoMercator().center([-8, 39.5]).scale(6000).translate([width / 2, height / 2]);
    const projectionAzores = d3.geoMercator().center([-28, 38]).scale(12000).translate([300, 780]);
    const projectionMadeira = d3.geoMercator().center([-17, 32.6]).scale(14000).translate([480, 800]);

    const pathMainland = d3.geoPath().projection(projectionMainland);
    const pathAzores = d3.geoPath().projection(projectionAzores);
    const pathMadeira = d3.geoPath().projection(projectionMadeira);

    // Calcula os círculos para cada distrito/ilha
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

    // Desenha os círculos (tamanho proporcional ao nº de temas)
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

    // Remove linhas antigas antes de desenhar novas
    g.select(".lines-group").selectAll("path").remove();

    // Se um distrito foi clicado, desenha linhas para distritos com temas em comum
    if (clickedDistrict) {
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

      // Tooltip para mostrar temas comuns ao passar o rato sobre as linhas
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

      // Desenha as linhas curvas animadas
      g.select(".lines-group")
        .selectAll("path")
        .data(newLines)
        .join("path")
        .attr("d", d => createPerlinLine(d.sourceX, d.sourceY, d.targetX, d.targetY))
        .attr("stroke", "#6B3F21")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", d => 1 + d.temasComuns.length * 0.2) // Espessura dinâmica
        .attr("fill", "none")
        .style("cursor", "pointer") // <-- Adicionado cursor pointer
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

      // Anima as linhas se o Perlin noise estiver disponível
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

  // Lista de anos únicos presentes nos dados
  const anosUnicos = [...new Set(data.map(d => extractYear(d["Data"])))].filter(Boolean).sort();

  return (
    <div className="map-info">
      <div className="map-timeline-container">
        {/* SVG do mapa */}
        <svg ref={svgRef}></svg>

        {/* Timeline de anos e botões de controlo */}
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
      {/* Botão para mostrar a legenda */}
      {/* <button className="map-legenda-btn" onClick={() => setShowLegend(true)}> Ver legenda</button> */}

      {/* Pop-up com informação do distrito selecionado */}
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
            {Object.entries(
              selectedDistrictData.temas.reduce((acc, tema) => {
                acc[tema] = (acc[tema] || 0) + 1;
                return acc;
              }, {})
            )
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([tema, count], i) => (
                <li key={i}>
                  {tema} {count > 1 && <span>({count})</span>}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Pop-up da legenda */}
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
            <ul>
              <li><strong>Círculos:</strong> Representam a quantidade de temas por distrito.</li>
              <li><strong>Linhas curvas:</strong> Conexões entre distritos com temas em comum.</li>
              <li><strong>Tamanho do círculo:</strong> Proporcional ao número de temas.</li>
              <li><strong>Cor dos círculos:</strong> Fixa, com opacidade para sobreposição.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortugalMap;
